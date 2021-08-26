const express = require("express");
const getResponse = require("../utils");
const Survey = require("../models/survey");

const router = express.Router();

router.get("/", (req, res) => {
  Survey.find()
    .then((existSurvey) => {
      res.status(200).send(getResponse(existSurvey, "Get Success"));
    })
    .catch((err) => res.status(500).send(err));
});

router.post("/", (req, res, next) => {
  Survey.create(req.body)
    .then((newSurvey) => {
      res.status(200).send(getResponse(newSurvey, "Create Success"));
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send(getResponse(null, "Create Fail"));
    });
});

module.exports = router;
