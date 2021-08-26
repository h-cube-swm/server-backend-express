const express = require("express");
const { getResponse } = require("../utils");
const Survey = require("../models/survey");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).send(getResponse(req.survey, "Get Success"));
});

router.post("/", (req, res, next) => {
  Survey.create(req.body)
    .then((newSurvey) => {
      res.status(200).send(getResponse(newSurvey, "Create Success"));
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(getResponse(null, "Error"));
    });
});

module.exports = router;
