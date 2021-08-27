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
    date: { type: Date, default: Date.now },
  },
  { strict: false }
);

// Create Model
const survey = mongoose.model("Survey", surveySchema);

module.exports = survey;
