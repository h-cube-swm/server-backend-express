const express = require("express");
const { check } = require("express-validator");
const { validatorErrorChecker } = require("../utils/validator");
const { getResponse: gr, getComment: gc } = require("../utils/response");
const { checkLogin } = require("../utils/checkLogin");
const { checkUUID } = require("../utils/checkUUID");
const { sendEmail } = require("../utils/sesSendEmail");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const crypto = require("crypto");
const Survey = require("../models/survey");
const Response = require("../models/response");

const STATUS = {
  EDITING: "editing",
  PUBLISHED: "published",
  FINISHED: "finished",
  DELETED: "deleted",
};

const NOT_DELETED = { status: { $ne: STATUS.DELETED } };
const NOT_FINISHED = { status: { $nin: [STATUS.DELETED, STATUS.FINISHED] } };
const IS_EDITING = {
  $or: [{ status: STATUS.EDITING }, { status: { $exists: false } }],
};

const router = express.Router();

const checkEmail = [
  check("email", "Please include a valid email").isEmail(),
  validatorErrorChecker,
];

function validateStatus(status) {
  return Object.values(STATUS).includes(status);
}

function md5(str) {
  return crypto.createHash("md5").update(str).digest("hex");
}

router.post("/", async (req, res) => {
  try {
    const result = await Survey.create({
      id: uuidv4(),
      deployId: uuidv4(),
      userId: req.user.id,
      status: STATUS.EDITING,
    });
    res.status(201).send(gr(result, "Survey create success"));
  } catch (err) {
    console.log("Fail to create link", err);
    res.status(500).send(gc("Server Error"));
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { mode } = req.query;
    const isEditMode = mode === "edit";

    if (!(await checkUUID(id))) {
      res.status(400).send(gc("Invalid UUID(should be UUIDv4)"));
      return;
    }

    let columns = "-_id";
    let condition = { ...NOT_DELETED };
    if (isEditMode) condition = { ...condition, id };
    else if (mode === "response") condition = { ...condition, deployId: id };
    else {
      res.status(400).send(gc("Invalid query string : " + mode));
      return;
    }

    // Todo: ?????? ????????? ????????? ????????? ?????? ????????? ????????? ????????? ??? ????????? ???????????? ???
    let survey = await Survey.findOne(condition, columns).lean();
    if (!survey) {
      res.status(404).send(gc("Cannot find survey"));
      return;
    }

    // Draw api ??????
    const response = await axios.get(
      `https://${req.hostname}/draws/${survey.id}`
    );
    const draw = response.data.result;
    survey = { ...survey, draw };

    // Mode??? ?????? Survey ??????
    if (!isEditMode) {
      let { id, ...others } = survey;
      survey = others;
    }

    res.status(200).send(gr(survey, "Successfully got survey"));
  } catch (err) {
    console.log("Failed to get survey", err);
    res.status(500).send(gc("Server Error"));
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { draw, ...survey } = req.body;
    const update = { ...survey };
    const result = await Survey.findOneAndUpdate(
      { id, ...IS_EDITING },
      update
    ).exec();
    if (!result) {
      res.status(404).send(gc("Cannot find survey"));
      return;
    }

    // draw api ??????
    if (draw && "isEnabled" in draw) {
      await axios.put(`https://${req.hostname}/draws/${id}`, draw);
    }

    res.status(200).send(gc("Survey update success"));
  } catch (err) {
    console.log("Failed to update survey : ", err.message);
    res.status(500).send(gc("Server Error"));
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const update = { status: STATUS.DELETED };
    await Survey.findOneAndUpdate({ id, ...NOT_DELETED }, update).exec();
    res.status(200).send(gc("Survey delete success"));
  } catch (err) {
    console.log("Failed to delete survey", err);
    res.status(500).send(gc("Server Error"));
  }
});

router.put("/:id/end", async (req, res) => {
  try {
    const { id } = req.params;
    const originalSurvey = await Survey.findOneAndUpdate(
      { id, ...NOT_FINISHED },
      { status: STATUS.PUBLISHED, userId: req.user.id }
    ).exec();
    if (!originalSurvey) return res.status(404).send(gc("Cannot find survey"));

    res.status(200).send(gr(originalSurvey, "Survey end update success"));
  } catch (err) {
    console.log("Failed to end survey", err);
    res.status(500).send(gc("Server Error"));
  }
});

// ????????? ?????? ?????? ?????? api?????? ?????? ?????? end ?????????????????? ?????? ?????????????????? ?????? ??? ?????? ????????? ??????
// ????????? ????????? ????????? ?????? ????????? ?????? ??????????????? ???????????? originalSurvey??? ??????????????? ?????????, ?????? ????????? ?????? ?????? ????????????.
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!validateStatus(status))
      return res.status(400).send(gc("Illegal Argument"));

    const originalSurvey = await Survey.findOneAndUpdate(
      { id, ...NOT_FINISHED },
      { status, userId: req.user.id }
    ).exec();
    if (!originalSurvey)
      return res
        .status(404)
        .send(gc("Cannot update survey(Deleted or Finished)"));

    res.status(200).send(gc(`Survey status update to ${status} success`));
  } catch (err) {
    console.log("Failed to change survey status", err);
    res.status(500).send(gc("Server Error"));
  }
});

