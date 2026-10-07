const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Resend } = require("resend");


// Register User
const registerUser = async (req, res) => {
    try {

        const { fullName, email, password, collegeId, phoneNumber } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            fullName,
            email,
            password: hashedPassword,
            collegeId,
            phoneNumber
        });

        res.status(201).json({
            message: "User registered successfully",
            user
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};


// Login User
const loginUser = async (req, res) => {
    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        console.log("LOGIN EMAIL:", email);
        console.log("USER FOUND:", user);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid password"
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            message: "Login successful",
            token,
            user
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};


// Get User Profile
const getProfile = async (req, res) => {
    try {

        const user = await User.findById(req.user.id)
            .select("-password");

        res.json({
            message: "Profile fetched successfully",
            user
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};


// Update User Profile
const updateProfile = async (req, res) => {
    try {

        const { fullName, phoneNumber, collegeId } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                fullName,
                phoneNumber,
                collegeId
            },
            {
                new: true
            }
        ).select("-password");

        res.json({
            message: "Profile updated successfully",
            user
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};


// Forgot Password - Send OTP
const forgotPassword = async (req, res) => {
    try {

        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "Email not registered"
            });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        // OTP valid for 10 minutes
        user.resetPasswordToken = otp;
        user.resetPasswordExpires =
            Date.now() + 10 * 60 * 1000;

        await user.save();

        // Create Resend client
        const resend = new Resend(
            process.env.RESEND_API_KEY
        );

        // Send OTP email
        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: "C-Mart Password Reset OTP",
            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    padding: 20px;
                ">

                    <h2>C-Mart Password Reset</h2>

                    <p>Hello ${user.fullName},</p>

                    <p>
                        We received a request to reset your
                        C-Mart password.
                    </p>

                    <p>
                        Your OTP is:
                    </p>

                    <h1 style="
                        letter-spacing: 8px;
                        font-size: 32px;
                    ">
                        ${otp}
                    </h1>

                    <p>
                        This OTP is valid for 10 minutes.
                    </p>

                    <p>
                        If you did not request a password reset,
                        please ignore this email.
                    </p>

                    <p>
                        Regards,<br>
                        C-Mart Team
                    </p>

                </div>
            `
        });

        if (error) {
            console.error("RESEND ERROR:", error);

            return res.status(500).json({
                message: "Unable to send OTP email"
            });
        }

        console.log("OTP EMAIL SENT:", data);

        res.json({
            message: "OTP sent successfully to your email"
        });

    } catch (error) {

        console.error("FORGOT PASSWORD ERROR:", error);

        res.status(500).json({
            message: "Unable to send OTP"
        });

    }
};


// Verify OTP
const verifyOTP = async (req, res) => {
    try {

        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required"
            });
        }

        const user = await User.findOne({
            email,
            resetPasswordToken: otp,
            resetPasswordExpires: {
                $gt: Date.now()
            }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired OTP"
            });
        }

        res.json({
            message: "OTP verified successfully"
        });

    } catch (error) {

        console.error("VERIFY OTP ERROR:", error);

        res.status(500).json({
            message: "Unable to verify OTP"
        });

    }
};


module.exports = {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    forgotPassword,
    verifyOTP
};