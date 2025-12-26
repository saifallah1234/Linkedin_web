const express = require("express");
const morgan = require("morgan");

const app = express();

// Global Middleware
app.use(express.json());
app.use(morgan("dev"));

// Test Route
app.get("/", (req, res) => {
  res.send("✅ LinkedIn Clone API is running...");
});

app.use('/api/jobs', require('./routes/job.routes'));
//app.use('/api/applications', require('./routes/application.routes'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    error: err.message,
  });
});

module.exports = app;
