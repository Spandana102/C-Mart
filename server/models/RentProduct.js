
const mongoose = require("mongoose");

const rentProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    category: {
      type: String,
      required: true,
      enum: ["Books", "Accessories", "Study", "Electronics", "Other"],
    },
    condition: {
      type: String,
      required: true,
      enum: ["New", "Excellent", "Good", "Used", "Fair"],
    },
    description: {
      type: String,
      default: "",
      maxlength: 2000,
    },
    rentPrice: {
      type: Number,
      required: true,
      min: 0.01,
    },
    image: {
      type: String,
      default: "",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.RentProduct ||
  mongoose.model("RentProduct", rentProductSchema);
