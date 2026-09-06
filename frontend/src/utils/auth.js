// Authentication utilities

const TOKEN_KEY = 'finedge_auth_token';
const USER_KEY = 'finedge_user';

export const authUtils = {
  // Save auth data to localStorage
  saveAuth(token, user) {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, String(token));
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
      if (user && typeof user === 'object') {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify({ role: String(user), name: String(user) }));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch (e) {
      console.warn('Error saving auth to localStorage:', e);
    }
  },

  // Get token from localStorage
  getToken() {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
        return null;
      }
      return token;
    } catch (e) {
      return null;
    }
  },

  // Get user from localStorage safely
  getUser() {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      if (!userStr || userStr === 'undefined' || userStr === 'null' || userStr.trim() === '') {
        return null;
      }
      try {
        const parsed = JSON.parse(userStr);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
        if (typeof parsed === 'string') {
          return { role: parsed, name: parsed };
        }
        return null;
      } catch {
        // userStr was not valid JSON, treat as raw role/name string like "admin"
        return { role: userStr, name: userStr };
      }
    } catch (e) {
      console.warn('Error retrieving user from localStorage:', e);
      try { localStorage.removeItem(USER_KEY); } catch (_) {}
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    return !!token;
  },

  // Clear auth data (logout)
  clearAuth() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (_) {}
  },

  // Get authorization header
  getAuthHeader() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
};

// Axios interceptor helper
export const setupAuthInterceptor = (axiosInstance) => {
  // Request interceptor - add auth token
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = authUtils.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handle auth errors
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        authUtils.clearAuth();
<<<<<<< Updated upstream
        window.location.href = '/login';
=======
>>>>>>> Stashed changes
      }
      return Promise.reject(error);
    }
  );
};
