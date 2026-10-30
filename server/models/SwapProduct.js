
const mongoose = require("mongoose");

const swapProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    condition: {
      type: String,
      enum: ["New", "Used"],
      default: "Used",
    },

    image: {
      type: String,
      default: "",
    },

    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "SwapProduct",
  swapProductSchema
);
