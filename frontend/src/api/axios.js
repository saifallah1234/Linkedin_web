import axios from 'axios';

// 1. Create the Axios Instance
// Make sure the port matches your backend (you used 8081 in your logs earlier)
const api = axios.create({
  baseURL: 'http://localhost:8081/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. REQUEST INTERCEPTOR (The "Key" Injector)
// Before any request is sent, this code runs automatically.
api.interceptors.request.use(
  (config) => {
    // Check if we have a token saved in LocalStorage
    const token = localStorage.getItem('token');
    
    // If token exists, attach it to the headers
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. RESPONSE INTERCEPTOR (The "Bouncer")
// This watches every response coming back from the backend.
api.interceptors.response.use(
  (response) => {
    // If the response is good (200, 201), just return the data
    return response;
  },
  (error) => {
    // If the error is 401 (Unauthorized), it means the Token is invalid or expired
    if (error.response && error.response.status === 401) {
      // Optional: Auto-logout the user
      // localStorage.removeItem('token');
      // window.location.href = '/login'; 
      console.error("Session expired or invalid token.");
    }
    return Promise.reject(error);
  }
);

export default api;