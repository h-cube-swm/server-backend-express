const express = require("express");
const getResponse = require("./utils");

const PORT = 3000;
const app = express();

app.get("/", (req, res) => {
  res.status(200).send(getResponse(null, "Server is running."));
});
});

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});