const express = require("express");
const Draw = require("../models/draw");
const { getResponse: gr, getComment: gc } = require("../utils/response");

const { DRAW_TOKEN } = process.env;

const router = express.Router();

// 추첨 목록 받아오기(꾸러기 원정대)
router.get("/", async (req, res) => {
  try {
    if (!req.body.sid) {
      res.status(400).send(gc("sid field is required"));
      return;
    }
    const { sid: id } = req.body;

    const draw = await Draw.find({ id }, "-_id -id");
    console.log(draw);
    res.status(200).send(gr(draw, "Successfully got draw"));
  } catch (err) {
    console.log("Failed to Get Draw", err);
    res.status(500).send(gc("Server Error"));
  }
});

router.post("/", async (req, res) => {
  try {
  } catch (err) {
    console.log("Failed to Create Draw", err);
    res.status(500).send(gc("Server Error"));
  }
});

module.exports = router;
