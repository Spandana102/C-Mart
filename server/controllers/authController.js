
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Resend } = require("resend");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");

// ==========================================
// CONFIGURATION
// ==========================================

const CAMPUS_COLLEGE_ID = "189";
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const googleClient = new OAuth2Client();

const normalizeEmail = (email) =>
  String(email || "").trim().toLowerCase();

const getGoogleClientId = () =>
  String(process.env.GOOGLE_CLIENT_ID || "")
    .trim()
    .replace(/^["']|["']$/g, "");

const hashOTP = (otp) =>
  crypto
    .createHash("sha256")
    .update(String(otp))
    .digest("hex");

const isValidOTP = (otp) =>
  /^\d{6}$/.test(String(otp ?? "").trim());

const isBlocked = (user) =>
  user?.isBlocked === true ||
  String(user?.status || "").toLowerCase() === "blocked";

// ==========================================
// PUBLIC USER DETAILS
// ==========================================

const publicUser = (user) => ({
  _id: user._id,
  id: user._id.toString(),
  fullName: user.fullName,
  email: user.email,
  collegeId: user.collegeId,
  phoneNumber: user.phoneNumber || "",
  role: user.role || "user",
  authProvider: user.authProvider || "local",
  profilePicture: user.profilePicture || "",
});

// ==========================================
// CREATE JWT
// ==========================================

const createToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role || "user",
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// ==========================================
// REGISTER USER
// ==========================================

const registerUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phoneNumber,
    } = req.body || {};

    if (
      typeof fullName !== "string" ||
      fullName.trim().length < 2 ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      password.length < 6 ||
      typeof phoneNumber !== "string" ||
      !/^\d{10}$/.test(phoneNumber.trim())
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a valid name, email, 10-digit phone number and password of at least 6 characters.",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered. Please login.",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phoneNumber: phoneNumber.trim(),
      collegeId: CAMPUS_COLLEGE_ID,
      authProvider: "local",
      role: "user",
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Register Error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    return res.status(
      error.name === "ValidationError" ? 400 : 500
    ).json({
      success: false,
      message:
        error.name === "ValidationError"
          ? error.message
          : "Registration failed",
    });
  }
};

// ==========================================
// EMAIL / PASSWORD LOGIN
// ==========================================

const loginUser = async (req, res) => {
  try {
    const {
      email,
      password,
      loginType,
    } = req.body || {};

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: normalizeEmail(email),
    }).select("+password");

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (isBlocked(user)) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked.",
      });
    }

    const actualRole = user.role || "user";

    if (
      loginType === "admin" &&
      actualRole !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This account does not have admin access.",
      });
    }

    if (
      loginType === "user" &&
      actualRole === "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Please use Admin Login.",
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// ==========================================
// GOOGLE LOGIN
// ==========================================

const googleLogin = async (req, res) => {
  try {
    const { credential, loginType } = req.body || {};

    if (
      typeof credential !== "string" ||
      !credential.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required",
      });
    }

    const googleClientId = getGoogleClientId();

    if (!googleClientId || !process.env.JWT_SECRET) {
      console.error("Google configuration missing:", {
        clientIdLoaded: Boolean(googleClientId),
        jwtSecretLoaded: Boolean(process.env.JWT_SECRET),
      });

      return res.status(500).json({
        success: false,
        message:
          "Google authentication is not configured.",
      });
    }

    if (
      !googleClientId.endsWith(
        ".apps.googleusercontent.com"
      )
    ) {
      return res.status(500).json({
        success: false,
        message: "Google Client ID format is invalid.",
      });
    }

    const credentialText = credential.trim();

    // Only used for diagnostics.
    // Decoded token is never trusted for login.
    let tokenAudience = "";

    try {
      const parts = credentialText.split(".");

      if (parts.length === 3) {
        const decoded = JSON.parse(
          Buffer.from(
            parts[1],
            "base64url"
          ).toString("utf8")
        );

        tokenAudience =
          typeof decoded.aud === "string"
            ? decoded.aud
            : "";
      }
    } catch (_) {
      console.error(
        "Could not inspect Google token audience."
      );
    }

    const fingerprint = (value) =>
      value
        ? crypto
            .createHash("sha256")
            .update(value)
            .digest("hex")
            .slice(0, 12)
        : "missing";

    console.log("Google OAuth Debug:", {
      backendClientIdFingerprint:
        fingerprint(googleClientId),
      tokenAudienceFingerprint:
        fingerprint(tokenAudience),
      clientIdsMatch:
        Boolean(tokenAudience) &&
        tokenAudience === googleClientId,
    });

    let payload;

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credentialText,
        audience: googleClientId,
      });

      payload = ticket.getPayload();
    } catch (verificationError) {
      const detail = String(
        verificationError?.message ||
        "Unknown Google verification error"
      );

      // Avoid logging the raw credential.
      console.error(
        "Google ID Token Verification Failed:",
        detail
      );

      const audienceMismatch =
        /wrong recipient|audience|aud/i.test(detail);

      const expired =
        /expired|too late|expir/i.test(detail);

      return res.status(401).json({
        success: false,
        message: audienceMismatch
          ? "Google Client ID mismatch. Check client/.env and server/.env."
          : expired
          ? "Google login expired. Please sign in again."
          : "Google verification failed. Check backend terminal.",
      });
    }

    if (
      !payload?.sub ||
      !payload?.email ||
      payload.email_verified !== true
    ) {
      return res.status(401).json({
        success: false,
        message: "Google account email is not verified.",
      });
    }

    const email = normalizeEmail(payload.email);
    const googleId = String(payload.sub);

    let user = await User.findOne({
      googleId,
    }).select("+googleId");

    if (!user) {
      const existingEmailUser = await User.findOne({
        email,
      });

      // Never auto-link password accounts by email.
      if (existingEmailUser) {
        return res.status(409).json({
          success: false,
          message:
            "An account with this email already exists. Please use your existing login method.",
        });
      }

      // Prevent self-registration as admin.
      if (loginType === "admin") {
        return res.status(403).json({
          success: false,
          message:
            "This Google account is not registered as an administrator.",
        });
      }

      const googleName = String(
        payload.name || email.split("@")[0]
      )
        .trim()
        .slice(0, 100);

      user = await User.create({
        fullName:
          googleName.length >= 2
            ? googleName
            : "Google User",
        email,
        googleId,
        authProvider: "google",
        profilePicture: payload.picture || "",
        collegeId: CAMPUS_COLLEGE_ID,
        role: "user",
      });
    }

    if (normalizeEmail(user.email) !== email) {
      return res.status(403).json({
        success: false,
        message: "Google account identity mismatch.",
      });
    }

    if (isBlocked(user)) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked.",
      });
    }

    const actualRole = user.role || "user";

    if (
      loginType === "admin" &&
      actualRole !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Admin access denied.",
      });
    }

    if (
      loginType === "user" &&
      actualRole === "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Please select Admin Login.",
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error(
      "Google Login Error:",
      error.message
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Account already exists. Please use your existing login method.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Google login failed",
    });
  }
};

