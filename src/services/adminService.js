import apiClient from './apiClient';

/**
 * Admin Service - Quản lý người dùng
 * Chỉ Admin có quyền gọi các APIs này
 */

const adminService = {
  /**
   * Lấy danh sách tất cả users với filter và pagination
   * @param {Object} params - Query parameters
   * @param {string} params.role - Filter theo role: "Host", "Customer", "Admin" (optional)
   * @param {string} params.searchTerm - Tìm kiếm theo username, email, fullname (optional)
   * @param {number} params.pageNumber - Số trang (default: 1)
   * @param {number} params.pageSize - Số items mỗi trang (default: 10)
   * @param {string} params.sortBy - Sắp xếp theo field (default: "CreatedAt")
   * @param {string} params.sortOrder - Thứ tự: "asc" hoặc "desc" (default: "desc")
   */
  async getAllUsers(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.role) queryParams.append('role', params.role);
      if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
      if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber);
      if (params.pageSize) queryParams.append('pageSize', params.pageSize);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await apiClient.get(`/admin/users?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  },

  /**
   * Lấy thông tin chi tiết của một user
   * @param {number} userId - ID của user
   */
  async getUserById(userId) {
    try {
      const response = await apiClient.get(`/admin/users/${userId}`);
      return response;
    } catch (error) {
      console.error(`Error getting user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Lấy thống kê tổng quan về users
   */
  async getStatistics() {
    try {
      const response = await apiClient.get('/admin/statistics');
      return response;
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách Hosts
   * @param {Object} params - Query parameters
   */
  async getHosts(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
      if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber);
      if (params.pageSize) queryParams.append('pageSize', params.pageSize);

      const response = await apiClient.get(`/admin/hosts?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error getting hosts:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách Customers
   * @param {Object} params - Query parameters
   */
  async getCustomers(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
      if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber);
      if (params.pageSize) queryParams.append('pageSize', params.pageSize);

      const response = await apiClient.get(`/admin/customers?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error getting customers:', error);
      throw error;
    }
  }
};

export default adminService;

