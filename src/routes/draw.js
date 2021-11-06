const express = require("express");
const Draw = require("../models/draw");
const { check } = require("express-validator");
const { validatorErrorChecker } = require("../utils/validator");
const { getResponse: gr, getComment: gc } = require("../utils/response");

const { DRAW_TOKEN } = process.env;

const router = express.Router();

const checkBodyPut = [
  check("id").exists(),
  check("number").exists(),
  validatorErrorChecker,
];

// 추첨 목록 받아오기(꾸러기 원정대)
router.get("/", async (req, res) => {
  try {
    if (!req.query.sid) {
      res.status(400).send(gc("sid field is required"));
      return;
    }

    const { sid: id } = req.query;

    const draw = (await Draw.findOne({ id }, "isEnabled number").lean()) || {};
    res.status(200).send(gr(draw, "Successfully got draw"));
  } catch (err) {
    console.log("Failed to Get Draw", err);
    res.status(500).send(gc("Server Error"));
  }
});

router.put("/", checkBodyPut, async (req, res) => {
  try {
    const { id, ...rest } = req.body;
    const update = { ...rest };
    await Draw.updateOne({ id }, update, { upsert: true });
    res.status(200).send(gc("Draw Update Success"));
  } catch (err) {
    console.log("Failed to Update Draw", err);
    res.status(500).send(gc("Server Error"));
  }
});

router.get("/results", async (req, res) => {
  try {
  } catch (err) {
    console.log("Failed to Create Draw", err);
    res.status(500).send(gc("Server Error"));
  }
});

module.exports = router;
