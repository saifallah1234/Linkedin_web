import api from '../api/axios';

const authService = {
  // --- 1. Registration (With File Upload) ---
  
  // POST /api/auth/signup/user
  registerUser: async (userData) => {
    // Because you are uploading an image, we can't send JSON.
    // We must convert the data to "FormData".
    const formData = new FormData();
    
    // Append simple fields
    formData.append('firstName', userData.firstName);
    formData.append('lastName', userData.lastName);
    formData.append('email', userData.email);
    formData.append('password', userData.password);
    if (userData.location) formData.append('location', userData.location);
    if (userData.dateOfBirth) formData.append('dateOfBirth', userData.dateOfBirth);
    
    // Append the file (if it exists)
    // Make sure your input in React is: <input type="file" name="image" />
    if (userData.imageFile) {
      formData.append('image', userData.imageFile);
    }

    return api.post('/auth/signup/user', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // POST /api/auth/signup/company
  registerCompany: async (companyData) => {
    const formData = new FormData();
    
    formData.append('name', companyData.name);
    formData.append('email', companyData.email);
    formData.append('password', companyData.password);
    if (companyData.location) formData.append('location', companyData.location);
    if (companyData.website) formData.append('website', companyData.website);
    if (companyData.description) formData.append('description', companyData.description);
    
    // Append logo
    if (companyData.logoFile) {
      formData.append('logo', companyData.logoFile);
    }

    return api.post('/auth/signup/company', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // --- 2. Login ---

  // POST /api/auth/login (Unified)
  login: async (email, password) => {
    return api.post('/auth/login', { email, password });
  },

  // Specific logins (Optional, if you still want to use them)
  loginUser: async (email, password) => {
    return api.post('/auth/login/user', { email, password });
  },

  loginCompany: async (email, password) => {
    return api.post('/auth/login/company', { email, password });
  },

  // --- 3. Session & Utility ---

  // GET /api/auth/session
  getSession: async () => {
    return api.get('/auth/session');
  },

  // Helper: Save token to LocalStorage
  saveToken: (token) => {
    localStorage.setItem('token', token);
  },

  // Helper: Remove token (Logout)
  logout: () => {
    localStorage.removeItem('token');
    // Optional: Reload page to reset states
    window.location.href = '/login'; 
  }
};

export default authService;