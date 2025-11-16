// Wallet Service - Quản lý ví và rút tiền
import apiClient from './apiClient';

export class WalletService {
  // ==================== WALLET BALANCE ====================
  
  /**
   * Get wallet balance
   * @returns {Promise<{balance: number, currency: string}>}
   */
  static async getBalance() {
    try {
      const response = await apiClient.get('/wallet/balance');
      return response.data;
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      throw error;
    }
  }

  /**
   * Check if user has sufficient balance
   * @param {number} amount 
   * @returns {Promise<{hasSufficientBalance: boolean, currentBalance: number}>}
   */
  static async checkBalance(amount) {
    try {
      const response = await apiClient.get(`/wallet/check-balance?amount=${amount}`);
      return response.data;
    } catch (error) {
      console.error('Error checking balance:', error);
      throw error;
    }
  }

  // ==================== WITHDRAWAL REQUESTS ====================

  /**
   * Create withdrawal request
   * @param {Object} data - Withdrawal data
   * @param {number} data.amount - Amount to withdraw
   * @param {string} data.bankName - Bank name
   * @param {string} data.bankAccountNumber - Account number
   * @param {string} data.bankAccountName - Account holder name
   * @param {string} data.bankCode - Bank code
   * @returns {Promise<Object>}
   */
  static async createWithdrawalRequest(data) {
    try {
      const response = await apiClient.post('/wallet/withdrawal/request', data);
      return response.data;
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      throw error;
    }
  }

  /**
   * Get user's withdrawal requests
   * @param {number} page - Page number
   * @param {number} pageSize - Page size
   * @returns {Promise<Array>}
   */
  static async getWithdrawalRequests(page = 1, pageSize = 10) {
    try {
      const response = await apiClient.get(`/wallet/withdrawal/requests?page=${page}&pageSize=${pageSize}`);
      return response.data;
    } catch (error) {
      console.error('Error getting withdrawal requests:', error);
      throw error;
    }
  }

  /**
   * Get withdrawal request by ID
   * @param {number} requestId 
   * @returns {Promise<Object>}
   */
  static async getWithdrawalRequest(requestId) {
    try {
      const response = await apiClient.get(`/wallet/withdrawal/requests/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting withdrawal request:', error);
      throw error;
    }
  }

  /**
   * Cancel withdrawal request
   * @param {number} requestId 
   * @returns {Promise<Object>}
   */
  static async cancelWithdrawalRequest(requestId) {
    try {
      const response = await apiClient.delete(`/wallet/withdrawal/requests/${requestId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling withdrawal request:', error);
      throw error;
    }
  }

  /**
   * Get wallet transactions history
   * @param {number} page 
   * @param {number} pageSize 
   * @returns {Promise<Array>}
   */
  static async getTransactions(page = 1, pageSize = 10) {
    try {
      const response = await apiClient.get(`/wallet/transactions?page=${page}&pageSize=${pageSize}`);
      return response.data;
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
  }

  // ==================== VALIDATION ====================

  /**
   * Validate withdrawal amount
   * @param {number} amount 
   * @param {number} currentBalance 
   * @returns {Object} - {isValid: boolean, errors: Array}
   */
  static validateWithdrawalAmount(amount, currentBalance) {
    const errors = [];
    const MIN_WITHDRAWAL = 50000;

    if (!amount || amount <= 0) {
      errors.push('Số tiền phải lớn hơn 0');
    }

    if (amount < MIN_WITHDRAWAL) {
      errors.push(`Số tiền rút tối thiểu là ${MIN_WITHDRAWAL.toLocaleString('vi-VN')} VND`);
    }

    if (amount > currentBalance) {
      errors.push('Số dư không đủ');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate bank account info
   * @param {Object} bankInfo 
   * @returns {Object} - {isValid: boolean, errors: Array}
   */
  static validateBankInfo(bankInfo) {
    const errors = [];

    if (!bankInfo.bankName || bankInfo.bankName.trim() === '') {
      errors.push('Tên ngân hàng là bắt buộc');
    }

    if (!bankInfo.bankAccountNumber || bankInfo.bankAccountNumber.trim() === '') {
      errors.push('Số tài khoản là bắt buộc');
    }

    if (!bankInfo.bankAccountName || bankInfo.bankAccountName.trim() === '') {
      errors.push('Tên chủ tài khoản là bắt buộc');
    }

    if (!bankInfo.bankCode || bankInfo.bankCode.trim() === '') {
      errors.push('Mã ngân hàng là bắt buộc');
    }

    // Validate account number format (numbers only)
    if (bankInfo.bankAccountNumber && !/^\d+$/.test(bankInfo.bankAccountNumber)) {
      errors.push('Số tài khoản chỉ được chứa chữ số');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // ==================== UTILITY ====================

  /**
   * Format withdrawal status to Vietnamese
   * @param {string} status 
   * @returns {string}
   */
  static formatStatus(status) {
    const statusMap = {
      'Pending': 'Đang chờ',
      'Approved': 'Đã duyệt',
      'Rejected': 'Đã từ chối',
      'Completed': 'Hoàn thành',
      'Cancelled': 'Đã hủy'
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
      'Approved': 'info',
      'Rejected': 'danger',
      'Completed': 'success',
      'Cancelled': 'secondary'
    };
    return colorMap[status] || 'secondary';
  }

  /**
   * Get common Vietnamese banks
   * @returns {Array}
   */
  static getVietnameseBanks() {
    return [
      { code: '970407', name: 'Techcombank - Ngân hàng TMCP Kỹ thương Việt Nam' },
      { code: '970415', name: 'Vietinbank - Ngân hàng TMCP Công thương Việt Nam' },
      { code: '970436', name: 'Vietcombank - Ngân hàng TMCP Ngoại thương Việt Nam' },
      { code: '970422', name: 'MB Bank - Ngân hàng TMCP Quân đội' },
      { code: '970418', name: 'BIDV - Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
      { code: '970432', name: 'VPBank - Ngân hàng TMCP Việt Nam Thịnh Vượng' },
      { code: '970423', name: 'TPBank - Ngân hàng TMCP Tiên Phong' },
      { code: '970416', name: 'ACB - Ngân hàng TMCP Á Châu' },
      { code: '970403', name: 'Sacombank - Ngân hàng TMCP Sài Gòn Thương Tín' },
      { code: '970405', name: 'Agribank - Ngân hàng Nông nghiệp và Phát triển Nông thôn' },
      { code: '970414', name: 'Oceanbank - Ngân hàng TMCP Đại Dương' },
      { code: '970426', name: 'MSB - Ngân hàng TMCP Hàng Hải' },
      { code: '970441', name: 'VIB - Ngân hàng TMCP Quốc tế' },
      { code: '970448', name: 'OCB - Ngân hàng TMCP Phương Đông' },
      { code: '970406', name: 'DongA Bank - Ngân hàng TMCP Đông Á' },
      { code: '970431', name: 'Eximbank - Ngân hàng TMCP Xuất Nhập khẩu Việt Nam' },
      { code: '970443', name: 'SHB - Ngân hàng TMCP Sài Gòn - Hà Nội' },
      { code: '970437', name: 'HDBank - Ngân hàng TMCP Phát triển TP.HCM' },
      { code: '970419', name: 'NCB - Ngân hàng TMCP Quốc Dân' },
      { code: '970428', name: 'Nam A Bank - Ngân hàng TMCP Nam Á' }
    ];
  }
}

export default WalletService;
