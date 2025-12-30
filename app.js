const express = require("express");
const morgan = require("morgan");
const path = require("path");
const expressLayouts = require('express-ejs-layouts');
const auth = require('./routes/auth.route')
const usersRoute = require('./routes/user.route')
const connection = require('./routes/connection.route')
const company = require('./routes/company.route')
const app = express();

// --- CONFIGURATION EJS ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts); // Utilise express-ejs-layouts
app.set('layout', 'layouts'); // Définit layouts.ejs comme fichier de base

// --- FICHIERS STATIQUES ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
// Global Middleware
app.use(express.json());
app.use(morgan("dev"));

// --- ROUTES D'INTERFACE (VIEW ROUTES) ---
app.get('/', (req, res) => {
    res.redirect('/jobs');
});
app.get('/jobs', (req, res) => res.render('jobs'));
app.get('/jobs/create', (req, res) => res.render('create-job'));
app.get('/inbox', (req, res) => res.render('inbox'));
app.get('/notifications', (req, res) => res.render('notifications'));
app.get('/applications', (req, res) => res.render('applications'));
app.get('/applications/me', (req, res) => res.render('my-application'));
// Test Route
// app.get("/", (req, res) => {
//   res.send("✅ LinkedIn Clone API is running...");
// });
app.use('/', auth); 
app.use('/user',usersRoute);
app.use('/connection',connection);
app.use('/company',company);

app.use('/api/jobs', require('./routes/job.routes'));
app.use('/api/messages', require('./routes/message.route')); // Added
app.use('/api/notifications', require('./routes/notification.route')); // Added
// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    error: err.message,
  });
});

module.exports = app;
