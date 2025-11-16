// Ticket Transfer Service - Quản lý chuyển nhượng vé
import apiClient from './apiClient';

export class TicketTransferService {
  // ==================== TICKET TRANSFER OPERATIONS ====================
  
  /**
   * Initiate a ticket transfer
   * @param {Object} data - Transfer data
   * @param {number} data.ticketId - Ticket ID to transfer
   * @param {string} data.toEmail - Recipient email
   * @param {string} data.message - Optional message
   * @param {number} data.transferFee - Optional transfer fee
   * @returns {Promise<Object>}
   */
  static async initiateTransfer(data) {
    try {
      const response = await apiClient.post('/tickettransfer/initiate', data);
      return response.data;
    } catch (error) {
      console.error('Error initiating transfer:', error);
      throw error;
    }
  }

  /**
   * Get transfer details by transfer code (no auth required)
   * @param {string} transferCode 
   * @returns {Promise<Object>}
   */
  static async getTransferDetails(transferCode) {
    try {
      const response = await apiClient.get(`/tickettransfer/details/${transferCode}`);
      return response.data;
    } catch (error) {
      console.error('Error getting transfer details:', error);
      throw error;
    }
  }

  /**
   * Accept a ticket transfer
   * @param {string} transferCode 
   * @returns {Promise<Object>}
   */
  static async acceptTransfer(transferCode) {
    try {
      const response = await apiClient.post('/tickettransfer/accept', { transferCode });
      return response.data;
    } catch (error) {
      console.error('Error accepting transfer:', error);
      throw error;
    }
  }

  /**
   * Reject a ticket transfer
   * @param {string} transferCode 
   * @param {string} rejectionReason - Optional reason for rejection
   * @returns {Promise<Object>}
   */
  static async rejectTransfer(transferCode, rejectionReason = null) {
    try {
      const response = await apiClient.post('/tickettransfer/reject', {
        transferCode,
        rejectionReason
      });
      return response.data;
    } catch (error) {
      console.error('Error rejecting transfer:', error);
      throw error;
    }
  }

