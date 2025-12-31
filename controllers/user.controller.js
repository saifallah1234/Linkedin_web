const User = require('../models/User.model');
const mongoose = require('mongoose');
const JobOffer = require('../models/JobOffer.model');

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

// Public profile for viewing other users (non-authenticated)
exports.getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if(!id) return res.status(400).json({ message: 'Missing id' });

    const user = await User.findById(id)
      .select('-password -email')
      .populate('followingCompanies.companyId', 'name logo location');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get suggestions for users to follow (companies) and users to connect with
const Connection = require('../models/Connection.model');
exports.getSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit, 10) || 5;

    // Get current user with their following companies
    const user = await User.findById(userId).select('followingCompanies');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const followedCompanyIds = (user.followingCompanies || []).map(f => f.companyId.toString());

    // Get connected user ids (ACCEPTED connections)
    const connections = await Connection.find({
      $or: [ { requesterId: userId }, { receiverId: userId } ],
      status: 'ACCEPTED'
    }).select('requesterId receiverId').lean();

    const connectedUserIds = connections.reduce((acc, c) => {
      const other = c.requesterId.toString() === userId ? c.receiverId.toString() : c.requesterId.toString();
      acc.push(other);
      return acc;
    }, []);

    // Suggested companies (exclude followed)
    const companyMatch = followedCompanyIds.length ? { _id: { $nin: followedCompanyIds.map(id => mongoose.Types.ObjectId(id)) } } : {};
    const suggestedCompanies = await Company.aggregate([
      { $match: companyMatch },
      { $sample: { size: Math.min(limit, 20) } },
      { $project: { name: 1, logo: 1, location: 1, description: 1 } }
    ]);

    // Suggested users (exclude self and already connected users)
    const excludeUserIds = [ mongoose.Types.ObjectId(userId), ...((connectedUserIds || []).map(id => mongoose.Types.ObjectId(id))) ];
    const suggestedUsers = await User.aggregate([
      { $match: { _id: { $nin: excludeUserIds } } },
      { $sample: { size: Math.min(limit, 20) } },
      { $project: { firstName: 1, lastName: 1, image: 1, location: 1 } }
    ]);

    // Limit results to requested limit
    res.json({
      suggestedCompanies: suggestedCompanies.slice(0, limit),
      suggestedUsers: suggestedUsers.slice(0, limit)
    });

  } catch (error) {
    console.error('getSuggestions error:', error);
    res.status(500).json({ message: error.message });
  }
};

// --- CRUD for Experiences, Projects, Skills, Certificates ---

