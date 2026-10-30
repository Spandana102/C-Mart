
const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");

// =====================================
// VALIDATE CLOUDINARY IMAGE URL
// =====================================
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

// =====================================
// NORMALIZE PRODUCT IMAGES
// =====================================
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

// =====================================
// GET ALL PRODUCTS - PUBLIC MARKETPLACE
// =====================================
// Every buyer and seller can view all products.
// No sellerId filter here.
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
    console.error("Fetch Products Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
});

// =====================================
// GET LOGGED-IN SELLER PRODUCTS
// =====================================
// Must appear before GET /:id
router.get(
  "/my-products",
  authMiddleware,
  async (req, res) => {
    try {
      const sellerId =
        req.user?.id ||
        req.user?._id ||
        req.user?.userId;

      if (
        !sellerId ||
        !mongoose.isValidObjectId(sellerId)
      ) {
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
      console.error("My Products Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch your products",
      });
    }
  }
);

// =====================================
// GET PRODUCT BY ID
// =====================================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
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
    console.error("Fetch Product Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
});

// =====================================
// ADD PRODUCT - LOGGED-IN SELLER
// =====================================
router.post("/", authMiddleware, async (req, res) => {
  try {
    const sellerId =
      req.user?.id ||
      req.user?._id ||
      req.user?.userId;

    if (
      !sellerId ||
      !mongoose.isValidObjectId(sellerId)
    ) {
      return res.status(401).json({
        success: false,
        message: "Please login again to add a product",
      });
    }

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

    // Validate required fields
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof category !== "string" ||
      !category.trim() ||
      price === undefined ||
      price === null ||
      price === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, price and category are required",
      });
    }

    const numericPrice = Number(price);

    const numericMrp =
      mrp === undefined ||
      mrp === null ||
      mrp === ""
        ? 0
        : Number(mrp);

    const numericStock =
      stock === undefined ||
      stock === null ||
      stock === ""
        ? 1
        : Number(stock);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid selling price",
      });
    }

    if (
      !Number.isFinite(numericMrp) ||
      numericMrp < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid MRP",
      });
    }

    if (
      !Number.isInteger(numericStock) ||
      numericStock < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Stock must be at least 1",
      });
    }

    // Validate images uploaded to Cloudinary
    const rawImages =
      images ?? image ?? imageUrl ?? [];

    const productImages = normalizeImages(rawImages);

    if (productImages.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Please upload at least one valid Cloudinary image",
      });
    }

    if (productImages.length > 5) {
      return res.status(400).json({
        success: false,
        message: "Maximum 5 images allowed",
      });
    }

    const validCondition =
      ["New", "Used"].includes(condition)
        ? condition
        : "Used";

    const productData = {
      name: name.trim(),
      price: numericPrice,
      mrp: numericMrp,
      category: category.trim(),
      description:
        typeof description === "string"
          ? description.trim()
          : "",
      images: productImages,
      stock: numericStock,
      condition: validCondition,
      brand:
        typeof brand === "string"
          ? brand.trim()
          : "",
      specifications:
        specifications &&
        typeof specifications === "object" &&
        !Array.isArray(specifications)
          ? specifications
          : {},
      sellerId: new mongoose.Types.ObjectId(
        sellerId
      ),
    };

    const product = await Product.create(
      productData
    );

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
      ...(process.env.NODE_ENV === "development"
        ? { error: error.message }
        : {}),
    });
  }
});

// =====================================
// DELETE PRODUCT
// =====================================
// Seller can delete their own product.
// Admin can delete any product.
router.delete(
  "/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
      }

      const currentUserId =
        req.user?.id ||
        req.user?._id ||
        req.user?.userId;

      if (
        !currentUserId ||
        !mongoose.isValidObjectId(currentUserId)
      ) {
        return res.status(401).json({
          success: false,
          message: "Please login again",
        });
      }

      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      const isAdmin =
        req.user?.role === "admin";

      const isOwner =
        product.sellerId &&
        product.sellerId.toString() ===
          currentUserId.toString();

      if (!isAdmin && !isOwner) {
        return res.status(403).json({
          success: false,
          message:
            "You can only delete your own products",
        });
      }

      await product.deleteOne();

      return res.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete Product Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to delete product",
      });
    }
  }
);

module.exports = router;