  /**
   * Cancel a pending transfer (by sender)
   * @param {number} transferId 
   * @returns {Promise<Object>}
   */
  static async cancelTransfer(transferId) {
    try {
      const response = await apiClient.delete(`/tickettransfer/cancel/${transferId}`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling transfer:', error);
      throw error;
    }
  }

  /**
   * Get transfer history for a specific ticket
   * @param {number} ticketId 
   * @returns {Promise<Object>}
   */
  static async getTicketTransferHistory(ticketId) {
    try {
      const response = await apiClient.get(`/tickettransfer/history/ticket/${ticketId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting ticket transfer history:', error);
      throw error;
    }
  }

  /**
   * Get all transfers for current user (sent and received)
   * @returns {Promise<Object>}
   */
  static async getMyTransfers() {
    try {
      const response = await apiClient.get('/tickettransfer/my-transfers');
      return response.data;
    } catch (error) {
      console.error('Error getting my transfers:', error);
      throw error;
    }
  }

  /**
   * Check if a ticket can be transferred
   * @param {number} ticketId 
   * @returns {Promise<{canTransfer: boolean, message: string}>}
   */
  static async canTransferTicket(ticketId) {
    try {
      const response = await apiClient.get(`/tickettransfer/can-transfer/${ticketId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking transfer eligibility:', error);
      throw error;
    }
  }

  // ==================== VALIDATION ====================

  /**
   * Validate transfer request data
   * @param {Object} data 
   * @returns {Object} - {isValid: boolean, errors: Array}
   */
  static validateTransferRequest(data) {
    const errors = [];

    if (!data.ticketId) {
      errors.push('Ticket ID là bắt buộc');
    }

    if (!data.toEmail || data.toEmail.trim() === '') {
      errors.push('Email người nhận là bắt buộc');
    } else if (!this.isValidEmail(data.toEmail)) {
      errors.push('Email không hợp lệ');
    }

    if (data.message && data.message.length > 500) {
      errors.push('Tin nhắn không được vượt quá 500 ký tự');
    }

    if (data.transferFee && (isNaN(data.transferFee) || data.transferFee < 0)) {
      errors.push('Phí chuyển nhượng không hợp lệ');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate email format
   * @param {string} email 
   * @returns {boolean}
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // ==================== UTILITY ====================

  /**
   * Format transfer status to Vietnamese
   * @param {string} status 
   * @returns {string}
   */
  static formatStatus(status) {
    const statusMap = {
      'Pending': 'Đang chờ',
      'Accepted': 'Đã chấp nhận',
      'Rejected': 'Đã từ chối',
      'Cancelled': 'Đã hủy',
      'Expired': 'Đã hết hạn'
    };
    return statusMap[status] || status;
  }

  /**
   * Get status badge color
   * @param {string} status 
   * @returns {string}
   */
  static getStatusColor(status) {
    const colorMap = {
      'Pending': 'warning',
      'Accepted': 'success',
      'Rejected': 'danger',
      'Cancelled': 'secondary',
      'Expired': 'dark'
    };
    return colorMap[status] || 'secondary';
  }

  /**
   * Get status icon
   * @param {string} status 
   * @returns {string}
   */
  static getStatusIcon(status) {
    const iconMap = {
      'Pending': 'clock',
      'Accepted': 'check-circle',
      'Rejected': 'x-circle',
      'Cancelled': 'slash-circle',
      'Expired': 'calendar-x'
    };
    return iconMap[status] || 'question-circle';
  }

  /**
   * Check if transfer is expired
   * @param {string} expiresAt - ISO date string
   * @returns {boolean}
   */
  static isExpired(expiresAt) {
    return new Date(expiresAt) < new Date();
  }

  /**
   * Format time remaining until expiration
   * @param {string} expiresAt - ISO date string
   * @returns {string}
   */
  static formatTimeRemaining(expiresAt) {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;

    if (diff < 0) {
      return 'Đã hết hạn';
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `Còn ${days} ngày`;
    } else if (hours > 0) {
      return `Còn ${hours} giờ ${minutes} phút`;
    } else {
      return `Còn ${minutes} phút`;
    }
  }

  /**
   * Format date to Vietnamese locale
   * @param {string} dateString - ISO date string
   * @returns {string}
   */
  static formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get transfer action text for user
   * @param {string} status 
   * @param {boolean} isSender 
   * @returns {string}
   */
  static getActionText(status, isSender) {
    if (status === 'Pending') {
      return isSender ? 'Đang chờ người nhận xác nhận' : 'Chờ bạn xác nhận';
    } else if (status === 'Accepted') {
      return 'Đã chuyển nhượng thành công';
    } else if (status === 'Rejected') {
      return 'Đã từ chối';
    } else if (status === 'Cancelled') {
      return isSender ? 'Bạn đã hủy' : 'Người gửi đã hủy';
    } else if (status === 'Expired') {
      return 'Đã hết hạn';
    }
    return status;
  }

  /**
   * Check if transfer can be cancelled
   * @param {Object} transfer 
   * @param {number} currentUserId 
   * @returns {boolean}
   */
  static canCancel(transfer, currentUserId) {
    return transfer.transferStatus === 'Pending' && 
           transfer.fromUserId === currentUserId &&
           !this.isExpired(transfer.expiresAt);
  }

  /**
   * Check if transfer can be accepted/rejected
   * @param {Object} transfer 
   * @param {string} currentUserEmail 
   * @returns {boolean}
   */
  static canRespond(transfer, currentUserEmail) {
    return transfer.transferStatus === 'Pending' &&
           transfer.toEmail.toLowerCase() === currentUserEmail.toLowerCase() &&
           !this.isExpired(transfer.expiresAt);
  }
}

export default TicketTransferService;
