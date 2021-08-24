const mongoose = require("../db");

const testSchema = mongoose.Schema({
  name: String,
});

const test = mongoose.model("Test", testSchema);

module.exports = test;