// Experiences
exports.addExperience = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, company, startDate, endDate, description } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.experiences.push({ title, company, startDate, endDate, description });
    await user.save();
    const added = user.experiences[user.experiences.length - 1];
    res.status(201).json(added);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateExperience = async (req, res) => {
  try {
    const userId = req.user.id;
    const expId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const exp = user.experiences.id(expId);
    if (!exp) return res.status(404).json({ message: 'Experience not found' });

    Object.assign(exp, req.body);
    await user.save();
    res.json(exp);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteExperience = async (req, res) => {
  try {
    const userId = req.user.id;
    const expId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const exp = user.experiences.id(expId);
    if (!exp) return res.status(404).json({ message: 'Experience not found' });

    exp.remove();
    await user.save();
    res.json({ message: 'Experience removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
exports.getUserSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit, 10) || 5;

    // Get connected user ids
    const connections = await Connection.find({
      $or: [{ requesterId: userId }, { receiverId: userId }],
      status: 'ACCEPTED'
    }).select('requesterId receiverId').lean();

    const connectedUserIds = connections.reduce((acc, c) => {
      const other = c.requesterId.toString() === userId ? c.receiverId.toString() : c.requesterId.toString();
      acc.push(other);
      return acc;
    }, []);

    // Add self to exclude list
    const excludeIds = [...connectedUserIds, userId];

    // Get random users not connected yet
    const suggestedUsers = await User.aggregate([
      {
        $match: {
          _id: { $nin: excludeIds.map(id => new mongoose.Types.ObjectId(id)) }
        }
      },
      { $sample: { size: Math.min(limit * 2, 50) } },
      { $limit: limit },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          image: 1,
          location: 1,
          headline: 1
        }
      }
    ]);

    res.json(suggestedUsers);
  } catch (error) {
    console.error('getUserSuggestions error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get company suggestions (companies to follow)
exports.getCompanySuggestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit, 10) || 5;

    // Get user's followed companies
    const user = await User.findById(userId).select('followingCompanies');
    const followedCompanyIds = (user.followingCompanies || []).map(f => f.companyId.toString());

    // Get random companies not followed yet
    const suggestedCompanies = await Company.aggregate([
      {
        $match: {
          _id: { $nin: followedCompanyIds.map(id => new mongoose.Types.ObjectId(id)) }
        }
      },
      { $sample: { size: Math.min(limit * 2, 50) } },
      { $limit: limit },
      {
        $project: {
          name: 1,
          logo: 1,
          location: 1,
          description: 1,
          website: 1
        }
      }
    ]);

    res.json(suggestedCompanies);
  } catch (error) {
    console.error('getCompanySuggestions error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get active jobs (not applied to yet)
exports.getActiveJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Get all jobs user has applied to
    const appliedJobs = await JobOffer.find({
      'applicants.userId': userId
    }).select('_id').lean();

    const appliedJobIds = appliedJobs.map(job => job._id);

    // Get active jobs not applied to
    const now = new Date();
    const jobs = await JobOffer.find({
      _id: { $nin: appliedJobIds },
      isActive: true,
      deadline: { $gt: now } // Jobs not expired
    })
      .populate('companyId', 'name logo location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await JobOffer.countDocuments({
      _id: { $nin: appliedJobIds },
      isActive: true,
      deadline: { $gt: now }
    });

    res.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('getActiveJobs error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get jobs expiring soon (within 7 days)
exports.getExpiringJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit, 10) || 10;

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get jobs expiring within 7 days
    const expiringJobs = await JobOffer.find({
      isActive: true,
      deadline: {
        $gt: now,
        $lte: sevenDaysFromNow
      }
    })
      .populate('companyId', 'name logo location')
      .sort({ deadline: 1 }) // Sort by closest deadline
      .limit(limit)
      .lean();

    res.json(expiringJobs);
  } catch (error) {
    console.error('getExpiringJobs error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get companies currently hiring
exports.getHiringCompanies = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Find companies with active job postings created in last 30 days
    const activeJobs = await JobOffer.aggregate([
      {
        $match: {
          isActive: true,
          deadline: { $gt: now },
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$companyId',
          jobCount: { $sum: 1 },
          latestJobDate: { $max: '$createdAt' }
        }
      },
      { $sort: { jobCount: -1, latestJobDate: -1 } },
      { $limit: limit }
    ]);

    const companyIds = activeJobs.map(job => job._id);
    const companies = await Company.find({ _id: { $in: companyIds } })
      .select('name logo location description website')
      .lean();

    // Merge job count with company data
    const companiesWithJobCount = companies.map(company => {
      const jobData = activeJobs.find(job => job._id.toString() === company._id.toString());
      return {
        ...company,
        activeJobCount: jobData ? jobData.jobCount : 0
      };
    });

    res.json(companiesWithJobCount);
  } catch (error) {
    console.error('getHiringCompanies error:', error);
    res.status(500).json({ message: error.message });
  }
};
// Projects
exports.addProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, link, technologies } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.projects.push({ title, link, technologies: Array.isArray(technologies) ? technologies : (technologies ? JSON.parse(technologies) : []) });
    await user.save();
    const added = user.projects[user.projects.length - 1];
    res.status(201).json(added);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const projId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const proj = user.projects.id(projId);
    if (!proj) return res.status(404).json({ message: 'Project not found' });

    if (req.body.technologies && typeof req.body.technologies === 'string') {
      req.body.technologies = JSON.parse(req.body.technologies);
    }

    Object.assign(proj, req.body);
    await user.save();
    res.json(proj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const projId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const proj = user.projects.id(projId);
    if (!proj) return res.status(404).json({ message: 'Project not found' });

    proj.remove();
    await user.save();
    res.json({ message: 'Project removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Skills
exports.addSkill = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Skill name required' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.skills.push({ name });
    await user.save();
    const added = user.skills[user.skills.length - 1];
    res.status(201).json(added);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateSkill = async (req, res) => {
  try {
    const userId = req.user.id;
    const skillId = req.params.id;
    const { name } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const skill = user.skills.id(skillId);
    if (!skill) return res.status(404).json({ message: 'Skill not found' });
    skill.name = name || skill.name;
    await user.save();
    res.json(skill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteSkill = async (req, res) => {
  try {
    const userId = req.user.id;
    const skillId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const skill = user.skills.id(skillId);
    if (!skill) return res.status(404).json({ message: 'Skill not found' });

    skill.remove();
    await user.save();
    res.json({ message: 'Skill removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Certificates
exports.addCertificate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, obtainedAt } = req.body;
    if (!name) return res.status(400).json({ message: 'Certificate name required' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.certificates.push({ name, obtainedAt });
    await user.save();
    const added = user.certificates[user.certificates.length - 1];
    res.status(201).json(added);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateCertificate = async (req, res) => {
  try {
    const userId = req.user.id;
    const certId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const cert = user.certificates.id(certId);
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });

    Object.assign(cert, req.body);
    await user.save();
    res.json(cert);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCertificate = async (req, res) => {
  try {
    const userId = req.user.id;
    const certId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const cert = user.certificates.id(certId);
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });

    cert.remove();
    await user.save();
    res.json({ message: 'Certificate removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Generate PDF Resume from user profile
exports.generateResumePDF = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get full user profile with all details
    const user = await User.findById(userId)
      .select('-password -email')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Use PDFKit to generate PDF
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 40 });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${user.firstName}_${user.lastName}_Resume.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // HEADER - Name and Title
    doc.fontSize(24).font('Helvetica-Bold').text(`${user.firstName} ${user.lastName}`, { align: 'center' });
    
    if (user.headline) {
      doc.fontSize(12).font('Helvetica').text(user.headline, { align: 'center' });
    }
    
    doc.fontSize(10).fillColor('#666').text(`${user.location || ''} | ${user.email || ''} | ${user.phone || ''}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.strokeColor('#CCCCCC').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);

    // ABOUT/SUMMARY
    if (user.about) {
      doc.font('Helvetica-Bold').fontSize(12).text('PROFESSIONAL SUMMARY');
      doc.font('Helvetica').fontSize(10).text(user.about);
      doc.moveDown(0.5);
    }

    // EXPERIENCE
    if (user.experiences && user.experiences.length > 0) {
      doc.font('Helvetica-Bold').fontSize(12).text('EXPERIENCE');
      
      user.experiences.forEach((exp, idx) => {
        doc.font('Helvetica-Bold').fontSize(11).text(exp.title);
        doc.font('Helvetica-Oblique').fontSize(10).fillColor('#0073B1').text(exp.company);
        doc.fillColor('#000');
        
        const startDate = new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const endDate = exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present';
        doc.font('Helvetica').fontSize(9).text(`${startDate} - ${endDate}`);
        
        if (exp.description) {
          doc.fontSize(9).text(exp.description);
        }
        
        if (idx < user.experiences.length - 1) {
          doc.moveDown(0.3);
        }
      });
      
      doc.moveDown(0.5);
    }

    // EDUCATION
    if (user.education && user.education.length > 0) {
      doc.font('Helvetica-Bold').fontSize(12).text('EDUCATION');
      
      user.education.forEach((edu, idx) => {
        doc.font('Helvetica-Bold').fontSize(11).text(edu.school);
        doc.font('Helvetica').fontSize(10).text(`${edu.degree}${edu.fieldOfStudy ? ' in ' + edu.fieldOfStudy : ''}`);
        
        const startDate = new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const endDate = edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present';
        doc.fontSize(9).fillColor('#666').text(`${startDate} - ${endDate}`);
        doc.fillColor('#000');
        
        if (edu.grade) {
          doc.fontSize(9).text(`GPA: ${edu.grade}`);
        }
        
        if (idx < user.education.length - 1) {
          doc.moveDown(0.3);
        }
      });
      
      doc.moveDown(0.5);
    }

    // SKILLS
    if (user.skills && user.skills.length > 0) {
      doc.font('Helvetica-Bold').fontSize(12).text('SKILLS');
      const skillNames = user.skills.map(s => s.name).join(' • ');
      doc.font('Helvetica').fontSize(10).text(skillNames);
      doc.moveDown(0.5);
    }

    // CERTIFICATIONS
    if (user.certificates && user.certificates.length > 0) {
      doc.font('Helvetica-Bold').fontSize(12).text('CERTIFICATIONS');
      
      user.certificates.forEach((cert, idx) => {
        doc.font('Helvetica').fontSize(10).text(`• ${cert.name}`);
        if (cert.obtainedAt) {
          const obtainedDate = new Date(cert.obtainedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          doc.fontSize(9).fillColor('#666').text(`  Obtained: ${obtainedDate}`);
          doc.fillColor('#000');
        }
      });
      
      doc.moveDown(0.5);
    }

    // PROJECTS
    if (user.projects && user.projects.length > 0) {
      doc.font('Helvetica-Bold').fontSize(12).text('PROJECTS');
      
      user.projects.forEach((proj, idx) => {
        doc.font('Helvetica-Bold').fontSize(10).text(proj.title);
        
        if (proj.technologies && Array.isArray(proj.technologies)) {
          doc.font('Helvetica').fontSize(9).fillColor('#666').text(`Technologies: ${proj.technologies.join(', ')}`);
          doc.fillColor('#000');
        }
        
        if (proj.link) {
          doc.fontSize(9).fillColor('#0073B1').text(proj.link);
          doc.fillColor('#000');
        }
        
        if (idx < user.projects.length - 1) {
          doc.moveDown(0.3);
        }
      });
    }

    // Footer with generation date
    doc.moveDown(1);
    doc.fontSize(8).fillColor('#CCCCCC').text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};