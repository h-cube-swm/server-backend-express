const mongoose = require("mongoose");

// Define Schemes
const responseSchema = mongoose.Schema(
  {
    userId: String, // 응답하는 사람
    surveyId: String,
    responses: {},
    date: { type: Date, default: Date.now },
  },
  { strict: false }
);

// Create Model
const response = mongoose.model("Response", responseSchema);

module.exports = response;
