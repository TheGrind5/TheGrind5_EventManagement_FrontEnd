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

  // Get all events
  getAllEvents: async (page = 1, pageSize = 1000) => {
    return api.get(`/Event?page=${page}&pageSize=${pageSize}`);
  },

  // Get event by ID
  getEventById: async (eventId) => {
    return api.get(`/Event/${eventId}`);
  },

  // Delete event
  deleteEvent: async (eventId) => {
    return api.delete(`/Event/${eventId}`);
  },

  // Admin delete any event
  adminDeleteEvent: async (eventId) => {
    return api.delete(`/Event/${eventId}/admin`);
  },

  // Future admin endpoints can be added here
  // deleteUser, updateUser, etc.
};

export default adminAPI;

