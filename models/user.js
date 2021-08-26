const mongoose = require("mongoose");

// Define Schemes
const userSchema = mongoose.Schema(
  {
    kakaoId: String,
    localId: String,
    date: { type: Date, default: Date.now },
  },
  { strict: false }
);

// Create Model
const user = mongoose.model("User", userSchema);

module.exports = user;