// ==========================================
// GET PROFILE
// ==========================================

const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (isBlocked(user)) {
      return res.status(403).json({
        success: false,
        message: "Account is blocked",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      user: publicUser(user),
    });
  } catch (error) {
    console.error(
      "Get Profile Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

// ==========================================
// UPDATE PROFILE
// ==========================================

const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const {
      fullName,
      phoneNumber,
    } = req.body || {};

    const updates = {
      collegeId: CAMPUS_COLLEGE_ID,
    };

    if (fullName !== undefined) {
      if (
        typeof fullName !== "string" ||
        fullName.trim().length < 2
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Full name must contain at least 2 characters.",
        });
      }

      updates.fullName = fullName.trim();
    }

    if (phoneNumber !== undefined) {
      if (
        typeof phoneNumber !== "string" ||
        !/^\d{10}$/.test(phoneNumber.trim())
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Enter a valid 10-digit phone number.",
        });
      }

      updates.phoneNumber = phoneNumber.trim();
    }

    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (isBlocked(existingUser)) {
      return res.status(403).json({
        success: false,
        message: "Account is blocked",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: publicUser(user),
    });
  } catch (error) {
    console.error(
      "Update Profile Error:",
      error.message
    );

    return res.status(
      error.name === "ValidationError" ? 400 : 500
    ).json({
      success: false,
      message:
        error.name === "ValidationError"
          ? error.message
          : "Failed to update profile",
    });
  }
};

// ==========================================
// FORGOT PASSWORD - SEND OTP
// ==========================================

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const message =
      "If this email is registered, an OTP will be sent.";

    const user = await User.findOne({
      email: normalizeEmail(email),
    }).select(
      "+password +resetPasswordToken +resetPasswordExpires"
    );

    if (!user || isBlocked(user)) {
      return res.status(200).json({
        success: true,
        message,
      });
    }

    // Google-only users do not have local passwords.
    if (
      user.authProvider === "google" &&
      !user.password
    ) {
      return res.status(200).json({
        success: true,
        message,
      });
    }

    // OTP cooldown
    if (
      user.resetPasswordToken &&
      user.resetPasswordExpires
    ) {
      const expiryTime = new Date(
        user.resetPasswordExpires
      ).getTime();

      const createdTime =
        expiryTime - OTP_EXPIRY_MS;

      const elapsed = Date.now() - createdTime;

      if (
        elapsed >= 0 &&
        elapsed < OTP_COOLDOWN_MS
      ) {
        return res.status(200).json({
          success: true,
          message:
            "Please check your inbox before requesting another OTP.",
        });
      }
    }

    const apiKey = String(
      process.env.RESEND_API_KEY || ""
    ).trim();

    const from = String(
      process.env.EMAIL_FROM || ""
    ).trim();

    if (!apiKey || !from) {
      console.error(
        "Resend email configuration is missing."
      );

      return res.status(500).json({
        success: false,
        message: "Email service is not configured.",
      });
    }

    // Secure 6-digit OTP
    const otp = crypto
      .randomInt(100000, 1000000)
      .toString();

    const otpHash = hashOTP(otp);

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: otpHash,
          resetPasswordExpires: new Date(
            Date.now() + OTP_EXPIRY_MS
          ),
          resetPasswordAttempts: 0,
        },
      }
    );

    try {
      const resend = new Resend(apiKey);

      const result = await resend.emails.send({
        from,
        to: user.email,
        subject: "C-MART Password Reset OTP",
        html: `
          <div style="font-family:Arial,sans-serif;padding:24px">
            <h2 style="color:#2563eb">C-MART Password Reset</h2>
            <p>You requested a password reset.</p>
            <p>Your verification code is:</p>
            <h1 style="letter-spacing:8px">${otp}</h1>
            <p>This code is valid for 10 minutes.</p>
            <p>Do not share this code with anyone.</p>
            <p>If you did not request this, ignore this email.</p>
            <p>C-MART Team</p>
          </div>
        `,
      });

      if (result.error) {
        throw new Error(
          result.error.message ||
          "Resend email delivery failed"
        );
      }
    } catch (emailError) {
      console.error(
        "OTP Email Error:",
        emailError.message
      );

      await User.updateOne(
        {
          _id: user._id,
          resetPasswordToken: otpHash,
        },
        {
          $unset: {
            resetPasswordToken: "",
            resetPasswordExpires: "",
            resetPasswordAttempts: "",
          },
        }
      );

      return res.status(502).json({
        success: false,
        message:
          "Unable to send OTP email. Please try again later.",
      });
    }

    return res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error(
      "Forgot Password Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to send OTP",
    });
  }
};

