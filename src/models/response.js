const mongoose = require("mongoose");

// Define Schemes
const responseSchema = mongoose.Schema(
  {
    userId: String, // 응답하는 사람
    deployId: String, // 엔드포인트에서 파싱하는 deployId
    responses: {},
  },
  { strict: false, timestamps: true }
);

// Create Model
const response = mongoose.model("Response", responseSchema);

module.exports = response;
