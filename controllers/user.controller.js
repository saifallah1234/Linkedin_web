const User = require('../models/User.model');
const mongoose = require('mongoose');

exports.getUserProfile = async (req, res) => {
  try {
    const userId= req.user.id;


    // 2. Find User
    // .select('-password') ensures password is never sent, even if select:false was missing
    // .populate(...) replaces the companyId with actual Company data (Name, Logo)
    const user = await User.findById(userId)
      .select('-password')
      .populate('followingCompanies.companyId', 'name logo location');

    // 3. Handle Not Found
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 4. Send Data
    res.json(user);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ... existing imports
const fs = require('fs'); // Needed to delete old images if replaced

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    // --- 1. SECURITY: Ownership Check ---
    // Ensure the user requesting the update is the owner of the account
    if (req.user.id !== id) {
      return res.status(403).json({ message: 'You can only update your own profile' });
    }

    // --- 2. Prepare Update Data ---
    // We copy req.body so we can modify it safely
    const updates = { ...req.body };

    // Prevent updating sensitive fields via this route
    delete updates.role;
    delete updates._id;
    delete updates.createdAt;

    // --- 3. Handle Image Upload ---
    // If a file was uploaded, we use its path. 
    // If no file, we keep whatever was in req.body (or do nothing)
    if (req.file) {
      updates.image = req.file.path;
      
      // Logic to delete the old image file from server to save space
      const oldUser = await User.findById(id);
      if (oldUser.image && fs.existsSync(oldUser.image)) fs.unlinkSync(oldUser.image);
    }

    // --- 4. Parse Arrays (If sent as JSON strings) ---
    // If you use Postman 'form-data', arrays often arrive as strings like '[{"school":"MIT"}]'
    // We need to parse them back into Objects.
    ['education', 'projects', 'experiences', 'skills', 'certificates'].forEach(field => {
      if (typeof updates[field] === 'string') {
        try {
          updates[field] = JSON.parse(updates[field]);
        } catch (e) {
          // If parsing fails, it might be an empty string or invalid, so we delete it to avoid DB error
          delete updates[field];
        }
      }
    });

    // --- 5. Perform Update ---
    // { new: true } returns the updated document
    // { runValidators: true } ensures data matches Schema rules
    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const Company = require('../models/Company.model'); // Don't forget to import Company!

exports.followCompany = async (req, res) => {
  try {
    const userId = req.user.id;        // From Token (or Mock Middleware)
    const companyId = req.params.id;   // From URL

    // 1. Check if Company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // 2. Check if User is already following this company
    // We look for a user who matches BOTH the userId AND has this companyId in their list
    const userAlreadyFollowing = await User.findOne({
      _id: userId,
      'followingCompanies.companyId': companyId
    });

    if (userAlreadyFollowing) {
      return res.status(400).json({ message: 'You are already following this company' });
    }

    // 3. Add to User's "followingCompanies" array
    // We use $push to add the new object
    await User.findByIdAndUpdate(userId, {
      $push: {
        followingCompanies: {
          companyId: companyId,
          followedAt: new Date() // Add timestamp if your schema supports it
        }
      }
    });
    await Company.findByIdAndUpdate(companyId, {
      $addToSet: { followers: userId } // Add the User ID to the Company
    });

    res.json({ message: `You are now following ${company.name}` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.unfollowCompany = async (req, res) => {
  try {
    const userId = req.user.id;      // From Token
    const companyId = req.params.id; // From URL

    // --- Perform Unfollow ---
    // $pull removes the object from the array where 'companyId' matches the ID provided
    const user = await User.findByIdAndUpdate(userId, {
      $pull: { 
        followingCompanies: { companyId: companyId } 
      }
    }, { new: true }); // Return the updated user

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await Company.findByIdAndUpdate(companyId, {
      $pull: { followers: userId }
    });

    res.json({ 
      message: 'Unfollowed company successfully',
      // Optional: return the updated list so frontend can update immediately
      followingCompanies: user.followingCompanies 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFollowingList = async (req, res) => {
  try {
    const userId = req.user.id; // From Token
    console.log(userId)
    const user = await User.findById(userId)
      .select('followingCompanies') // We only need this field
      .populate('followingCompanies.companyId', 'name logo location website'); // Get real company details

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return just the array to make it easier for frontend
    res.json(user.followingCompanies);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};