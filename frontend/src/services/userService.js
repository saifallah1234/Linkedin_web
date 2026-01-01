import api from '../api/axios';

const userService = {
  // ============================================================
  // 1. PROFILE & BASICS
  // ============================================================

  // --- Get My Profile ---
  getProfile: async () => {
    return api.get('/users/profile');
  },

  // --- Get Public Profile (View Other User) ---
  getPublicProfile: async (userId) => {
    return api.get(`/users/profile/${userId}`);
  },

  // --- Update Profile (Handles Text + Image) ---
  updateProfile: async (userId, data, imageFile = null) => {
    const formData = new FormData();

    // 1. Append Image if it exists
    if (imageFile) {
      formData.append('image', imageFile);
    }

    // 2. Append other fields
    // Backend manually parses JSON strings for arrays/objects
    Object.keys(data).forEach((key) => {
      const value = data[key];
      if (Array.isArray(value) || typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });

    return api.put(`/users/profile/${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // ============================================================
  // 2. FOLLOWING COMPANIES
  // ============================================================

  followCompany: async (companyId) => {
    return api.post(`/users/follow/${companyId}`);
  },

  unfollowCompany: async (companyId) => {
    return api.post(`/users/unfollow/${companyId}`);
  },

  getFollowingCompanies: async () => {
    return api.get('/users/following');
  },

  // ============================================================
  // 3. SMART SUGGESTIONS
  // ============================================================

  getUserSuggestions: async (limit = 5) => {
    return api.get('/users/suggestions/users', { params: { limit } });
  },

  getCompanySuggestions: async (limit = 5) => {
    return api.get('/users/suggestions/companies', { params: { limit } });
  },

  // ============================================================
  // 4. JOB BOARD (User View)
  // ============================================================

  getActiveJobs: async (page = 1, limit = 10) => {
    return api.get('/users/jobs/active', { params: { page, limit } });
  },

  getExpiringJobs: async (limit = 10) => {
    return api.get('/users/jobs/expiring', { params: { limit } });
  },

  getHiringCompanies: async (limit = 10) => {
    return api.get('/users/companies/hiring', { params: { limit } });
  },

  // ============================================================
  // 5. EXPERIENCE CRUD
  // ============================================================

  addExperience: async (data) => {
    return api.post('/users/experiences', data);
  },

  updateExperience: async (id, data) => {
    return api.put(`/users/experiences/${id}`, data);
  },

  deleteExperience: async (id) => {
    return api.delete(`/users/experiences/${id}`);
  },

  // ============================================================
  // 6. PROJECTS CRUD
  // ============================================================

  addProject: async (data) => {
    // data example: { title: "App", link: "http...", technologies: ["React", "Node"] }
    return api.post('/users/projects', data);
  },

  updateProject: async (id, data) => {
    return api.put(`/users/projects/${id}`, data);
  },

  deleteProject: async (id) => {
    return api.delete(`/users/projects/${id}`);
  },

  // ============================================================
  // 7. SKILLS CRUD
  // ============================================================

  addSkill: async (name) => {
    return api.post('/users/skills', { name });
  },

  updateSkill: async (id, name) => {
    return api.put(`/users/skills/${id}`, { name });
  },

  deleteSkill: async (id) => {
    return api.delete(`/users/skills/${id}`);
  },

  // ============================================================
  // 8. CERTIFICATES CRUD
  // ============================================================

  addCertificate: async (data) => {
    // data: { name: "AWS Certified", obtainedAt: "2023-01-01" }
    return api.post('/users/certificates', data);
  },

  updateCertificate: async (id, data) => {
    return api.put(`/users/certificates/${id}`, data);
  },

  deleteCertificate: async (id) => {
    return api.delete(`/users/certificates/${id}`);
  },

  // ============================================================
  // 9. RESUME PDF GENERATION
  // ============================================================

  downloadResume: async () => {
    // We must specify responseType: 'blob' to handle binary file data
    return api.get('/users/resume/download', {
      responseType: 'blob' 
    });
  }
};

export default userService;