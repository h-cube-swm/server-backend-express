const express = require("express");
const { getResponse: gr, getComment: gc } = require("../utils");
const User = require("../models/user");

const router = express.Router();

router.get("/", (req, res) => { });

router.post("/", (req, res) => { });

module.exports = router;
