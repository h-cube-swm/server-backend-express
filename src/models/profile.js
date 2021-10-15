const mongoose = require("mongoose");

// Define Schemes
const profileSchema = mongoose.Schema(
  {
    userId: String,
    name: String,
    age: Number,
    gender: String,
    email: String,
    phoneNumer: String,
    createdAt: Date,
    updatedAt: Date,
  },
  { strict: false, timestamps: true }
);

// Create Model
const profile = mongoose.model("Profile", profileSchema);

module.exports = profile;
