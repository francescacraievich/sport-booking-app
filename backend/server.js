require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const routes = require("./routes");

const app = express();
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB error:", err));

app.use("/api", routes);

app.use(express.static(path.join(__dirname, "client-build")));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "client-build/index.html"));
});

app.listen(process.env.PORT, () => {
  console.log("Server started on port " + process.env.PORT);
});
