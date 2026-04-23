require("dotenv").config();
const express = require("express");
const cors = require("cors");
const profilesRouter = require("./routes/profiles");

const app = express();

app.use(cors({ origin: "*" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Insighta Labs Intelligence Query Engine v1.0",
    endpoints: {
      list: "GET /api/profiles",
      search: "GET /api/profiles/search?q=<natural language>",
      single: "GET /api/profiles/:id",
    },
  });
});

app.use("/api/profiles", profilesRouter);

app.use((req, res) => {
  res.status(404).json({ status: "error", message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ status: "error", message: "Internal server error" });
});

module.exports = app;
