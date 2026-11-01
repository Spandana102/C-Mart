
const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ======================================
// CLOUDINARY CONFIGURATION
// ======================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ======================================
// MULTER CONFIGURATION
// ======================================
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(
        new Error("Only image files are allowed")
      );
    }

    cb(null, true);
  },
});

// ======================================
// IMAGE UPLOAD CONTROLLER
// ======================================
const uploadImage = (req, res) => {
  upload.single("image")(req, res, async (uploadError) => {
    try {
      if (uploadError) {
        return res.status(400).json({
          success: false,
          message: uploadError.message,
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please choose an image to upload",
        });
      }

      if (
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
      ) {
        return res.status(500).json({
          success: false,
          message: "Cloudinary configuration is missing",
        });
      }

      // Upload image to Cloudinary
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "c-mart/products",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            console.error(
              "Cloudinary Upload Error:",
              error
            );

            return res.status(500).json({
              success: false,
              message: "Image upload failed",
            });
          }

          if (!result?.secure_url) {
            return res.status(500).json({
              success: false,
              message: "Image URL not returned",
            });
          }

          return res.status(200).json({
            success: true,
            message: "Image uploaded successfully",

            // Existing frontend compatibility
            imageUrl: result.secure_url,

            // Additional frontend compatibility
            url: result.secure_url,
            secure_url: result.secure_url,

            publicId: result.public_id,
          });
        }
      );

      stream.end(req.file.buffer);

    } catch (error) {
      console.error(
        "Image Upload Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error while uploading image",
      });
    }
  });
};

// ======================================
// IMAGE UPLOAD ROUTES
// ======================================

// Existing Buy/Sell upload endpoint
router.post("/image", authMiddleware, uploadImage);

// Support Swap.jsx upload endpoint
router.post("/", authMiddleware, uploadImage);

module.exports = router;
