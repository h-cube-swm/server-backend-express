const express = require("express");
const bodyParser = require("body-parser");
const getResponse = require("./utils");
const mongoose = require("mongoose");

const PORT = 3000;
const app = express();

function checkHasBody(req, res, next) {
  const method = req.method.toLowerCase();
  if (method === "post" || method === "put") {
    if (Object.keys(req.body).length > 0) {
      next();
    } else {
      res.send(getResponse(null, "Error"));
    }
  } else {
    next();
  }
}

// Body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Endpoint
app.get("/", (req, res) => {
  res.status(200).send(getResponse(null, "Server is running."));
});

app.get("/link", (req, res) => {
  res.status(200).send(getResponse(Math.random(), "Create Link"));
});

// Routers
app.use("/user", checkHasBody, require("./routes/user"));
app.use("/survey", checkHasBody, require("./routes/survey"));
app.use("/response", checkHasBody, require("./routes/response"));

// 404
app.get("*", (req, res) => {
  res.status(404).send(getResponse(null, "Such endpoint does not exists."));
});

// CONNECT TO MONGODB SERVER
const { DB_USERNAME, DB_PASSWORD } = process.env;

mongoose
  .connect(
    `mongodb://${DB_USERNAME}:${encodeURIComponent(DB_PASSWORD)}@mongo:27017/`,
    {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    }
  )
  .then(() => console.log("Successfully connected to mongodb"))
  .catch((e) => console.error(e));

app.listen(PORT, () => {
  console.log(`Server opened at port ${PORT}.`);
});
