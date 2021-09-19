const express = require("express");
const { check, validationResult } = require("express-validator");
const { getResponse: gr, getComment: gc } = require("../utils/response");
const { checkUUID } = require("../utils/checkUUID");
const { sendEmail } = require("../utils/sesSendEmail");
const { v4: uuidv4 } = require("uuid");
const Survey = require("../models/survey");
const Response = require("../models/response");

const router = express.Router();

const checkEmail = check("email", "Please include a valid email").isEmail();

router.post("/", async (req, res) => {
  // ToDo: 여기서 새로운 설문 생성을 하면 어떨까?
  try {
    const result = await Survey.create({
      id: uuidv4(),
      deployId: uuidv4(),
      userId: req.user.id,
    });
    res.status(201).send(gr(result, "Survey Create Success"));
  } catch (err) {
    console.log("Fail to Create Link", err);
    res.status(500).send(gc("Server Error"));
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!(await checkUUID(id))) {
    res
      .status(400)
      .send(gc("Invalid UUID(should be xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)"));
    return;
  }

  // ToDo: 여기 수정할 것. 원래는 엔드포인트를 나눠야 하는데, 하나의 엔드포인트를 사용하고 있다.
  // 해당 부분 {id}, {deployId}의 객체 형태가 다른 것 같아서, 추후 확인히 필요해 보임
  const survey = await Survey.findOne({ $or: [{ id }, { deployId: id }] });

  if (!survey) {
    res.status(404).send(gc("Cannot find survey"));
    return;
  }

  if (survey.deployId === id) {
    // 이렇게 된다는 것은 응답용으로 요청되었다는 의미이다. 이 경우 id field가 노출되면 안 된다.
    // 그러므로 id field 를 가린다.
    // 해당 부분 {deployId}의 형태에서는 정상적으로 데이터 원본이 수정이 안되고 동작하지만, 확인이 필요해보임
    survey.id = "";
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
    console.log("Failed to Update Survey", err);
    res.status(500).send(gc("Server Error"));
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Survey.deleteOne({ id }).exec();
    res.status(200).send(gc("Survey Delete Success"));
  } catch (err) {
    console.log("Failed to Delete Survey", err);
    res.status(500).send(gc("Server Error"));
  }
});

router.put("/:id/end", async (req, res) => {
  try {
    const { id } = req.params;
    const originalSurvey = await Survey.findOneAndUpdate(
      { id },
      {
        status: "published",
      }
    ).exec();
    res.status(200).send(gr(originalSurvey, "Survey End Update Success"));
  } catch (err) {
    console.log("Failed to End Survey", err);
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
    const before = await Survey.findOneAndUpdate(
      { id },
      { email },
      {
        new: true,
      }
    ).exec();
    const result = await sendEmail(email, before.title, id, before.deployId);
    if (!result) {
      res.status(400).send(gc("Email Send Fail"));
      return;
    }
    res.status(200).send(gc("Email Update and Send Success"));
  } catch (err) {
    console.log("Failed to Update Email", err);
    res.status(500).send(gc("Server Error"));
  }
});

router.get("/:id/responses", async (req, res) => {
  try {
    const { id } = req.params;

    // 현재 router.get("/:id")에서도 쓰이는데 미들웨어로 빼는 것도 고려해도 됨
    if (!(await checkUUID(id))) {
      res
        .status(400)
        .send(
          gc("Invalid UUID(should be xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)")
        );
      return;
    }

    const survey = await Survey.findOne({ id });
    if (!survey) {
      res.status(404).send(gc("No such survey exists."));
      return;
    }
    const responses = await Response.find({ deployId: survey.deployId });
    const result = { survey, responses };
    res.status(200).send(gr(result, "Get Responses Success"));
  } catch (err) {
    console.log("Failed to Get Response", err);
    res.status(500).send(gc("Server Error"));
  }
});

router.post("/:deployId/responses", async (req, res) => {
  try {
    const { deployId } = req.params;
    const survey = await Survey.findOne({ deployId });
    if (!survey) {
      res.status(404).send(gc("No such survey exists."));
      return;
    }
    const response = { ...req.body, deployId };
    console.log("res", response);
    response.userId = req.user.id;
    await Response.create(response);
    res.status(201).send(gc("Create Response Success"));
  } catch (err) {
    console.log("Failed to Create Response", err);
    res.status(500).send(gc("Server Error"));
  }
});

module.exports = router;
