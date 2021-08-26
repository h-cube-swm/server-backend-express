const express = require("express");
const { getResponse: gr, getComment: gc } = require("../utils");
const Survey = require("../models/survey");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).send(gr(req.survey, "Get Success"));
});

router.put("/", async (req, res, next) => {
  await Survey.updateOne(req.survey, req.body).exec();
  res.status(200).send(gc("Update Success"));
});

module.exports = router;
