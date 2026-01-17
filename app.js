const express = require("express");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const path = require("path"); 
const cors = require("cors");

const auth = require('./routes/auth.route');
const usersRoute = require('./routes/user.route');
const connection = require('./routes/connection.route');
const company = require('./routes/company.route');
const postRoutes = require('./routes/post.routes');
const trendsRoutes = require('./routes/trends.routes');

const app = express();

app.use(cors({
  origin: "*", 
  credentials: true
}));

app.use(express.json());
app.use(morgan("dev"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/", (req, res) => {
  res.send("LinkedIn Clone API is running...");
});

app.get("/google-setup", (req, res) => {
  const hasGoogleConfig = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
  
  res.json({
    success: true,
    message: "Google Signup Setup Status",
    setup: {
      configured: hasGoogleConfig,
      clientId: process.env.GOOGLE_CLIENT_ID ? "Configured" : "Missing",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ? "Configured" : "Missing",
      jwtSecret: process.env.JWT_SECRET ? "Configured" : "Missing",
    },
    endpoints: {
      googleSignup: "POST /signup/user/google",
      checkAvailability: "POST /check-google-signup",
      swaggerDocs: "GET /api-docs",
    },
    instructions: {
      step1: "Open Swagger UI at /api-docs",
      step2: "Find 'Auth' section",
      step3: "Use '/signup/user/google' endpoint with Google token",
      note: "Get Google token from frontend Google Sign-In button"
    }
  });
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/', auth);
app.use('/api/users', usersRoute);
app.use('/connection', connection);
app.use('/api/companies', company);
app.use('/api/posts', postRoutes);
app.use('/api/trends', trendsRoutes);

app.use('/api/jobs', require('./routes/job.routes'));
app.use('/api/messages', require('./routes/message.route'));
app.use('/api/notifications', require('./routes/notification.route'));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    error: err.message,
  });
});

module.exports = app;