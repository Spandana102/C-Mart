const express = require("express");
const router = express.Router();

const Product = require("../models/Product");

// GET all products
router.get("/", async (req, res) => {
    try {
        const products = await Product.find().sort({
            createdAt: -1
        });

        res.json(products);
    } catch (error) {
        console.error("Fetch Products Error:", error);

        res.status(500).json({
            message: "Failed to fetch products",
            error: error.message
        });
    }
});


// ADD product
router.post("/", async (req, res) => {
    try {
        const {
            name,
            price,
            mrp,
            category,
            description,
            images,
            stock,
            condition,
            brand,
            specifications
        } = req.body;

        // Required fields
        if (!name || price === undefined || !category) {
            return res.status(400).json({
                message: "Name, price and category are required"
            });
        }

        const product = await Product.create({
            name: name.trim(),

            price: Number(price),

            mrp: Number(mrp || 0),

            category: category.trim(),

            description: description || "",

            images: Array.isArray(images)
                ? images
                : [],

            stock: Number(stock || 0),

            condition: condition || "Used",

            brand: brand || "",

            specifications: specifications || {}
        });

        res.status(201).json({
            success: true,
            message: "Product added successfully",
            product
        });

    } catch (error) {
        console.error("Add Product Error:", error);

        res.status(500).json({
            message: "Failed to add product",
            error: error.message
        });
    }
});


// DELETE product
router.delete("/:id", async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(
            req.params.id
        );

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error("Delete Product Error:", error);

        res.status(500).json({
            message: "Failed to delete product",
            error: error.message
        });
    }
});


module.exports = router;