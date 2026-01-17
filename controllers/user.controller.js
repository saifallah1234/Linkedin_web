const User = require('../models/User.model');
const mongoose = require('mongoose');
const JobOffer = require('../models/JobOffer.model');
const Company = require('../models/Company.model');
const Connection = require('../models/Connection.model');
const fs = require('fs');

exports.getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const userId= req.user.id;
    const user = await User.findById(userId)
      .select('-password')
      .populate('followingCompanies.companyId', 'name logo location');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    let userId = req.user.id || req.user._id;
    if (userId && typeof userId === 'object' && userId.toString) {
      userId = userId.toString();
    }
    const updates = { ...req.body };
    delete updates.role;
    delete updates._id;
    delete updates.createdAt;
    delete updates.password; 
    if (req.file) {
      updates.image = req.file.path;
      try {
        const oldUser = await User.findById(userId);
        if (oldUser && oldUser.image && fs.existsSync(oldUser.image)) {
           fs.unlinkSync(oldUser.image);
        }
      } catch (err) {
        console.error("Error cleaning up old image:", err);
      }
    }
    ['education', 'projects', 'experiences', 'skills', 'certificates'].forEach(field => {
      if (updates[field] && typeof updates[field] === 'string') {
        try {
          updates[field] = JSON.parse(updates[field]);
        } catch (e) {
          delete updates[field];
        }
      }
    });
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.followCompany = async (req, res) => {
  try {
    const userId = req.user.id;        
    const companyId = req.params.id;  
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    const userAlreadyFollowing = await User.findOne({
      _id: userId,
      'followingCompanies.companyId': companyId
    });

    if (userAlreadyFollowing) {
      return res.status(400).json({ message: 'You are already following this company' });
    }
    await User.findByIdAndUpdate(userId, {
      $push: {
        followingCompanies: {
          companyId: companyId,
          followedAt: new Date()
        }
      }
    });
    await Company.findByIdAndUpdate(companyId, {
      $addToSet: { followers: userId }
    });

    res.json({ message: `You are now following ${company.name}` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.unfollowCompany = async (req, res) => {
  try {
    const userId = req.user.id;     
    const companyId = req.params.id; 
    const user = await User.findByIdAndUpdate(userId, {
      $pull: { 
        followingCompanies: { companyId: companyId } 
      }
    }, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await Company.findByIdAndUpdate(companyId, {
      $pull: { followers: userId }
    });

    res.json({ 
      message: 'Unfollowed company successfully',
      followingCompanies: user.followingCompanies 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFollowingList = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(userId)
    const user = await User.findById(userId)
      .select('followingCompanies')
      .populate('followingCompanies.companyId', 'name logo location website');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.followingCompanies);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
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
exports.getSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit, 10) || 5;
    const user = await User.findById(userId).select('followingCompanies');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const followedCompanyIds = (user.followingCompanies || []).map(f => f.companyId.toString());
    const connections = await Connection.find({
      $or: [ { requesterId: userId }, { receiverId: userId } ],
      status: 'ACCEPTED'
    }).select('requesterId receiverId').lean();

    const connectedUserIds = connections.reduce((acc, c) => {
      const other = c.requesterId.toString() === userId ? c.receiverId.toString() : c.requesterId.toString();
      acc.push(other);
      return acc;
    }, []);
    const companyMatch = followedCompanyIds.length ? { _id: { $nin: followedCompanyIds.map(id => mongoose.Types.ObjectId(id)) } } : {};
    const suggestedCompanies = await Company.aggregate([
      { $match: companyMatch },
      { $sample: { size: Math.min(limit, 20) } },
      { $project: { name: 1, logo: 1, location: 1, description: 1 } }
    ]);
    const excludeUserIds = [ mongoose.Types.ObjectId(userId), ...((connectedUserIds || []).map(id => mongoose.Types.ObjectId(id))) ];
    const suggestedUsers = await User.aggregate([
      { $match: { _id: { $nin: excludeUserIds } } },
      { $sample: { size: Math.min(limit, 20) } },
      { $project: { firstName: 1, lastName: 1, image: 1, location: 1 } }
    ]);
    res.json({
      suggestedCompanies: suggestedCompanies.slice(0, limit),
      suggestedUsers: suggestedUsers.slice(0, limit)
    });

  } catch (error) {
    console.error('getSuggestions error:', error);
    res.status(500).json({ message: error.message });
  }
};
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
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { experiences: { _id: expId } } },
      { new: true }
    );
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
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
    const connections = await Connection.find({
      $or: [{ requesterId: userId }, { receiverId: userId }],
      status: 'ACCEPTED'
    }).select('requesterId receiverId').lean();

    const connectedUserIds = connections.reduce((acc, c) => {
      const other = c.requesterId.toString() === userId ? c.receiverId.toString() : c.requesterId.toString();
      acc.push(other);
      return acc;
    }, []);
    const excludeIds = [...connectedUserIds, userId];
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
exports.getCompanySuggestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit, 10) || 5;
    const user = await User.findById(userId).select('followingCompanies');
    const followedCompanyIds = (user.followingCompanies || []).map(f => f.companyId.toString());
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
exports.getActiveJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const appliedJobs = await JobOffer.find({
      'applicants.userId': userId
    }).select('_id').lean();

    const appliedJobIds = appliedJobs.map(job => job._id);
    const now = new Date();
    const jobs = await JobOffer.find({
      _id: { $nin: appliedJobIds },
      isActive: true,
      deadline: { $gt: now }
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
exports.getExpiringJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit, 10) || 10;

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringJobs = await JobOffer.find({
      isActive: true,
      deadline: {
        $gt: now,
        $lte: sevenDaysFromNow
      }
    })
      .populate('companyId', 'name logo location')
      .sort({ deadline: 1 })
      .limit(limit)
      .lean();

    res.json(expiringJobs);
  } catch (error) {
    console.error('getExpiringJobs error:', error);
    res.status(500).json({ message: error.message });
  }
};
exports.getHiringCompanies = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
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
exports.addProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, link, technologies } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.projects.push({ 
      title, 
      link, 
      technologies: Array.isArray(technologies) ? technologies : (technologies ? JSON.parse(technologies) : []) 
    });
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
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { projects: { _id: projId } } },
      { new: true }
    );
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({ message: 'Project removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
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
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { skills: { _id: skillId } } },
      { new: true }
    );
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({ message: 'Skill removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
exports.addCertificate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, issuer, issueDate, expiryDate, url } = req.body;
    
    if (!name || !issuer) {
      return res.status(400).json({ message: 'Certificate name and issuer are required' });
    }
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.certificates.push({ 
      name, 
      issuer, 
      issueDate,
      expiryDate, 
      url 
    });
    
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
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { certificates: { _id: certId } } },
      { new: true }
    );
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({ message: 'Certificate removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
exports.generateResumePDF = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .select('-password -email')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${user.firstName}_${user.lastName}_Resume.pdf"`);
    doc.pipe(res);
    doc.fontSize(24).font('Helvetica-Bold').text(`${user.firstName} ${user.lastName}`, { align: 'center' });
    
    if (user.headline) {
      doc.fontSize(12).font('Helvetica').text(user.headline, { align: 'center' });
    }
    
    doc.fontSize(10).fillColor('#666').text(`${user.location || ''} | ${user.email || ''} | ${user.phone || ''}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.strokeColor('#CCCCCC').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);
    if (user.about) {
      doc.font('Helvetica-Bold').fontSize(12).text('PROFESSIONAL SUMMARY');
      doc.font('Helvetica').fontSize(10).text(user.about);
      doc.moveDown(0.5);
    }
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

    if (user.skills && user.skills.length > 0) {
      doc.font('Helvetica-Bold').fontSize(12).text('SKILLS');
      const skillNames = user.skills.map(s => s.name).join(' • ');
      doc.font('Helvetica').fontSize(10).text(skillNames);
      doc.moveDown(0.5);
    }

    if (user.certificates && user.certificates.length > 0) {
      doc.font('Helvetica-Bold').fontSize(12).text('CERTIFICATIONS');
      
      user.certificates.forEach((cert, idx) => {
        doc.font('Helvetica').fontSize(10).text(`• ${cert.name}`);
        if (cert.issueDate) {
          const issueDate = new Date(cert.issueDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          doc.fontSize(9).fillColor('#666').text(`  Issued: ${issueDate}`);
          doc.fillColor('#000');
        }
      });
      
      doc.moveDown(0.5);
    }

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
    doc.moveDown(1);
    doc.fontSize(8).fillColor('#CCCCCC').text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};