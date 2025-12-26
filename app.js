const express = require("express");
const morgan = require("morgan");
const auth = require('./routes/auth.route')
const usersRoute = require('./routes/user.route')
const connection = require('./routes/connection.route')
const company = require('./routes/company.route')
const app = express();

// Global Middleware
app.use(express.json());
app.use(morgan("dev"));

// Test Route
app.get("/", (req, res) => {
  res.send("✅ LinkedIn Clone API is running...");
});
app.use('/', auth); 
app.use('/user',usersRoute);
app.use('/connection',connection);
app.use('/company',company);

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
