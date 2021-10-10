const express = require("express");
const { getResponse: gr, getComment: gc } = require("../utils/response");
const User = require("../models/user");
const Survey = require("../models/survey");

const router = express.Router();

router.get("/surveys", async (req, res) => {
  if (!req.user || !req.user.id) {
    res.status(400).send(gc("Not logged in."));
    return;
  }
  try {
    const surveys = await Survey.find(
      { userId: req.user.id, status: { $ne: "deleted" } },
      { questions: 0 }
    ).exec();
    res.status(200).send(gr(surveys, "Get All Survey Succeess"));
  } catch (err) {
    console.log("Failed to Get All Survey", err);
    res.status(500).send(gc("Server Error"));
  }
});

router.get("/", (req, res) => {});

router.post("/", (req, res) => {});

module.exports = router;