// ==========================================
// CHECK OTP HELPER
// ==========================================

const checkOTP = async (email, otp) => {
  const otpHash = hashOTP(String(otp).trim());

  const user = await User.findOne({
    email: normalizeEmail(email),
    resetPasswordExpires: {
      $gt: new Date(),
    },
  }).select(
    "+resetPasswordToken +resetPasswordAttempts"
  );

  if (
    !user ||
    !user.resetPasswordToken ||
    isBlocked(user)
  ) {
    return null;
  }

  if (
    (user.resetPasswordAttempts || 0) >=
    MAX_OTP_ATTEMPTS
  ) {
    return null;
  }

  const storedHash = String(
    user.resetPasswordToken
  );

  if (!/^[a-f0-9]{64}$/i.test(storedHash)) {
    return null;
  }

  const storedBuffer = Buffer.from(
    storedHash,
    "hex"
  );

  const providedBuffer = Buffer.from(
    otpHash,
    "hex"
  );

  const matches = crypto.timingSafeEqual(
    storedBuffer,
    providedBuffer
  );

  if (!matches) {
    await User.updateOne(
      {
        _id: user._id,
        resetPasswordExpires: {
          $gt: new Date(),
        },
        $or: [
          {
            resetPasswordAttempts: {
              $lt: MAX_OTP_ATTEMPTS,
            },
          },
          {
            resetPasswordAttempts: {
              $exists: false,
            },
          },
        ],
      },
      {
        $inc: {
          resetPasswordAttempts: 1,
        },
      }
    );

    return null;
  }

  return user;
};

// ==========================================
// VERIFY OTP
// ==========================================

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body || {};

    if (
      typeof email !== "string" ||
      !email.trim() ||
      !isValidOTP(otp)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid email and 6-digit OTP are required.",
      });
    }

    const user = await checkOTP(email, otp);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid, expired or locked OTP.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error(
      "Verify OTP Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to verify OTP",
    });
  }
};

// ==========================================
// RESET PASSWORD
// ==========================================

const resetPassword = async (req, res) => {
  try {
    const {
      email,
      otp,
      newPassword,
    } = req.body || {};

    if (
      typeof email !== "string" ||
      !email.trim() ||
      !isValidOTP(otp) ||
      typeof newPassword !== "string" ||
      newPassword.length < 6
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid email, OTP and password of at least 6 characters are required.",
      });
    }

    const user = await checkOTP(email, otp);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid, expired or locked OTP.",
      });
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      12
    );

    const result = await User.updateOne(
      {
        _id: user._id,
        resetPasswordToken: hashOTP(
          String(otp).trim()
        ),
        resetPasswordExpires: {
          $gt: new Date(),
        },
        $or: [
          {
            resetPasswordAttempts: {
              $lt: MAX_OTP_ATTEMPTS,
            },
          },
          {
            resetPasswordAttempts: {
              $exists: false,
            },
          },
        ],
      },
      {
        $set: {
          password: hashedPassword,
        },
        $unset: {
          resetPasswordToken: "",
          resetPasswordExpires: "",
          resetPasswordAttempts: "",
        },
      }
    );

    if (result.modifiedCount !== 1) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or already used.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Password reset successful. Please login.",
    });
  } catch (error) {
    console.error(
      "Reset Password Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Password reset failed",
    });
  }
};

// ==========================================
// EXPORT ALL CONTROLLERS
// ==========================================

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  getProfile,
  updateProfile,
  forgotPassword,
  verifyOTP,
  resetPassword,
};
