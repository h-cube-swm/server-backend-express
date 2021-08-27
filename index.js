const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { getResponse: gr, getComment: gc } = require("./utils");
const mongoose = require("mongoose");
const {
  v4: uuidv4,
  version: uuidVersion,
  validate: uuidValidate,
} = require("uuid");
const jose = require("node-jose");
const axios = require("axios");
const Survey = require("./models/survey");

const PORT = 3000;
const app = express();
let verifier = null;

/**
 * Check if request has a body.
 * If the body does not exists or the body is an empty object, response an error.
 */
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

/**
 * 1. When there are survey UUID parameter at path,
 * 2. check if the UUID is valid
 * 3. and check if the UUID is in database.
 * 
 * Else, response an error.
 */
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

/**
 * When there are authroization header and it is valid,
 * assign payload of JWT to user attribute of req object.
 * It does not throw error even if jwt is invalid or there are no authroization header.
 */
async function checkJWT(req, res, next) {
  try {
    const token = req.headers.authorization.split("Bearer ")[1];
    const verified = await verifier.verify(token);
    const payload = JSON.parse(verified.payload.toString());
    req.user = payload;
  } catch (err) { }
  next();
}

// Global middlewares
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(checkJWT);

// Endpoint
app.get("/", (req, res) => {
  res.status(200).send(gc("Server is running."));
});

app.get("/link", async (req, res) => {
  // 추후 userId도 추가해야함
  try {
    const result = await Survey.create({ link: uuidv4() });
    res.status(201).send(gr(result, "Survey Create Success"));
  } catch (err) {
    console.log("Faile to Create Link");
    res.status(500).send(gc("Server Error"));
  }
});

// Routers
app.use("/users", checkHasBody, require("./routes/user"));
app.use("/surveys/:uuid", checkUUID, require("./routes/survey"));
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

async function main() {
  // Connect to database
  const { DB_USERNAME, DB_PASSWORD } = process.env;
  const encodedPassword = encodeURIComponent(DB_PASSWORD);
  await mongoose.connect(
    `mongodb://${DB_USERNAME}:${encodedPassword}@mongo:27017/`,
    {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useFindAndModify: false,
    }
  );
  console.log("Successfully connected to mongodb");

  // Get RS254 JWT public key
  const response = await axios.get("https://auth.the-form.io/keys");
  const publicKey = response.data;
  const keyStore = await jose.JWK.asKeyStore(publicKey);
  verifier = jose.JWS.createVerify(keyStore);
  console.log("Successfully got JWT public keys");

  // Start server application
  app.listen(PORT, () => {
    console.log(`Server opened at port ${PORT}.`);
  });
}

try {
  main();
} catch (err) {
  console.log('Could not start server');
  console.log('Error :', err);
}