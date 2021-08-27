const express = require("express");
const bodyParser = require("body-parser");
const { getResponse: gr, getComment: gc } = require("./utils");
const mongoose = require("mongoose");
const {
  v4: uuidv4,
  version: uuidVersion,
  validate: uuidValidate,
} = require("uuid");
const Survey = require("./models/survey");

const PORT = 3000;
const app = express();

function checkHasBody(req, res, next) {
  const method = req.method.toLowerCase();

  if (req.url === "/end/") {
    next();
    return;
  }

  if (method !== "post" && method !== "put") {
    next();
    return;
  }

  if (Object.keys(req.body).length > 0) {
    next();
    return;
  }

  res.send(gc("Illegal Arguments(Json Body is Required)"));
}

async function checkUUID(req, res, next) {
  const uuid = req.params.uuid;
  const isUUID = uuidValidate(uuid) && uuidVersion(uuid) === 4;
  if (!isUUID) {
    res
      .status(400)
      .send(gc("Invalid UUID(should be xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)"));
  }

  try {
    const survey = await Survey.findOne({ link: uuid });
    if (!survey) {
      res.status(400).send(gc("Invalid Survey ID"));
      return;
    }

    req.survey = survey;
    next();
  } catch (err) {
    console.log(err);
    res.status(500).send(gc("Server Error"));
  }
}

// Body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Endpoint
app.get("/", (req, res) => {
  res.status(200).send(gc("Server is running."));
});

app.get("/link", async (req, res) => {
  try {
    const result = await Survey.create({ link: uuidv4() });
    res.status(201).send(gr(result, "Create Success"));
  } catch (err) {
    console.log("Faile to Create Link", err);
    res.status(500).send(gc("Server Error"));
  }
});

// Routers
app.use("/users", checkHasBody, require("./routes/user"));
app.use("/surveys/:uuid", checkUUID, checkHasBody, require("./routes/survey"));
app.use(
  "/surveys/:uuid/responses",
  checkUUID,
  checkHasBody,
  require("./routes/response")
);

// 404
app.all("*", (req, res) => {
  res.status(404).send(gc("Such endpoint does not exists."));
});

// CONNECT TO MONGODB SERVER
const { DB_USERNAME, DB_PASSWORD } = process.env;

const connectDB = async () => {
  try {
    await mongoose.connect(
      `mongodb://${DB_USERNAME}:${encodeURIComponent(
        DB_PASSWORD
      )}@mongo:27017/`,
      {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useFindAndModify: false,
      }
    );

    console.log("Successfully connected to mongodb");
  } catch (err) {
    console.log("Failed to connect to MongoDB", err);
  }
};

connectDB();

app.listen(PORT, () => {
  console.log(`Server opened at port ${PORT}.`);
});
