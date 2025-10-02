// client/src/services/model3dService.js
import axios from 'axios';

// 3D Model Service configuration
// In production, always go through Nginx at '/model3d' (HTTPS safe).
// In dev, still point directly to local deep-3d-server.
const MODEL3D_BASE_URL = import.meta.env.PROD
  ? '/model3d'
  : (import.meta.env.VITE_MODEL3D_BASE_URL || 'http://localhost:3001');

// Create axios instance for 3D Model Service
const model3dApi = axios.create({
  baseURL: MODEL3D_BASE_URL,
  timeout: 60000,
});

// Request interceptor to add JWT token from existing auth
model3dApi.interceptors.request.use(
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
model3dApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear token and redirect to login
      localStorage.removeItem('model3d_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Admin API functions
export const adminApi = {
  // Categories
  getCategories: () => model3dApi.get('/admin/categories'),
  createCategory: (data) => model3dApi.post('/admin/categories', data),
  updateCategory: (id, data) => model3dApi.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => model3dApi.delete(`/admin/categories/${id}`),

  // Tags
  getTags: () => model3dApi.get('/admin/tags'),
  createTag: (data) => model3dApi.post('/admin/tags', data),
  updateTag: (id, data) => model3dApi.put(`/admin/tags/${id}`, data),
  deleteTag: (id) => model3dApi.delete(`/admin/tags/${id}`),

  // Models
  getModels: (params = {}) => model3dApi.get('/admin/models', { params }),
  getModel: (id) => model3dApi.get(`/admin/models/${id}`),
  createModel: (formData) => {
    // For file upload, we need to use FormData
    return model3dApi.post('/admin/models', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  updateModel: (id, data) => model3dApi.put(`/admin/models/${id}`, data),
  deleteModel: (id) => model3dApi.delete(`/admin/models/${id}`),
};

// Teacher API functions
export const teacherApi = {
  // Models
  getModels: (params = {}) => model3dApi.get('/api/models', { params }),
  getModel: (id) => model3dApi.get(`/api/models/${id}`),
  createShareLink: (id) => model3dApi.post(`/api/models/${id}/share`),
};

// Helper functions
export const model3dHelpers = {
  // Check if user is authenticated (using existing auth)
  isAuthenticated: () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return !!user.token;
  },
};

export default model3dApi;
