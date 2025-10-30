import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for image generation
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API Service functions
export const apiService = {
  // Health check
  health: () => api.get('/health'),

  // Script operations
  uploadScript: (formData) => {
    return api.post('/upload-script', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getProjects: () => api.get('/scripts'),
  getProject: (id) => api.get(`/scripts/${id}`),
  updateProject: (id, data) => api.put(`/scripts/${id}`, data),
  deleteProject: (id) => api.delete(`/scripts/${id}`),
  getProjectScenes: (id) => api.get(`/scripts/${id}/scenes`),
  updateSceneEmotion: (projectId, sceneId, data) => 
    api.put(`/scripts/${projectId}/scenes/${sceneId}/emotion`, data),

  // Storyboard operations
  generateStoryboard: (projectId, imageStyle = 'realistic') => 
    api.post(`/generate-storyboard/${projectId}`, { imageStyle }),
  getStoryboardFrames: (projectId) => api.get(`/storyboards/project/${projectId}`),
  regenerateFrame: (frameId, customPrompt, imageStyle = 'realistic') => 
    api.post(`/storyboards/frame/${frameId}/regenerate`, { customPrompt, imageStyle }),
  regenerateFrameWithPrompt: (frameId, prompt, imageStyle = 'realistic') => 
    api.post(`/storyboards/frame/${frameId}/regenerate-with-prompt`, { prompt, imageStyle }),
  updateFrameOrder: (frameId, newOrder) => 
    api.put(`/storyboards/frame/${frameId}/order`, { newOrder }),
  deleteFrame: (frameId) => api.delete(`/storyboards/frame/${frameId}`),
  reorderFrames: (frameOrders) => 
    api.put('/storyboards/frames/reorder', { frameOrders }),
  getStoryboardAnalytics: (projectId) => 
    api.get(`/storyboards/project/${projectId}/analytics`),
  exportStoryboardPDF: (projectId) => 
    api.get(`/storyboards/project/${projectId}/export/pdf`, { responseType: 'blob' }),

  // Image style operations
  getImageStyles: () => api.get('/image-styles'),
};

export default api;