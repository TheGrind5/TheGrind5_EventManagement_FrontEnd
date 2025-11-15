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
  },

  /**
   * Lấy danh sách tất cả orders với filter và pagination
   * @param {Object} params - Query parameters
   * @param {string} params.searchTerm - Tìm kiếm theo tên khách hàng, email, event title (optional)
   * @param {number} params.pageNumber - Số trang (default: 1)
   * @param {number} params.pageSize - Số items mỗi trang (default: 10)
   * @param {string} params.sortBy - Sắp xếp theo field (default: "CreatedAt")
   * @param {string} params.sortOrder - Thứ tự: "asc" hoặc "desc" (default: "desc")
   */
  async getAllOrders(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
      if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber);
      if (params.pageSize) queryParams.append('pageSize', params.pageSize);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await apiClient.get(`/admin/orders?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error getting orders:', error);
      throw error;
    }
  },

  /**
   * Hoàn tiền cho một đơn hàng (chỉ Admin)
   * @param {number} orderId - ID của đơn hàng
   */
  async refundOrder(orderId) {
    try {
      const response = await apiClient.post(`/admin/orders/${orderId}/refund`);
      return response;
    } catch (error) {
      console.error(`Error refunding order ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Gửi thông báo cảnh cáo cho một user (chỉ Admin)
   * @param {number} userId - ID của user
   */
  async warnUser(userId) {
    try {
      const response = await apiClient.post(`/admin/users/${userId}/warn`);
      return response;
    } catch (error) {
      console.error(`Error warning user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Lấy danh sách tất cả events với filter và pagination (bao gồm số lần bị báo cáo)
   * @param {Object} params - Query parameters
   * @param {string} params.searchTerm - Tìm kiếm theo title, host name (optional)
   * @param {string} params.status - Filter theo status (optional)
   * @param {number} params.pageNumber - Số trang (default: 1)
   * @param {number} params.pageSize - Số items mỗi trang (default: 10)
   * @param {string} params.sortBy - Sắp xếp theo field (default: "CreatedAt")
   * @param {string} params.sortOrder - Thứ tự: "asc" hoặc "desc" (default: "desc")
   */
  async getAllEvents(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
      if (params.status) queryParams.append('status', params.status);
      if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber);
      if (params.pageSize) queryParams.append('pageSize', params.pageSize);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await apiClient.get(`/admin/events?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error getting events:', error);
      throw error;
    }
  },

  /**
   * Xóa vĩnh viễn một sự kiện (Admin bypass ownership)
   * @param {number} eventId - ID của sự kiện
   */
  async adminDeleteEvent(eventId) {
    try {
      const response = await apiClient.delete(`/Event/${eventId}/admin`);
      return response;
    } catch (error) {
      console.error(`Error admin delete event ${eventId}:`, error);
      throw error;
    }
  },

  /**
   * Force delete event (permanent, bypass checks)
   */
  async adminForceDeleteEvent(eventId) {
    try {
      const response = await apiClient.delete(`/Event/${eventId}/admin/force`);
      return response;
    } catch (error) {
      console.error(`Error admin force delete event ${eventId}:`, error);
      throw error;
    }
  },

  /**
   * Lấy danh sách sự kiện chờ duyệt (status = Pending)
   * @param {Object} params - Query parameters
   * @param {number} params.pageNumber - Số trang (default: 1)
   * @param {number} params.pageSize - Số items mỗi trang (default: 10)
   */
  async getPendingEvents(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber);
      if (params.pageSize) queryParams.append('pageSize', params.pageSize);

      const response = await apiClient.get(`/admin/pending-events?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error getting pending events:', error);
      throw error;
    }
  },

  /**
   * Duyệt sự kiện (chuyển status từ Pending sang Open)
   * @param {number} eventId - ID của sự kiện
   */
  async approveEvent(eventId) {
    try {
      const response = await apiClient.post(`/admin/events/${eventId}/approve`);
      return response;
    } catch (error) {
      console.error(`Error approving event ${eventId}:`, error);
      throw error;
    }
  },

  /**
   * Từ chối duyệt sự kiện (chuyển status từ Pending sang Cancelled và gửi thông báo)
   * @param {number} eventId - ID của sự kiện
   */
  async rejectEvent(eventId) {
    try {
      const response = await apiClient.post(`/admin/events/${eventId}/reject`);
      return response;
    } catch (error) {
      console.error(`Error rejecting event ${eventId}:`, error);
      throw error;
    }
  },

  /**
   * Lấy thống kê số sự kiện theo năm
   * @param {number} year - Năm cần thống kê (0 = năm hiện tại)
   */
  async getEventStatistics(year = 0) {
    try {
      const response = await apiClient.get(`/admin/event-statistics?year=${year}`);
      return response;
    } catch (error) {
      console.error(`Error getting event statistics for year ${year}:`, error);
      throw error;
    }
  }
};

export default adminService;

