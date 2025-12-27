const express = require("express");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const auth = require('./routes/auth.route');
const usersRoute = require('./routes/user.route');
const connection = require('./routes/connection.route');
const company = require('./routes/company.route');
const postRoutes = require('./routes/post.routes');
const app = express();

// Global Middleware
app.use(express.json());
app.use(morgan("dev"));

// 🔹 Swagger route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Test Route
app.get("/", (req, res) => {
  res.send("✅ LinkedIn Clone API is running...");
});

app.use('/', auth);
app.use('/user', usersRoute);
app.use('/connection', connection);
app.use('/company', company);
app.use('/api/posts', postRoutes);

app.use('/api/jobs', require('./routes/job.routes'));
app.use('/api/messages', require('./routes/message.route'));
app.use('/api/notifications', require('./routes/notification.route'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    error: err.message,
  });
});

module.exports = app;
