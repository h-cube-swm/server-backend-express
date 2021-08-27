const express = require("express");
const { getResponse: gr, getComment: gc, checkUUID } = require("../utils");
const Survey = require("../models/survey");
const Response = require("../models/response");
const { check, validationResult } = require("express-validator");
const router = express.Router();

const checkEmail = check("email", "Please include a valid email").isEmail();

router.get("/:id", async (req, res) => {
  console.log('GET /:id');
  const { id } = req.params;

  if (!checkUUID(id)) {
    res
      .status(400)
      .send(gc("Invalid UUID(should be xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)"));
    return;
  }

  const survey = await Survey.findOne({ $or: [{ id }, { deployId: id }] });

  // ToDo: 여기 수정할 것. 원래는 엔드포인트를 나눠야 하는데, 임시방편으로 일단 중요한 정보를 가린다.
  if (survey.deployId === id) {
    // 이렇게 된다는 것은 응답용으로 요청되었다는 의미이다.
    survey.id = '';
  }

  if (!survey) {
    res.status(404).send(gc("Cannot find survey"));
    return;
  }

  res.status(200).send(gr(survey, "Survey Get Success"));
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const update = { ...req.body };
    await Survey.findOneAndUpdate({ id }, update).exec();
    res.status(200).send(gc("Survey Update Success"));
  } catch (err) {
    console.log("Faile to Update Survey", err);
    res.status(500).send(gc("Server Error"));
  }
});

router.put("/:id/end", async (req, res) => {
  try {
    const { id } = req.params;
    const originalSurvey = await Survey.findOneAndUpdate({ id }, {
      status: "published",
    }).exec();

    // 여기서 originalDocumnet를 참조하여 만약 이미 published였었으면 에러 반환 가능

    const result = originalSurvey;
    result.status = 'published';
    res.status(200).send(gr(result, "Survey End Update Success"));
  } catch (err) {
    console.log("Failed to put", err);
    res.status(500).send(gc("Server Error"));
  }
});

router.put("/:id/emails", checkEmail, async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).send(gc("not a correct email (example@example.com)"));
    return;
  }

  try {
    const { id } = req.params;
    const { email } = req.body;
    await Survey.updateOne({ id }, { email }).exec();
    res.status(200).send(gc("Email Update Success"));
  } catch (err) {
    console.log("Failed to Update Email", err);
    res.status(500).send(gc("Server Error"));
  }
}
);

router.get("/:id/responses", async (req, res) => {
  try {
    const { id } = req.params;
    const survey = await Survey.findOne({ id });
    const responses = await Response.find({ deployId: survey.deployId });
    const result = { survey, responses };
    res.status(200).send(gr(result, "Get Responses Success"));
  } catch (err) {
    console.log(err);
    res.status(500).send(gc("Server Error"));
  }
});

router.post("/:deployId/responses", async (req, res) => {
  // 추후 userId도 추가해야함
  try {
    const { deployId } = req.params;
    const response = { ...req.body, deployId };
    console.log('res', response);
    response.userId = req.user.id;
    await Response.create(response);
    res.status(201).send(gc("Create Response Success"));
  } catch (err) {
    console.log(err);
    res.status(500).send(gc("Server Error"));
  }
});

module.exports = router;