// ????????? ????????????
router.put("/:id/emails", checkEmail, async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const before = await Survey.findOneAndUpdate(
      { id, ...NOT_DELETED },
      { email },
      { new: true }
    ).exec();
    const result = await sendEmail(email, before.title, id, before.deployId);
    if (!result) {
      res.status(400).send(gc("Email send fail"));
      return;
    }
    res.status(200).send(gc("Email update and send success"));
  } catch (err) {
    console.log("Failed to update email", err);
    res.status(500).send(gc("Server Error"));
  }
});

// ?????? ?????? ????????????
router.get("/:id/responses", async (req, res) => {
  try {
    const { id } = req.params;

    // ?????? router.get("/:id")????????? ???????????? ??????????????? ?????? ?????? ???????????? ???
    if (!(await checkUUID(id))) {
      res
        .status(400)
        .send(
          gc("Invalid UUID(should be xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)")
        );
      return;
    }

    const survey = await Survey.findOne({ id, ...NOT_DELETED }, "-_id").lean();
    if (!survey) {
      res.status(404).send(gc("No such survey exists."));
      return;
    }
    const responses = await Response.find(
      { deployId: survey.deployId },
      "-_id"
    ).lean();
    const result = { survey, responses };
    res.status(200).send(gr(result, "Get responses success"));
  } catch (err) {
    console.log("Failed to get response", err);
    res.status(500).send(gc("Server Error"));
  }
});

// Get responses of given survey
router.post("/:deployId/responses", async (req, res) => {
  try {
    const { deployId } = req.params;
    const survey = await Survey.findOne({ deployId, ...NOT_DELETED });
    if (!survey) {
      res.status(404).send(gc("No such survey exists."));
      return;
    }
    const response = { ...req.body, deployId };
    response.userId = req.user.id;
    await Response.create(response);
    res.status(201).send(gc("Create response success"));
  } catch (err) {
    console.log("Failed to create response", err);
    res.status(500).send(gc("Server Error"));
  }
});

// Copy Survey
router.post("/copy", checkLogin, async (req, res) => {
  try {
    if (!req.body.sid) {
      res.status(400).send(gc("sid field is required"));
      return;
    }

    const { sid: id } = req.body;
    const userId = req.user.id;

    const originalSurvey = await Survey.findOne(
      { userId, id, ...NOT_DELETED },
      "-_id"
    ).lean();

    if (!originalSurvey) {
      res.status(404).send(gc("Cannot find survey"));
      return;
    }

    const newSurvey = await Survey.create({
      ...originalSurvey,
      status: STATUS.EDITING,
      id: uuidv4(),
      deployId: uuidv4(),
    });

    res.status(200).send(gr(newSurvey, "Create copied survey success"));
  } catch (err) {
    console.log("Failed to create copied survey", err);
    res.status(500).send(gc("Server Error"));
  }
});

// Draw result ?????? or ?????? API
// ??????????????? ??????????????? ????????? ?????????????????? draw ???????????? ????????? ?????? ??????????????? ??? ??? ?????????
// 1. ?????? ??????????????? ????????? ???????????? ?????????
// 2. Idempotent?????????
// GET ???????????? ??????????????? ???.
router.get("/:id/draw", async (req, res) => {
  try {
    const { id } = req.params;
    const isResponse = req.query.mode === "response";

    // ToDo : hash ?????? ?????? survey finished?????? ????????????, ???????????? survey ??????????????? hash?????? ?????????????????? ????????? ???????????? ?????? ??????
    let condition = {};
    if (isResponse) condition = { deployId: id, ...NOT_DELETED };
    else condition = { id, ...NOT_DELETED };
    const survey = await Survey.findOne(condition, "-_id").lean();
    if (!survey) {
      res.status(404).send(gc("No such survey exists."));
      return;
    }
    const { status, id: surveyId, deployId } = survey;

    // Check if survey is finished.
    if (status !== STATUS.FINISHED) {
      res.status(400).send(gc("Survey should be finished."));
      return;
    }

    // Get all responses of the survey
    const responses = await Response.find({ deployId }, "-_id")
      .sort("createdAt")
      .lean();

    // Check if there are at least one response
    const len = responses.length;
    if (len === 0) {
      res.status(400).send(gc("There are no response to select."));
      return;
    }

    // Get hash of response data
    const hash = md5(JSON.stringify(responses) + surveyId);

    // Call unboxing monster draw API
    let result = null;
    try {
      const response = await axios.put(
        `https://${req.hostname}/draws/${surveyId}/results`,
        {
          hash,
          len,
        }
      );
      result = response.data.result;
    } catch (e) {
      res.status(404).send(gr(null, "No draw info exists"));
      return;
    }

    // Get selected responses from selection of draw result
    const selections = result.drawResult.result;
    const selectedResponses = selections.map((i) =>
      isResponse ? responses[i].responses.uuid : responses[i]
    );

    // Return required values
    res
      .status(200)
      .send(gr({ ...result, selectedResponses }, "Get draw success"));
  } catch (err) {
    console.log("Failed to get draw result", err);
    res.status(500).send(gc("Server Error"));
  }
});

module.exports = router;
