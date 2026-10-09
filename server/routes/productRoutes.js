
const express = require("express");
const router = express.Router();

const Product = require("../models/Product");

// GET ALL PRODUCTS FROM ALL STUDENTS
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(products);
  } catch (error) {
    console.error("Fetch Products Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
});

// GET ONE PRODUCT BY ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Fetch Product Error:", error);

    return res.status(400).json({
      success: false,
      message: "Invalid product ID or failed to fetch product",
    });
  }
});

// ADD PRODUCT
router.post("/", async (req, res) => {
  try {
    const {
      name,
      price,
      mrp,
      category,
      description,
      images,
      image,
      imageUrl,
      stock,
      condition,
      brand,
      specifications,
      seller,
      sellerId,
      userId,
    } = req.body;

    if (
      !name ||
      price === undefined ||
      price === null ||
      price === "" ||
      !category
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, price and category are required",
      });
    }

    if (!Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid price",
      });
    }

    // Keep image URLs from the frontend.
    let productImages = [];

    if (Array.isArray(images)) {
      productImages = images.filter(Boolean);
    } else if (images) {
      productImages = [images];
    } else if (image || imageUrl) {
      productImages = [image || imageUrl];
    }

    const productData = {
      name: name.trim(),
      price: Number(price),
      mrp: Number(mrp || 0),
      category: category.trim(),
      description: description || "",
      images: productImages,
      stock: Number(stock || 0),
      condition: condition || "Used",
      brand: brand || "",
      specifications: specifications || {},
    };

    // Add seller only if your Product model supports this field.
    // Use the field name that exists in your Product schema.
    if (seller) productData.seller = seller;
    if (sellerId) productData.sellerId = sellerId;
    if (userId) productData.userId = userId;

    const product = await Product.create(productData);

    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    console.error("Add Product Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add product",
      error: error.message,
    });
  }
});

// DELETE PRODUCT
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete Product Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
});

module.exports = router;