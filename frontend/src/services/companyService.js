import api from '../api/axios';

const companyService = {
  // --- Profile Management ---

  // GET /api/companies/profile
  // Gets the currently logged-in company's profile
  getProfile: async () => {
    return api.get('/companies/profile');
  },

  // PUT /api/companies/profile/:id
  // Updates profile (handles Logo upload + Text data)
  updateProfile: async (id, companyData) => {
    const formData = new FormData();
    
    // Append text fields if they exist
    if (companyData.name) formData.append('name', companyData.name);
    if (companyData.location) formData.append('location', companyData.location);
    if (companyData.website) formData.append('website', companyData.website);
    if (companyData.description) formData.append('description', companyData.description);
    
    // Append the file if a new one was selected
    if (companyData.logoFile) {
      formData.append('logo', companyData.logoFile);
    }

    // We must use Multipart form data for file uploads
    return api.put(`/companies/profile/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // --- Dashboard & Analytics ---

  // GET /api/companies/engagements/week
  // Returns stats: weekEngagements, totalApplicants, totalJobs, and recent applicants
  getDashboardStats: async () => {
    return api.get('/companies/engagements/week');
  },

  // --- Job Management ---

  // GET /api/companies/jobs
  // Returns all jobs posted by this company
  getMyJobs: async () => {
    return api.get('/companies/jobs');
  },

  // GET /api/companies/jobs/:id/applicants
  // Returns list of users who applied to a specific job
  getJobApplicants: async (jobId) => {
    return api.get(`/companies/jobs/${jobId}/applicants`);
  },

  // DELETE /api/companies/jobs/:id
  deleteJob: async (jobId) => {
    return api.delete(`/companies/jobs/${jobId}`);
  }
};

export default companyService;