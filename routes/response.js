const express = require("express");
const { getResponse } = require("../utils");
const Response = require("../models/response");

const router = express.Router();

router.get("/", (req, res) => {});

router.post("/", (req, res, next) => {});

module.exports = router;
