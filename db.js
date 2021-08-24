const mongoose = require("mongoose");

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

module.exports = mongoose;
