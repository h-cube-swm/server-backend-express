const express = require("express");
const getResponse = require("./utils");
const testDB = require("./models/test");

const PORT = 3000;
const app = express();

app.get("/", (req, res) => {
  res.status(200).send(getResponse(null, "Server is running."));
});

app.get("/test", (req, res) => {
  testDB.find((err, test) => {
    if (err) {
      console.log(err);
      console.log("failed to get");
    }

    res.json(test);
  });
});

// 404
app.get("*", (req, res) => {
  res.status(404).send(getResponse(null, "Such endpoint does not exists."));
});

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});
