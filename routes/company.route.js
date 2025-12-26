const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const protect = require('../middleware/mockAuth'); // Switch to '../middleware/auth' later
const upload = require('../middleware/upload'); // <--- Import Middleware

// --- GET /api/companies/:id ---
router.get('/', protect, companyController.getCompanyProfile);
router.put(
  '/edit/:id', 
  protect,                // 1. Check Token
  upload.single('logo'),  // 2. Handle Logo Upload (Form field name must be 'logo')
  companyController.updateCompany // 3. Logic
);

module.exports = router;