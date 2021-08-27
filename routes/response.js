const express = require("express");
const { getResponse: gr, getComment: gc } = require("../utils");
const Response = require("../models/response");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const responses = await Response.find({ surveyId: req.survey._id });
    result = {};
    result.survey = req.survey;
    result.answers = responses;
    res.status(201).send(gr(result, "Get Responses Success"));
  } catch (err) {
    console.log(err);
    res.status(500).send(gc("Server Error"));
  }
});

router.post("/", async (req, res, next) => {
  try {
    req.body.surveyId = req.survey._id; // survey id 필드 추가
    await Response.create(req.body);
    res.status(201).send(gc("Create Response Success"));
  } catch (err) {
    console.log(err);
    res.status(500).send(gc("Server Error"));
  }
});

module.exports = router;
