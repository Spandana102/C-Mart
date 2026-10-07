const express = require("express");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

// Upload single image
router.post("/image", upload.single("image"), async (req, res) => {
    console.log("=================================");
    console.log("IMAGE UPLOAD REQUEST RECEIVED");
    console.log("=================================");

    try {
        if (!req.file) {
            console.log("ERROR: No file received");

            return res.status(400).json({
                success: false,
                message: "No image uploaded",
            });
        }

        console.log("File name:", req.file.originalname);
        console.log("File type:", req.file.mimetype);
        console.log("File size:", req.file.size);

        console.log("Uploading to Cloudinary...");

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "c-mart/products",
                resource_type: "image",
            },
            (error, result) => {
                if (error) {
                    console.error(
                        "CLOUDINARY UPLOAD ERROR:",
                        error
                    );

                    return res.status(500).json({
                        success: false,
                        message: "Cloudinary upload failed",
                        error: error.message,
                    });
                }

                console.log(
                    "Cloudinary upload successful!"
                );

                console.log(
                    "Image URL:",
                    result.secure_url
                );

                return res.status(200).json({
                    success: true,
                    message: "Image uploaded successfully",
                    imageUrl: result.secure_url,
                });
            }
        );

        uploadStream.end(req.file.buffer);

    } catch (error) {
        console.error(
            "UPLOAD ROUTE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Image upload failed",
            error: error.message,
        });
    }
});

// Multer error handler
router.use((error, req, res, next) => {
    console.error(
        "MULTER ERROR:",
        error
    );

    return res.status(500).json({
        success: false,
        message: "Image upload failed",
        error: error.message,
    });
});

module.exports = router;