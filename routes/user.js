const express = require("express");
const { getResponse: gr, getComment: gc } = require("../utils/response");
const User = require("../models/user");
const Survey = require("../models/survey");

const router = express.Router();

router.get("/surveys", async (req, res) => {
  if (req.user) {
    const surveys = await Survey.find({ userId: req.user.id }, { questions: 0 }).exec();
    res.status(200).send(gr(surveys, "Send All Survey Succeess"));
  } else {
    res.status(400).send(gc("Not logged in."));
  }
});

router.get("/", (req, res) => { });

router.post("/", (req, res) => { });

module.exports = router;
