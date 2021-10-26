const express = require("express");
const { check } = require("express-validator");
const { validatorErrorChecker } = require("../utils/validator");
const { getResponse: gr, getComment: gc } = require("../utils/response");
const { checkLogin } = require("../utils/checkLogin");
const { checkUUID } = require("../utils/checkUUID");
const { sendEmail } = require("../utils/sesSendEmail");
const { v4: uuidv4 } = require("uuid");
const Survey = require("../models/survey");
const Response = require("../models/response");

const STATUS = {
  EDITING: "editing",
  PUBLISHED: "published",
  PAUSED: "paused",
  FINISHED: "finished",
  DELETED: "deleted",
};
const NOT_DELETED = { status: { $ne: STATUS.DELETED } };
const NOT_FINISHED = { status: { $ne: STATUS.FINISHED } };
const IS_EDITING = {
  $or: [
    { status: "editing" },
    { status: "editting" },
    { status: { $exists: false } },
  ],
};

const router = express.Router();

const checkEmail = [
  check("email", "Please include a valid email").isEmail(),
  validatorErrorChecker,
];

router.post("/", async (req, res) => {
  try {
    const result = await Survey.create({
      id: uuidv4(),
      deployId: uuidv4(),
      userId: req.user.id,
      status: "editing",
    });
    res.status(201).send(gr(result, "Survey Create Success"));
  } catch (err) {
    console.log("Fail to Create Link", err);
    res.status(500).send(gc("Server Error"));
  }
});

// response 용 get
// 여기서 따로 response.js를 만들어주지 않는 이유는 결국 해당 엔드포인트에서 반환하는 것은 survey 객체이기 때문.
router.get("/responses/:deployId", async (req, res) => {
  try {
    const { deployId } = req.params;

    if (!(await checkUUID(deployId))) {
      res
        .status(400)
        .send(
          gc("Invalid UUID(should be xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)")
        );
      return;
    }

    const survey = await Survey.findOne(
      {
        deployId,
        ...NOT_DELETED,
      },
      "-_id title questions status branching themeColor"
    ).lean();

    if (!survey) {
      res.status(404).send(gc("Cannot find survey"));
      return;
    }

    // 해당 부분 추후 캐시 서버로 deployId: status 데이터만 저장하여 DB 조회를 줄일 수 있을 것으로 보임
    const status = survey.status;
    if (status === STATUS.EDITING || status == "editting")
      return res.status(400).send(gr({ status }, "Survey is now editing"));
    if (status === STATUS.PAUSED)
      return res.status(400).send(gr({ status }, "Survey is now paused"));
    if (status === STATUS.FINISHED)
      return res.status(400).send(gr({ status }, "Survey is now finished"));

    res.status(200).send(gr(survey, "Successfully got survey"));
  } catch (err) {
    console.log("Failed to Get Survey", err);
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
  const survey = await Survey.findOne(
    {
      $or: [{ id }, { deployId: id }],
      ...NOT_DELETED,
    },
    "-_id"
  ).lean();

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

  res.status(200).send(gr(survey, "Successfully got survey"));
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const update = { ...req.body };
    const result = await Survey.findOneAndUpdate(
      { id, ...IS_EDITING },
      update
    ).exec();
    if (!result) {
      res.status(404).send(gc("Cannot find survey"));
      return;
    }
    res.status(200).send(gc("Survey Update Success"));
  } catch (err) {
    console.log("Failed to Update Survey", err);
    res.status(500).send(gc("Server Error"));
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const update = { status: STATUS.DELETED };
    await Survey.findOneAndUpdate({ id, ...NOT_DELETED }, update).exec();
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
      { id, ...NOT_DELETED },
      { status: STATUS.PUBLISHED, userId: req.user.id }
    ).exec();
    if (!originalSurvey) return res.status(404).send(gc("Cannot find survey"));

    res.status(200).send(gr(originalSurvey, "Survey End Update Success"));
  } catch (err) {
    console.log("Failed to End Survey", err);
    res.status(500).send(gc("Server Error"));
  }
});

// 이것은 설문 상태 수정 api로써 추후 위의 end 엔드포인트도 해당 엔드포인트에 합칠 수 있을 것으로 보임
// 하지만 우선은 합치지 않는 이유는 위의 엔드포인트 경우에는 originalSurvey를 반환해줘야 하지만, 아래 경우는 필요 없기 때문이다.
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (
      !status ||
      !(
        status === STATUS.PAUSED ||
        status === STATUS.FINISHED ||
        status === STATUS.PUBLISHED
      )
    )
      return res.status(400).send(gc("Illegal Argument"));

    const originalSurvey = await Survey.findOneAndUpdate(
      { id, ...NOT_DELETED, ...NOT_FINISHED },
      { status: status, userId: req.user.id }
    ).exec();
    if (!originalSurvey)
      return res
        .status(404)
        .send(gc("Cannot Update survey(Deleted or Finished)"));

    res.status(200).send(gc(`Survey Status Update to ${status} Success`));
  } catch (err) {
    console.log("Failed to Change Survey Status", err);
    res.status(500).send(gc("Server Error"));
  }
});

// 이메일 업데이트
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
      res.status(400).send(gc("Email Send Fail"));
      return;
    }
    res.status(200).send(gc("Email Update and Send Success"));
  } catch (err) {
    console.log("Failed to Update Email", err);
    res.status(500).send(gc("Server Error"));
  }
});

// 응답 목록 받아오기
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

    const survey = await Survey.findOne({ id, ...NOT_DELETED });
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
    const survey = await Survey.findOne({ deployId, ...NOT_DELETED });
    if (!survey) {
      res.status(404).send(gc("No such survey exists."));
      return;
    }
    const response = { ...req.body, deployId };
    response.userId = req.user.id;
    await Response.create(response);
    res.status(201).send(gc("Create Response Success"));
  } catch (err) {
    console.log("Failed to Create Response", err);
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
      {
        userId,
        id,
        ...NOT_DELETED,
      },
      "-_id"
    ).lean();

    if (!originalSurvey) {
      res.status(404).send(gc("Cannot find survey"));
      return;
    }

    const newSurvey = await Survey.create({
      ...originalSurvey,
      status: "editing",
      id: uuidv4(),
      deployId: uuidv4(),
    });

    res.status(200).send(gr(newSurvey, "Create Copied Survey Success"));
  } catch (err) {
    console.log("Failed to Create Copied Survey", err);
    res.status(500).send(gc("Server Error"));
  }
});

module.exports = router;
