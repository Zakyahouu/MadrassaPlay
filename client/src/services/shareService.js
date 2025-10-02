import axios from 'axios';

// 3D Model Service configuration for sharing
const MODEL3D_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://72.60.133.119:3001' 
  : 'http://localhost:3001';

// Create axios instance for 3D Model Service sharing
const shareApi = axios.create({
  baseURL: MODEL3D_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add JWT token from existing auth
shareApi.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
shareApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear token and redirect to login
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const shareService = {
  // Generate share link for a model
  generateShareLink: async (modelId) => {
    try {
      const response = await shareApi.post(`/api/shared/generate/${modelId}`);
      return response.data;
    } catch (error) {
      console.error('Error generating share link:', error);
      throw error;
    }
  },

  // Disable share link for a model
  disableShareLink: async (modelId) => {
    try {
      const response = await shareApi.post(`/api/shared/disable/${modelId}`);
      return response.data;
    } catch (error) {
      console.error('Error disabling share link:', error);
      throw error;
    }
  },

  // Get share status for a model
  getShareStatus: async (modelId) => {
    try {
      const response = await shareApi.get(`/api/shared/status/${modelId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting share status:', error);
      throw error;
    }
  },

  // Get all shared models by user
  getUserSharedModels: async (page = 1, limit = 10) => {
    try {
      const response = await shareApi.get(`/api/shared/my-shares?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error getting user shared models:', error);
      throw error;
    }
  },

  // View shared model (public endpoint)
  viewSharedModel: async (authKey) => {
    try {
      const response = await shareApi.get(`/api/shared/view/${authKey}`);
      return response.data;
    } catch (error) {
      console.error('Error viewing shared model:', error);
      throw error;
    }
  }
};

export default shareService;
