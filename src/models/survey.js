const mongoose = require("mongoose");

// Define Schemes
const surveySchema = mongoose.Schema(
  {
    id: String,
    deployId: String,
    userId: String,
    title: { type: String, default: "" },
    description: String,
    questions: Array,
    status: String,
    createdAt: Date,
    updatedAt: Date,
    branching: Object,
    counter: Number,
    selectedIndex: Number,
    email: String,
  },
  { strict: false, timestamps: true }
);

// Create Model
const survey = mongoose.model("Survey", surveySchema);

module.exports = survey;
