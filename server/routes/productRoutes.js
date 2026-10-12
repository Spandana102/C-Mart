
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");

// GET ALL PRODUCTS
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(products);
  } catch (error) {
    console.error("Fetch Products Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
});

// GET ONE PRODUCT BY ID
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

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
    console.error("Fetch Product Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
});

// ADD PRODUCT
// Seller ID comes from the authenticated login token.
router.post("/", authMiddleware, async (req, res) => {
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
    } = req.body;

    const sellerId =
      req.user?._id || req.user?.id || req.user?.userId;

    if (!sellerId || !mongoose.isValidObjectId(sellerId)) {
      return res.status(401).json({
        success: false,
        message: "Please log in again to add a product",
      });
    }

    if (
      typeof name !== "string" ||
      !name.trim() ||
      price === undefined ||
      price === null ||
      price === "" ||
      typeof category !== "string" ||
      !category.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, price and category are required",
      });
    }

    const sellingPrice = Number(price);
    const mrpPrice = mrp === undefined || mrp === "" ? 0 : Number(mrp);
    const productStock = stock === undefined || stock === "" ? 1 : Number(stock);

    if (!Number.isFinite(sellingPrice) || sellingPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid selling price",
      });
    }

    if (!Number.isFinite(mrpPrice) || mrpPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid MRP",
      });
    }

    if (!Number.isInteger(productStock) || productStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid stock",
      });
    }

    let productImages = [];

    if (Array.isArray(images)) {
      productImages = images.filter(
        (item) => typeof item === "string" && item.trim()
      );
    } else if (typeof images === "string" && images.trim()) {
      productImages = [images.trim()];
    } else {
      const selectedImage = image || imageUrl;

      if (typeof selectedImage === "string" && selectedImage.trim()) {
        productImages = [selectedImage.trim()];
      }
    }

    const productData = {
      name: name.trim(),
      price: sellingPrice,
      mrp: mrpPrice,
      category: category.trim(),
      description: description || "",
      images: productImages,
      stock: productStock,
      condition: ["New", "Used"].includes(condition)
        ? condition
        : "Used",
      brand: brand || "",
      specifications: specifications || {},
      sellerId: new mongoose.Types.ObjectId(sellerId),
    };

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
    });
  }
});

// DELETE PRODUCT
// A seller can delete their own product.
// An authenticated admin can delete any product.
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const currentUserId =
      req.user?._id || req.user?.id || req.user?.userId;

    const isAdmin = req.user?.role === "admin";
    const isOwner =
      product.sellerId &&
      currentUserId &&
      product.sellerId.toString() === currentUserId.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own products",
      });
    }

    await product.deleteOne();

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
