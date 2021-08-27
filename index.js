const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { getResponse: gr, getComment: gc } = require("./utils");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const jose = require("node-jose");
const axios = require("axios");
const Survey = require("./models/survey");

const PORT = 3000;
const app = express();
let verifier = null;

/**
 * When there are authroization header and it is valid,
 * assign payload of JWT to user attribute of req object.
 * It does not throw error even if jwt is invalid or there are no authroization header.
 */
async function checkJWT(req, res, next) {
  req.user = {};
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
  // GET /survey 로 하면 어떨까??
  try {
    const result = await Survey.create({
      id: uuidv4(),
      deployId: uuidv4(),
      userId: req.user.id
    });
    res.status(201).send(gr(result, "Survey Create Success"));
  } catch (err) {
    console.log("Faile to Create Link");
    res.status(500).send(gc("Server Error"));
  }
});

// Routers
app.use("/users", require("./routes/user"));
app.use("/surveys", require("./routes/survey"));

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