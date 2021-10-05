const express = require("express");
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const User = require('../../models/user');
const Survey = require('../../models/survey');
const Response = require('../../models/response');

module.exports = (database) => {
  const { ADMIN, COOKIE_SECRET } = { ADMIN: {}, COOKIE_SECRET: null };
  //  JSON.parse(fs.readFileSync(path.join(__dirname, '.env.json')));

  const app = express.Router();

  // creating 24 hours from milliseconds
  const oneDay = 1000 * 60 * 60 * 24;

  //session middleware
  // app.use(session({
  //   secret: COOKIE_SECRET,
  //   saveUninitialized: true,
  //   cookie: { maxAge: oneDay },
  //   resave: false
  // }));

  // app.use(express.static(path.join(__dirname, 'public')));

  // app.get('/isLoggedIn', (req, res) => {
  //   res.send({ data: req.session.isLoggedIn });
  // });

  // app.post('/login', (req, res) => {
  //   if (req.body.email === ADMIN.email && req.body.password === ADMIN.password) {
  //     req.session.isLoggedIn = true;
  //     res.redirect('/admin');
  //   } else {
  //     req.session.destroy();
  //   }
  // });

  app.use((req, res, next) => {
    if (req.session.isLoggedIn) {
      next();
    } else {
      res.redirect('/admin/login.html');
    }
  });

  app.get('/test', (_, res) => res.send({ data: 'OK' }));

  app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login.html');
  });

  app.get('/surveys', (req, res) => {
    let { limit, offset } = req.query;
    if (isNaN(limit)) limit = 50;
    if (isNaN(offset)) offset = 0;
    limit = +limit;
    offset = +offset;
    if (limit < 0) limit = 0;
    if (limit > 20) limit = 20;
    if (offset < 0) offset = 0;
    Response.aggregate([
      { "$group": { "_id": "$deployId", "responseCount": { "$sum": 1 } } },
      { "$lookup": { "from": "surveys", "localField": "_id", "foreignField": "deployId", "as": "survey" } },
      { "$unwind": { path: "$survey" } },
    ])
      .sort({ responseCount: -1 })
      .skip(offset)
      .limit(limit)
      .exec((err, data) => res.send({ err, data }));
  });

  return app;
};
