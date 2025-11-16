import apiClient from './apiClient';

/**
 * Audit Log Service - Quản lý audit logs
 * Chỉ Admin có quyền gọi các APIs này
 */

const auditLogService = {
  /**
   * Lấy danh sách audit logs với filter và pagination
   * @param {Object} params - Query parameters
   * @param {string} params.action - Filter theo action (optional)
   * @param {string} params.entityType - Filter theo entity type (optional)
   * @param {string} params.fromUtc - Từ ngày (optional)
   * @param {string} params.toUtc - Đến ngày (optional)
   * @param {number} params.pageNumber - Số trang (default: 1)
   * @param {number} params.pageSize - Số items mỗi trang (default: 10)
   */
  async getAuditLogs(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.action) queryParams.append('action', params.action);
      if (params.entityType) queryParams.append('entityType', params.entityType);
      if (params.fromUtc) queryParams.append('fromUtc', params.fromUtc);
      if (params.toUtc) queryParams.append('toUtc', params.toUtc);
      if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber);
      if (params.pageSize) queryParams.append('pageSize', params.pageSize);

      const response = await apiClient.get(`/AuditLog?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error getting audit logs:', error);
      throw error;
    }
  }
};

export default auditLogService;
