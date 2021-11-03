const { getComment: gc } = require("../utils/response");

exports.checkLogin = (req, res, next) => {
  if (!req.user || !req.user.id) {
    res.status(400).send(gc("Not logged in."));
    return;
  }
  next();
};
