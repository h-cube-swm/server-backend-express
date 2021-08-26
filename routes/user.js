const express = require("express");
const { getResponse } = require("../utils");
const User = require("../models/user");

const router = express.Router();

router.get("/", (req, res) => {});

router.post("/", (req, res, next) => {});

module.exports = router;
