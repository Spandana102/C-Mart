
const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only images are allowed"));
    }
    cb(null, true);
  },
});

router.post("/image", (req, res) => {
  upload.single("image")(req, res, (uploadError) => {
    if (uploadError) {
      return res.status(400).json({
        success: false,
        message: uploadError.message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image selected",
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

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "c-mart/products",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.error(
            "Cloudinary Upload Error:",
            error.message
          );

          return res.status(500).json({
            success: false,
            message: "Cloudinary image upload failed",
          });
        }

        if (!result?.secure_url) {
          return res.status(500).json({
            success: false,
            message: "Cloudinary did not return an image URL",
          });
        }

        return res.status(200).json({
          success: true,
          imageUrl: result.secure_url,
        });
      }
    );

    stream.end(req.file.buffer);
  });
});

module.exports = router;
