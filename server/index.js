const express = require("express");
const mongoose = require("mongoose");
const config = require("config");
const fileUpload = require("express-fileupload");
const app = express();

const PORT = config.get("serverPort") || 5000;

app.use(fileUpload({}));
app.use(express.json());
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/file", require("./routes/file.routes"));

const start = async () => {
  try {
    await mongoose.connect(config.get("dbUrl"));

    app.listen(PORT, () => {
      console.log("Server started on port", PORT);
    });
  } catch (error) {}
};

start();
