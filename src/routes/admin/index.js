const express = require("express");
const User = require('../../models/user');
const Survey = require('../../models/survey');
const Response = require('../../models/response');

function checkRange({ limit, offset }) {
  const MAX_LIMIT = 25;

  if (isNaN(limit)) limit = MAX_LIMIT;
  if (isNaN(offset)) offset = 0;
  limit = +limit;
  offset = +offset;
  if (limit < 0) limit = 0;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;
  if (offset < 0) offset = 0;
  return { limit, offset };
}

module.exports = (database) => {

  let adminList = [1804921266];

  try {
    adminList = JSON.parse(process.env.ADMIN_LIST) || [];
  } catch { }

  const app = express.Router();

  app.get('/isLoggedIn', (req, res) => {
    res.send({ result: adminList.indexOf(req.user.id) >= 0 });
  });

  app.use((req, res, next) => {
    if (adminList.indexOf(req.user.id) >= 0) {
      next();
    } else {
      res.send({ result: {} });
    }
  });

  app.get('/test', (req, res) => res.send({ result: 'OK' }));

  app.get('/surveys', (req, res) => {
    let { limit, offset } = checkRange(req.query);
    let { order } = req.query;

    Survey.aggregate([
      { "$lookup": { "from": "response", "localField": "deployId", "foreignField": "deployId", "as": "responses" } },
      { "$addFields": { "responseCount": { $size: '$responses' } } }
    ])
      .sort(order || { responseCount: -1 })
      .skip(offset)
      .limit(limit)
      .exec((err, data) => res.send({ err, result: data }));
  });

  return app;
};
