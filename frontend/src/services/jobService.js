import api from '../api/axios';

const jobService = {
  // --- 1. PUBLIC / GENERAL (Search & View) ---

  // GET /api/jobs?location=Paris&type=full-time
  getAllJobs: async (filters = {}) => {
    // Axios 'params' automatically converts an object into a query string
    // e.g., { location: 'Berlin' } becomes /jobs?location=Berlin
    return api.get('/jobs', { params: filters });
  },

  // GET /api/jobs/:id
  getJobById: async (id) => {
    return api.get(`/jobs/${id}`);
  },

  // --- 2. USER ACTIONS (Apply) ---

  // POST /api/jobs/:id/apply
  // Handles Resume + Optional Attachment (Video/Image)
  applyToJob: async (jobId, resumeFile, additionalFile = null) => {
    const formData = new FormData();
    
    // 1. Append Resume (Required)
    formData.append('resume', resumeFile);

    // 2. Append Additional Attachment (Optional)
    if (additionalFile) {
      formData.append('additionalAttachment', additionalFile);
    }

    return api.post(`/jobs/${jobId}/apply`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // --- 3. COMPANY ACTIONS (Manage Jobs) ---

  // POST /api/jobs
  createJob: async (jobData) => {
    return api.post('/jobs', jobData);
  },

  // PUT /api/jobs/:id/close
  closeJob: async (jobId) => {
    return api.put(`/jobs/${jobId}/close`);
  },

  // PUT /api/jobs/:id/applicants/:userId/status
  updateApplicantStatus: async (jobId, userId, status) => {
    // Status should be 'accepted' or 'rejected'
    return api.put(`/jobs/${jobId}/applicants/${userId}/status`, { status });
  },

  // --- 4. COMPANY AI TOOLS ---

  // GET /api/jobs/:id/top-candidates
  getTopCandidates: async (jobId, limit = 10) => {
    return api.get(`/jobs/${jobId}/top-candidates`, { 
      params: { limit } 
    });
  },

  // POST /api/jobs/:id/rescore
  rescoreApplicants: async (jobId) => {
    return api.post(`/jobs/${jobId}/rescore`);
  },

  // GET /api/jobs/:id/statistics
  getJobStatistics: async (jobId) => {
    return api.get(`/jobs/${jobId}/statistics`);
  }
};

export default jobService;