// Compatibility shim: forward to the real authentication middleware.
// This file used to provide a developer-only mock auth. All routes now
// use the concrete `authenticate` middleware from `auth.js`. To avoid
// breaking any remaining imports that reference `mockAuth`, we export
// the real `authenticate` function here.

module.exports = require('./auth').authenticate;