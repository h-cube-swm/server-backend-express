// Libraries
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const verify = require("./utils/jwt");

// Custom modules
const { getComment: gc } = require("./utils/response");

const PORT = 80;

/**
 * When there are authroization header and it is valid,
 * assign payload of JWT to user attribute of req object.
 * It DOES NOT throw error or block requests even if jwt is invalid or there are no authroization header.
 */
async function checkJWT(req, _, next) {
  req.user = {};
  try {
    const token = req.headers.authorization.split("Bearer ")[1];
    const verified = await verify(token);
    const payload = JSON.parse(verified.payload.toString());
    req.user = payload;
  } catch (err) {}
  next();
}

async function main() {
  // Connect to mongodb database
  const { DB_URL } = process.env;
  const connection = await mongoose.connect(`${DB_URL}`, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true,
  });
  console.log("Successfully connected to mongodb");

  const app = express();

  // Global middlewares
  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(checkJWT);
  app.use("/admin", require("./routes/admin")(connection));

  // Endpoint
  app.get("/", (req, res) => {
    res.status(200).send(gc("Server is running."));
  });

  // Routers
  app.use("/users", require("./routes/user"));
  app.use("/surveys", require("./routes/survey"));
  app.use("/profiles", require("./routes/profile"));
  app.use("/draws", require("./routes/draw"));

  // 404
  app.all("*", (req, res) => {
    res.status(404).send(gc("Such endpoint does not exists."));
  });

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
