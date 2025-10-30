// Admin API Service
import { api } from './apiClient';

export const adminAPI = {
  // Get all users
  getAllUsers: async () => {
    return api.get('/Auth/users');
  },

  // Get user by ID
  getUserById: async (userId) => {
    return api.get(`/Auth/user/${userId}`);
  },

  // Ban user
  banUser: async (userId, reason) => {
    return api.post(`/Auth/users/${userId}/ban`, { reason });
  },

  // Unban user
  unbanUser: async (userId) => {
    return api.post(`/Auth/users/${userId}/unban`);
  },

  // Future admin endpoints can be added here
  // deleteUser, updateUser, etc.
};

export default adminAPI;

