const mongoose = require("mongoose");

// Define Schemes
const surveySchema = mongoose.Schema(
  {
    userId: String,
    surveyId: String,
    responseId: String,
    title: String,
    description: String,
    questions: [],
    state: String,
    meta: {},
    date: { type: Date, default: Date.now },
  },
  { strict: false }
);

// Create Model
const survey = mongoose.model("Survey", surveySchema);

module.exports = survey;
