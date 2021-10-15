const express = require("express");
const Profile = require("../models/profile");
const { check, oneOf, validationResult } = require("express-validator");
const { validatorErrorChecker } = require("../utils/validator");
const { checkLogin } = require("../utils/checkLogin");
const { getResponse: gr, getComment: gc } = require("../utils/response");

const router = express.Router();

const checkBody = [
  check("name").exists(),
  check("age").exists(),
  check("gender").exists(),
  check("email").exists(),
  check("phoneNumber").exists(),
  validatorErrorChecker,
];

const checkBodyPut = [
  oneOf([
    check("name").exists(),
    check("age").exists(),
    check("gender").exists(),
    check("email").exists(),
    check("phoneNumber").exists(),
  ]),
  validatorErrorChecker,
];

router.get("/", async (req, res) => {
  try {
    // 해당 구문도 여러 군데에서 쓰이므로 미들웨어로 빼는 것 고려할 예정
    if (!req.user || !req.user.id) {
      res.status(400).send(gc("Not logged in."));
      return;
    }

    const userId = req.user.id;
    const profile = await Profile.findOne({ userId }, "-_id").lean();
    if (!profile) {
      res.status(404).send(gc("No such profile exists."));
      return;
    }
    res.status(200).send(gr(profile, "Successfully got profile"));
  } catch (err) {
    console.log("Failed to get profile", err);
    res.status(500).send(gc("Server Error"));
  }
});

router.post("/", checkBody, async (req, res) => {
  try {
    // 해당 구문도 여러 군데에서 쓰이므로 미들웨어로 빼는 것 고려할 예정
    if (!req.user || !req.user.id) {
      res.status(400).send(gc("Not logged in."));
      return;
    }

    const userId = req.user.id;
    const profile = await Profile.findOne({ userId }).lean();
    if (profile) {
      res.status(404).send(gc("Profile Already exists."));
      return;
    }

    const result = await Profile.create({
      userId,
      ...req.body,
    });
    res.status(201).send(gr(result, "Profile Create Success"));
  } catch (err) {
    console.log("Failed to Create Profile", err);
    res.status(500).send(gc("Server Error"));
  }
});

router.put("/", checkLogin, checkBodyPut, async (req, res) => {
  try {
    const userId = req.user.id;
    const update = { ...req.body };
    const result = await Profile.findOneAndUpdate({ userId }, update).exec();
    if (!result) {
      res
        .status(404)
        .send(
          gc("No such profile for update. You should create profile first")
        );
      return;
    }
    res.status(200).send(gc("Profile Update Success"));
  } catch (err) {
    console.log("Failed to Update Profile", err);
    res.status(500).send(gc("Server Error"));
  }
});

module.exports = router;
