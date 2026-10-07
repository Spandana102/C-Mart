const Product = require("../models/Product");

// ADD PRODUCT
const addProduct = async (req, res) => {
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

        if (!name || price === undefined || !category) {
            return res.status(400).json({
                message: "Name, price and category are required"
            });
        }

        const product = await Product.create({
            name,
            price,
            mrp,
            category,
            description,
            images: Array.isArray(images) ? images : [],
            stock,
            condition,
            brand,
            specifications
        });

        res.status(201).json({
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
};


// GET ALL PRODUCTS
const getProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({
            createdAt: -1
        });

        res.json(products);

    } catch (error) {
        console.error("Get Products Error:", error);

        res.status(500).json({
            message: "Failed to fetch products",
            error: error.message
        });
    }
};


// DELETE PRODUCT
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json({
            message: "Product deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete product",
            error: error.message
        });
    }
};


module.exports = {
    addProduct,
    getProducts,
    deleteProduct
};