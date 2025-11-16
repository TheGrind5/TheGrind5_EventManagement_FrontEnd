import apiClient from './apiClient';

/**
 * Refund Service
 * Handles customer refund requests and admin refund management
 */

const refundService = {
  /**
   * Customer creates a refund request for an order
   * @param {Object} refundData - { orderId, reason, refundAmount? }
   * @returns {Promise}
   */
  createRefundRequest: async (refundData) => {
    try {
      const response = await apiClient.post('/refund', refundData);
      return response;
    } catch (error) {
      console.error('Error creating refund request:', error);
      throw error;
    }
  },

  /**
   * Get customer's own refund requests
   * @returns {Promise}
   */
  getMyRefundRequests: async () => {
    try {
      const response = await apiClient.get('/refund/my-requests');
      return response;
    } catch (error) {
      console.error('Error fetching refund requests:', error);
      throw error;
    }
  },

  /**
   * Get refund request details
   * @param {number} refundRequestId
   * @returns {Promise}
   */
  getRefundRequestById: async (refundRequestId) => {
    try {
      const response = await apiClient.get(`/refund/${refundRequestId}`);
      return response;
    } catch (error) {
      console.error('Error fetching refund request details:', error);
      throw error;
    }
  },

  /**
   * Cancel refund request (customer only, if pending)
   * @param {number} refundRequestId
   * @returns {Promise}
   */
  cancelRefundRequest: async (refundRequestId) => {
    try {
      const response = await apiClient.post(`/refund/${refundRequestId}/cancel`);
      return response;
    } catch (error) {
      console.error('Error cancelling refund request:', error);
      throw error;
    }
  },

  /**
   * Check if customer can request refund for an order
   * @param {number} orderId
   * @returns {Promise}
   */
  canRequestRefund: async (orderId) => {
    try {
      const response = await apiClient.get(`/refund/can-refund/${orderId}`);
      return response;
    } catch (error) {
      console.error('Error checking refund eligibility:', error);
      throw error;
    }
  },

  // ============================================
  // ADMIN APIs
  // ============================================

  /**
   * Get all refund requests (Admin only)
   * @param {Object} params - { status?, page?, pageSize? }
   * @returns {Promise}
   */
  getAllRefundRequests: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.page) queryParams.append('page', params.page);
      if (params.pageSize) queryParams.append('pageSize', params.pageSize);

      const response = await apiClient.get(`/refund/admin/all?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching all refund requests:', error);
      throw error;
    }
  },

  /**
   * Admin reviews refund request (approve/reject)
   * @param {number} refundRequestId
   * @param {Object} reviewData - { action: "Approve"|"Reject", adminResponse? }
   * @returns {Promise}
   */
  reviewRefundRequest: async (refundRequestId, reviewData) => {
    try {
      const response = await apiClient.post(`/refund/${refundRequestId}/review`, reviewData);
      return response;
    } catch (error) {
      console.error('Error reviewing refund request:', error);
      throw error;
    }
  },

  /**
   * Get refund statistics (Admin only)
   * @returns {Promise}
   */
  getRefundStatistics: async () => {
    try {
      const response = await apiClient.get('/refund/admin/statistics');
      return response;
    } catch (error) {
      console.error('Error fetching refund statistics:', error);
      throw error;
    }
  }
};

export default refundService;
