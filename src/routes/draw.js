const express = require("express");
const axios = require("axios");
const Draw = require("../models/draw");
const { check } = require("express-validator");
const { validatorErrorChecker } = require("../utils/validator");
const { getResponse: gr, getComment: gc } = require("../utils/response");

// ToDo: API 주소를 환경 변수로 주입받는 것을 고려해볼 것.
const UNBOXING_API = "https://draw.unboxing.monster/rng/draw";
const { DRAW_TOKEN } = process.env;
const DRAW_CONFIG = {
  headers: { Authorization: `Bearer ${DRAW_TOKEN}` },
};

const router = express.Router();

const checkBodyPut = [
  check("id").exists(),
  check("number").exists(),
  validatorErrorChecker,
];

checkBodyResult = [
  check("id").exists(),
  check("hash").exists(),
  // number는 자체적으로 get해서 가져옴
  check("len").exists(),
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

    const draw =
      (await Draw.findOne({ id }, "-_id isEnabled number").lean()) || {};
    res.status(200).send(gr(draw, "Successfully got draw"));
  } catch (err) {
    console.log("Failed to get draw", err);
    res.status(500).send(gc("Server Error"));
  }
});

router.put("/", checkBodyPut, async (req, res) => {
  try {
    const { id, ...rest } = req.body;
    const update = { ...rest };
    await Draw.updateOne({ id }, update, { upsert: true });
    res.status(200).send(gc("Draw update success"));
  } catch (err) {
    console.log("Failed to update draw", err);
    res.status(500).send(gc("Server Error"));
  }
});

// 기존 draw 테이블에 변화를 주는 것이기에 put 메소드 활용
router.put("/results", checkBodyResult, async (req, res) => {
  try {
    // Parse body
    let { id, hash, len } = req.body;

    // Get existing draw configuration
    const draw = await Draw.findOne({ id }).lean();
    if (!draw) {
      res.status(404).send(gc("No such draw info exists."));
      return;
    }

    // Limit draw number
    let n = draw.number;
    if (n > len) n = len;

    // Return draw if draw result already exists
    if ("drawResult" in draw) {
      res.status(200).send(gr(draw, "Get draw result Success"));
      return;
    }

    // Call unboxing API
    const response = await axios.post(
      UNBOXING_API,
      { hash, n, len },
      DRAW_CONFIG
    );
    const drawResult = response.data;
    console.log("Draw Result :", drawResult);

    // Update draw info
    const updatedDraw = await Draw.findOneAndUpdate(
      { id },
      { drawResult },
      { new: true, select: "-_id result" }
    ).exec();

    res.status(200).send(gr(updatedDraw, "Successfully created new draw."));
  } catch (err) {
    console.log("Failed to make result", err);
    res.status(500).send(gc("Server Error"));
  }
});

module.exports = router;
