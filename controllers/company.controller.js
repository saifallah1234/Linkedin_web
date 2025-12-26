const Company = require('../models/Company.model');
const mongoose = require('mongoose');

exports.getCompanyProfile = async (req, res) => {
  try {
    const id = req.user.id;
    // 1. Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Company ID format' });
    }

    // 2. Find Company
    // .select('-password') -> Hides the password
    // .populate('followers', ...) -> Replaces User IDs with actual User data
    const company = await Company.findById(id)
      .select('-password')
      .populate('followers', 'firstName lastName image headline'); 

    // 3. Handle Not Found
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // 4. Send Data
    res.json(company);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
const fs = require('fs'); // Uncomment if you want to delete old logo files

exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;

    // --- 1. SECURITY: Ownership Check ---
    // Ensure the token belongs to the company trying to update itself
    // req.user.id comes from the Token (or mockAuth)
    if (req.user.id !== id) {
      return res.status(403).json({ message: 'You can only update your own company profile' });
    }

    // --- 2. Prepare Update Data ---
    const updates = { ...req.body };

    // Prevent updating sensitive/immutable fields
    delete updates.password;
    delete updates.followers; // Followers are managed via follow/unfollow actions, not here
    delete updates._id;
    delete updates.createdAt;

    // --- 3. Handle Logo Upload ---
    // If a file is uploaded, Multer puts it in req.file
    if (req.file) {
      updates.logo = req.file.path;
      
      // Optional: Logic to delete old logo file from server
      // const oldCompany = await Company.findById(id);
      // if (oldCompany.logo && fs.existsSync(oldCompany.logo)) fs.unlinkSync(oldCompany.logo);
    }

    // --- 4. Perform Update ---
    const updatedCompany = await Company.findByIdAndUpdate(id, updates, {
      new: true,          // Return the updated document
      runValidators: true // Enforce Schema rules (e.g., max length)
    }).select('-password');

    if (!updatedCompany) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({
      message: 'Company profile updated successfully',
      company: updatedCompany
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};