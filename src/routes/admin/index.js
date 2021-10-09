const express = require("express");
const User = require('../../models/user');
const Survey = require('../../models/survey');
const Response = require('../../models/response');

function checkRange({ limit, offset }) {
  if (isNaN(limit)) limit = 50;
  if (isNaN(offset)) offset = 0;
  limit = +limit;
  offset = +offset;
  if (limit < 0) limit = 0;
  if (limit > 20) limit = 20;
  if (offset < 0) offset = 0;
  return { limit, offset };
}

module.exports = (database) => {

  let adminList = [];

  try {
    adminList = JSON.parse(process.env.ADMIN_LIST) || [];
  } catch { }

  const app = express.Router();

  app.get('/isLoggedIn', (req, res) => {
    res.send({ data: adminList.indexOf(req.user.id) >= 0 });
  });

  app.use((req, res, next) => {
    if (adminList.indexOf(req.user.id) >= 0) {
      next();
    } else {
      res.redirect('/');
    }
  });

  app.get('/test', (_, res) => res.send({ data: 'OK' }));

  app.get('/surveys', (req, res) => {
    let { limit, offset } = checkRange(req.query);
    let { condition, order } = req.query;

    Response.find(condition || {})
      .sort(order || { createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .exec((err, data) => res.send({ err, data }));
  });

  app.get('/surveys/count', (req, res) => {
    let { limit, offset } = checkRange(req.query);
    let { order } = req.query;

    Response.aggregate([
      { "$group": { "_id": "$deployId", "responseCount": { "$sum": 1 } } },
      { "$lookup": { "from": "surveys", "localField": "_id", "foreignField": "deployId", "as": "survey" } },
      { "$unwind": { path: "$survey" } },
    ])
      .sort(order || { responseCount: -1 })
      .skip(offset)
      .limit(limit)
      .exec((err, data) => res.send({ err, data }));
  });

  return app;
};
