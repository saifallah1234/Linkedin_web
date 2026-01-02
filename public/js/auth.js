// Lightweight auth helper for frontend
(function(window){
  const saveToken = (token) => {
    localStorage.setItem('token', token);
  };

  const getToken = () => localStorage.getItem('token');

  const saveRole = (role) => {
    if (role) localStorage.setItem('role', role);
  };

  const getRole = () => localStorage.getItem('role');

  const login = async (email, password) => {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw data;
    saveToken(data.token);
    saveRole(data.role || data.role);
    return data;
  };

  const signupUser = async (formData) => {
    const res = await fetch('/signup/user', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw data;
    saveToken(data.token);
    saveRole('User');
    return data;
  };

  const signupCompany = async (formData) => {
    const res = await fetch('/signup/company', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw data;
    saveToken(data.token);
    saveRole('Company');
    return data;
  };

  const authFetch = (url, opts = {}) => {
    const headers = opts.headers || {};
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return fetch(url, Object.assign({}, opts, { headers }));
  };

  const protectRoute = async (requiredRole) => {
    const token = getToken();
    const role = getRole();
    if (!token) { window.location.href = '/auth/login'; return; }
    if (requiredRole && role && role.toLowerCase() !== requiredRole.toLowerCase()) {
      window.location.href = '/auth/login'; return;
    }
    // Optionally verify session with server
    try {
      const res = await fetch('/session', { headers: { 'Authorization': 'Bearer ' + token } });
      if (!res.ok) throw new Error('Invalid session');
      return await res.json();
    } catch (err) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      window.location.href = '/auth/login';
    }
  };

  window.auth = { saveToken, getToken, saveRole, getRole, login, signupUser, signupCompany, authFetch, protectRoute };
})(window);
