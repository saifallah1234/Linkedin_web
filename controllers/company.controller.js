const Company = require('../models/Company.model');
const JobOffer = require('../models/JobOffer.model');
const mongoose = require('mongoose');
const fs = require('fs');
exports.getCompanyProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Company ID format' });
    }

    const company = await Company.findById(id)
      .select('-password')
      .populate('followers', 'firstName lastName image headline');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json(company);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find()
      .select('-password')
      .sort({ name: 1 }); 
    res.json(companies);

  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCompanyProfile = async (req, res) => {
  try {
    const id = req.user.id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Company ID format' });
    }

    const company = await Company.findById(id)
      .select('-password')
      .populate('followers', 'firstName lastName image headline');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json(company);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    if (req.user.id.toString() !== company._id.toString() && req.user.id.toString() !== company.ownerId?.toString()) {
      return res.status(403).json({ message: 'You can only update your own company profile' });
    }

    const updates = { ...req.body };

    delete updates.password;
    delete updates.followers;
    delete updates._id;
    delete updates.createdAt;

    if (req.file) {
      updates.logo = req.file.path;
      
      const oldCompany = await Company.findById(id);
      if (oldCompany.logo && fs.existsSync(oldCompany.logo)) {
        fs.unlinkSync(oldCompany.logo);
      }
    }

    const updatedCompany = await Company.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
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

exports.getWeekEngagementsAndApplicants = async (req, res) => {
  try {
    const companyId = req.user.id;

    const jobs = await JobOffer.find({ companyId, isActive: true })
      .select('title applicants createdAt deadline')
      .lean();

    if (!jobs || jobs.length === 0) {
      return res.json({
        weekEngagements: 0,
        totalApplicants: 0,
        totalJobs: 0,
        applicants: [],
        jobs: []
      });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let weekEngagements = 0;
    let allApplicants = [];

    jobs.forEach(job => {
      if (job.applicants && Array.isArray(job.applicants)) {
        job.applicants.forEach(applicant => {
          allApplicants.push({
            ...applicant,
            jobTitle: job.title,
            jobId: job._id,
            jobDeadline: job.deadline
          });

          if (new Date(applicant.appliedAt) >= sevenDaysAgo) {
            weekEngagements++;
          }
        });
      }
    });

    const User = require('../models/User.model');
    const applicantsWithDetails = await Promise.all(
      allApplicants.map(async (applicant) => {
        const user = await User.findById(applicant.userId)
          .select('firstName lastName image headline location')
          .lean();
        return {
          ...applicant,
          userDetails: user
        };
      })
    );

    applicantsWithDetails.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

    res.json({
      weekEngagements,
      totalApplicants: allApplicants.length,
      totalJobs: jobs.length,
      applicants: applicantsWithDetails,
      jobs: jobs.map(j => ({
        _id: j._id,
        title: j.title,
        applicantCount: j.applicants?.length || 0,
        createdAt: j.createdAt,
        deadline: j.deadline
      }))
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getMyJobs = async (req, res) => {
  try {
    const companyId = req.user.id;
    const jobs = await JobOffer.find({ companyId })
      .sort({ createdAt: -1 })
      .lean();
    
    const jobsWithDetails = jobs.map(job => ({
      ...job,
      applicantCount: job.applicants ? job.applicants.length : 0
    }));

    res.json(jobsWithDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getJobApplicants = async (req, res) => {
  try {
    const companyId = req.user.id;
    const jobId = req.params.id;

    const job = await JobOffer.findOne({ _id: jobId, companyId });
    if (!job) return res.status(404).json({ message: 'Job not found or access denied' });

    const User = require('../models/User.model');
    const applicantsWithDetails = await Promise.all(
      (job.applicants || []).map(async (applicant) => {
        const user = await User.findById(applicant.userId)
          .select('firstName lastName image location headline email phone experiences skills')
          .lean();
        return {
          ...applicant.toObject(),
          userDetails: user
        };
      })
    );

    res.json({
      jobId: job._id,
      title: job.title,
      totalApplicants: applicantsWithDetails.length,
      applicants: applicantsWithDetails
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const companyId = req.user.id;
    const jobId = req.params.id;

    const job = await JobOffer.findOneAndDelete({
      _id: jobId,
      companyId: companyId
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found or you do not have permission to delete it' });
    }

    res.status(200).json({ message: 'Job deleted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
