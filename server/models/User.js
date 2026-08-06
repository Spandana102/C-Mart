const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
      fullName: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  password: {
    type: String,
    required: true,
  },

  collegeId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },

  phoneNumber: {
    type: String,
    required: true,
    trim: true,
  },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  }
});
const User = mongoose.model("User", userSchema);

module.exports = User;