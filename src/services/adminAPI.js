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

  // Future admin endpoints can be added here
  // deleteUser, updateUser, etc.
};

export default adminAPI;

