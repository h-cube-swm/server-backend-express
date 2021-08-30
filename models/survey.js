const mongoose = require("mongoose");

// Define Schemes
const surveySchema = mongoose.Schema(
  {
    id: String,
    deployId: String,
    userId: String,
    title: String,
    description: String,
    questions: Array,
    status: String,
  },
  { strict: false, timestamps: true }
);

// Create Model
const survey = mongoose.model("Survey", surveySchema);

module.exports = survey;
