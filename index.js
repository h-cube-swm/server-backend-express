// Libraries
const cors = require("cors");
const jose = require("node-jose");
const axios = require("axios");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

// Custom modules
const { getComment: gc } = require("./utils/response");

const PORT = 80;
const app = express();
let verifier = null;

/**
 * When there are authroization header and it is valid,
 * assign payload of JWT to user attribute of req object.
 * It DOES NOT throw error or block requests even if jwt is invalid or there are no authroization header.
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

// Routers
app.use("/users", require("./routes/user"));
app.use("/surveys", require("./routes/survey"));

// 404
app.all("*", (req, res) => {
  res.status(404).send(gc("Such endpoint does not exists."));
});

async function main() {
  // Connect to mongodb database
  const { DB_URL } = process.env;
  await mongoose.connect(`${DB_URL}`, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true,
  });
  console.log("Successfully connected to mongodb");

  // Get RS256 JWT public key and create verifier
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
  console.log("Could not start server");
  console.log("Error :", err);
}
