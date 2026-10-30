
const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Product = require("../models/Product");
const Bargain = require("../models/Bargain");
const authMiddleware = require("../middleware/authMiddleware");

// ==========================================
// HELPERS
// ==========================================

const getUserId = (req) =>
  req.user?._id || req.user?.id || req.user?.userId;

const isValidId = (id) => mongoose.isValidObjectId(id);

const isValidCloudinaryUrl = (value) => {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value.trim());

    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      url.pathname.startsWith("/")
    );
  } catch {
    return false;
  }
};

const normalizeImages = (images) => {
  const imageList = Array.isArray(images)
    ? images
    : images
    ? [images]
    : [];

  return imageList
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }

      if (item && typeof item === "object") {
        return (
          item.secure_url ||
          item.url ||
          item.imageUrl ||
          ""
        );
      }

      return "";
    })
    .filter(isValidCloudinaryUrl);
};

const parseNumber = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return Number(value);
};

const validateProduct = (data, requireImage = true) => {
  if (
    typeof data.name !== "string" ||
    !data.name.trim() ||
    typeof data.category !== "string" ||
    !data.category.trim()
  ) {
    return "Product name and category are required";
  }

  if (!Number.isFinite(data.price) || data.price <= 0) {
    return "Enter a valid selling price";
  }

  if (!Number.isFinite(data.mrp) || data.mrp < 0) {
    return "Enter a valid MRP";
  }

  if (!Number.isInteger(data.stock) || data.stock < 1) {
    return "Stock must be at least 1";
  }

  if (requireImage && data.images.length === 0) {
    return "Please upload at least one valid Cloudinary image";
  }

  if (data.images.length > 5) {
    return "Maximum 5 images allowed";
  }

  return null;
};

const buildProductData = (body, existing = null) => {
  const rawImages =
    body.images ??
    body.image ??
    body.imageUrl ??
    existing?.images ??
    [];

  return {
    name: body.name ?? existing?.name ?? "",
    price: parseNumber(body.price, existing?.price),
    mrp: parseNumber(body.mrp, existing?.mrp ?? 0),
    category: body.category ?? existing?.category ?? "",
    description:
      body.description ?? existing?.description ?? "",
    images: normalizeImages(rawImages),
    stock: parseNumber(body.stock, existing?.stock ?? 1),
    condition: body.condition ?? existing?.condition ?? "Used",
    brand: body.brand ?? existing?.brand ?? "",
    specifications:
      body.specifications ??
      existing?.specifications ??
      {},
  };
};

// ==========================================
// GET ALL PRODUCTS
// GET /api/products
// ==========================================

router.get("/", async (req, res) => {
  try {
    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
});

// ==========================================
// GET MY PRODUCTS
// GET /api/products/my-products
// ==========================================

router.get("/my-products", authMiddleware, async (req, res) => {
  try {
    const sellerId = getUserId(req);

    if (!isValidId(sellerId)) {
      return res.status(401).json({
        success: false,
        message: "Please login again",
      });
    }

    const products = await Product.find({
      sellerId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("My products error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your products",
    });
  }
});

// ==========================================
// GET PRODUCT DETAILS
// GET /api/products/:id
// ==========================================

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id)
      .populate("sellerId", "fullName collegeId")
      .lean();

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
    console.error("Get product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
});

// ==========================================
// ADD PRODUCT
// POST /api/products
// ==========================================

router.post("/", authMiddleware, async (req, res) => {
  try {
    const sellerId = getUserId(req);

    if (!isValidId(sellerId)) {
      return res.status(401).json({
        success: false,
        message: "Please login again to add products",
      });
    }

    const data = buildProductData(req.body);

    const validationError = validateProduct(data);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const product = await Product.create({
      ...data,
      name: data.name.trim(),
      category: data.category.trim(),
      description: String(data.description).trim(),
      brand: String(data.brand).trim(),
      sellerId,
    });

    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    console.error("Add product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add product",
      ...(process.env.NODE_ENV === "development"
        ? { error: error.message }
        : {}),
    });
  }
});

// ==========================================
// UPDATE PRODUCT
// PUT /api/products/:id
// ==========================================

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!isValidId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Please login again",
      });
    }

    if (!isValidId(req.params.id)) {
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

    const isOwner =
      String(product.sellerId) === String(userId);

    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You cannot edit another seller's product",
      });
    }

    const data = buildProductData(req.body, product);

    const validationError = validateProduct(data);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    product.name = data.name.trim();
    product.price = data.price;
    product.mrp = data.mrp;
    product.category = data.category.trim();
    product.description = String(data.description).trim();
    product.images = data.images;
    product.stock = data.stock;
    product.condition = data.condition;
    product.brand = String(data.brand).trim();
    product.specifications = data.specifications;

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
});

// ==========================================
// DELETE PRODUCT
// DELETE /api/products/:id
// ==========================================

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!isValidId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Please login again",
      });
    }

    if (!isValidId(req.params.id)) {
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

    const isOwner =
      String(product.sellerId) === String(userId);

    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete another seller's product",
      });
    }

    await Product.findByIdAndDelete(product._id);

    // Remove associated bargaining requests
    await Bargain.deleteMany({
      productId: product._id,
    });

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
});

module.exports = router;
