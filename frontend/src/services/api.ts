import axios from 'axios';

const API_URL = 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
};

export const userAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: { username?: string; displayColor?: string }) =>
    api.put('/users/me', data),
  getAllUsers: () => api.get('/users'),
};

export const chatAPI = {
  getRooms: () => api.get('/chat/rooms'),
  getGeneralRoom: () => api.get('/chat/general'),
  joinGeneralRoom: () => api.post('/chat/general/join'),
  createRoom: (data: { name: string; memberIds: string[]; hasHistoryAccess?: boolean }) =>
    api.post('/chat/rooms', data),
  getRoomMessages: (roomId: string) => api.get(`/chat/rooms/${roomId}/messages`),
  addMembersToRoom: (roomId: string, data: { memberIds: string[]; hasHistoryAccess?: boolean }) =>
    api.post(`/chat/rooms/${roomId}/members`, data),
};

export default api;
