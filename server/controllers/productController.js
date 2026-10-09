
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
      image,
      imageUrl,
      stock,
      condition,
      brand,
      specifications,
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

    // Accept image URLs from different frontend field formats
    let productImages = [];

    if (Array.isArray(images)) {
      productImages = images.filter(Boolean);
    } else if (images) {
      productImages = [images];
    } else if (image || imageUrl) {
      productImages = [image || imageUrl];
    }

    const product = await Product.create({
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
    });

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
};

// GET ALL STUDENTS' PRODUCTS
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(products);
  } catch (error) {
    console.error("Get Products Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

// DELETE PRODUCT
const deleteProduct = async (req, res) => {
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
};

module.exports = {
  addProduct,
  getProducts,
  deleteProduct,
};