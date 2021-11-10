// validation for express-validator
const { validationResult } = require("express-validator");
const { getResponse: gr } = require("../utils/response");

exports.validatorErrorChecker = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .send(gr({ errors: errors.array() }, "Invalid arguements"));
  }
  next();
};
