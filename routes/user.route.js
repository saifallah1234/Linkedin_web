const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const protect = require('../middleware/mockAuth');
const upload = require('../middleware/upload'); // <--- Import Middleware

router.get('/', protect,userController.getUserProfile);


router.get('/following', protect, userController.getFollowingList);


// --- GET /api/users/:id ---

router.put(
  '/edit/:id', 
  protect,              
  upload.single('image'), 
  userController.updateUser 
);

router.post('/follow/:id', protect, userController.followCompany);
router.post('/unfollow/:id', protect, userController.unfollowCompany);

module.exports = router;