
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Resend } = require("resend");
const crypto = require("crypto");

const CAMPUS_COLLEGE_ID = "189";

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const normalizeEmail = (email) =>
  String(email || "").trim().toLowerCase();

const hashOTP = (otp) =>
  crypto
    .createHash("sha256")
    .update(String(otp))
    .digest("hex");

const isValidOTP = (otp) =>
  (typeof otp === "string" || typeof otp === "number") &&
  /^\d{6}$/.test(String(otp).trim());

const isBlocked = (user) =>
  user?.isBlocked === true ||
  String(user?.status || "").toLowerCase() === "blocked";

const publicUser = (user) => ({
  _id: user._id,
  id: user._id.toString(),
  fullName: user.fullName,
  email: user.email,
  collegeId: user.collegeId,
  phoneNumber: user.phoneNumber,
  role: user.role || "user",
});

const getEmailConfig = () => {
  const apiKey = String(process.env.RESEND_API_KEY || "").trim();
  const from = String(process.env.EMAIL_FROM || "").trim();

  return { apiKey, from };
};

const clearResetOTP = async (userId, otpHash) => {
  await User.updateOne(
    {
      _id: userId,
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
};

// ========================================
// REGISTER USER
// ========================================

const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, phoneNumber } =
      req.body || {};

    if (
      typeof fullName !== "string" ||
      !fullName.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      password.length < 6 ||
      typeof phoneNumber !== "string" ||
      !phoneNumber.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Provide valid name, email, phone number and password (minimum 6 characters)",
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

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      collegeId: CAMPUS_COLLEGE_ID,
      phoneNumber: phoneNumber.trim(),
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

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

// ========================================
// LOGIN USER
// ========================================

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};

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

    if (!user || typeof user.password !== "string") {
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
        message:
          "Your account has been blocked. Please contact the administrator.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Authentication configuration error",
      });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role || "user",
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

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

// ========================================
// GET PROFILE
// ========================================

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
    console.error("Get Profile Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

// ========================================
// UPDATE PROFILE
// ========================================

const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const { fullName, phoneNumber } = req.body || {};

    const updates = {
      collegeId: CAMPUS_COLLEGE_ID,
    };

    if (fullName !== undefined) {
      if (
        typeof fullName !== "string" ||
        !fullName.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Full name cannot be empty",
        });
      }

      updates.fullName = fullName.trim();
    }

    if (phoneNumber !== undefined) {
      if (
        typeof phoneNumber !== "string" ||
        !phoneNumber.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Phone number cannot be empty",
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
    console.error("Update Profile Error:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

// ========================================
// FORGOT PASSWORD - SEND OTP
// ========================================

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (typeof email !== "string" || !email.trim()) {
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
      "+resetPasswordToken +resetPasswordExpires"
    );

    // Do not reveal whether an email is registered.
    if (!user || isBlocked(user)) {
      return res.status(200).json({
        success: true,
        message,
      });
    }

    // Limit repeated OTP requests to one per minute.
    if (
      user.resetPasswordToken &&
      user.resetPasswordExpires
    ) {
      const expiryTime = new Date(
        user.resetPasswordExpires
      ).getTime();

      const createdTime = expiryTime - OTP_EXPIRY_MS;
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

    const { apiKey, from } = getEmailConfig();

    if (!apiKey || !from) {
      console.error("C-Mart Email Configuration:", {
        RESEND_API_KEY_loaded: Boolean(apiKey),
        EMAIL_FROM_loaded: Boolean(from),
      });

      return res.status(500).json({
        success: false,
        message: "Email service is not configured",
      });
    }

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

      const { error } = await resend.emails.send({
        from,
        to: user.email,
        subject: "C-Mart Password Reset OTP",
        html: `
          <div style="font-family:Arial,sans-serif;padding:24px">
            <h2 style="color:#2563eb">C-Mart Password Reset</h2>
            <p>You requested a password reset.</p>
            <p>Your verification code is:</p>
            <h1 style="letter-spacing:8px">${otp}</h1>
            <p>This OTP is valid for 10 minutes.</p>
            <p>Do not share this code with anyone.</p>
            <p>If you did not request this, ignore this email.</p>
            <p>C-Mart Team</p>
          </div>
        `,
      });

      if (error) {
        console.error("Resend Error:", error.message);

        await clearResetOTP(user._id, otpHash);

        return res.status(502).json({
          success: false,
          message:
            "Unable to send OTP email. Check email sender configuration.",
        });
      }
    } catch (emailError) {
      console.error(
        "OTP Email Send Error:",
        emailError.message
      );

      await clearResetOTP(user._id, otpHash);

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

// ========================================
// CHECK OTP
// ========================================

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

  const storedHash = String(user.resetPasswordToken);

  if (!/^[a-f0-9]{64}$/i.test(storedHash)) {
    return null;
  }

  const storedBuffer = Buffer.from(storedHash, "hex");
  const providedBuffer = Buffer.from(otpHash, "hex");

  const matches =
    storedBuffer.length === providedBuffer.length &&
    crypto.timingSafeEqual(
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

// ========================================
// VERIFY OTP
// ========================================

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
          "Valid email and 6-digit OTP are required",
      });
    }

    const user = await checkOTP(email, otp);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid, expired or locked OTP",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Verify OTP Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify OTP",
    });
  }
};

// ========================================
// RESET PASSWORD
// ========================================

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body || {};

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
          "Valid email, OTP and password (minimum 6 characters) are required",
      });
    }

    const user = await checkOTP(email, otp);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid, expired or locked OTP",
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
        message: "OTP expired or already used",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Password reset successful. Please login.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Password reset failed",
    });
  }
};

// ========================================
// EXPORTS
// ========================================

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  forgotPassword,
  verifyOTP,
  resetPassword,
};
