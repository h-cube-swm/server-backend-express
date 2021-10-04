const express = require("express");
const fs = require('fs');
const path = require('path');
const session = require('express-session');

module.exports = (database) => {
  const { ADMIN, COOKIE_SECRET } = JSON.parse(fs.readFileSync(path.join(__dirname, '.env.json')));

  const router = express.Router();

  // creating 24 hours from milliseconds
  const oneDay = 1000 * 60 * 60 * 24;

  //session middleware
  router.use(session({
    secret: COOKIE_SECRET,
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false
  }));

  router.use(express.static(path.join(__dirname, 'public')));

  router.get('/isLoggedIn', (req, res) => {
    res.send({ data: req.session.isLoggedIn });
  });

  router.post('/login', (req, res) => {
    if (req.body.email === ADMIN.email && req.body.password === ADMIN.password) {
      req.session.isLoggedIn = true;
      res.redirect('/admin');
    } else {
      req.session.destroy();
    }
  });

  router.use((req, res, next) => {
    if (req.session.isLoggedIn) {
      next();
    } else {
      res.redirect('/admin/login.html');
    }
  });

  router.get('/test', (_, res) => res.send({ data: 'OK' }));

  router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login.html');
  });

  return router;
};
