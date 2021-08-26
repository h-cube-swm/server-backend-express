const mongoose = require("mongoose");

// Define Schemes
const responseSchema = mongoose.Schema(
  {
    userId: String, // 응답하는 사람
    surveyId: String,
    responses: {},
  },
  { strict: false }
);

// Create Model
const response = mongoose.model("Response", responseSchema);

module.exports = response;
