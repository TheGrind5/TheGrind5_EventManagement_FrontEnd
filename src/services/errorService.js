// Centralized error handling service for frontend
import { toast } from 'react-toastify';

class ErrorService {
  constructor() {
    this.errorTypes = {
      NETWORK: 'NETWORK_ERROR',
      VALIDATION: 'VALIDATION_ERROR',
      AUTHENTICATION: 'AUTHENTICATION_ERROR',
      AUTHORIZATION: 'AUTHORIZATION_ERROR',
      NOT_FOUND: 'NOT_FOUND_ERROR',
      SERVER: 'SERVER_ERROR',
      UNKNOWN: 'UNKNOWN_ERROR'
    };
  }

  /**
   * Handle API errors with proper categorization
   */
  handleApiError(error, context = '') {
    console.error(`API Error in ${context}:`, error);

    let errorType = this.errorTypes.UNKNOWN;
    let userMessage = 'Có lỗi xảy ra, vui lòng thử lại';
    let shouldRetry = false;

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const responseData = error.response.data;

      switch (status) {
        case 400:
          errorType = this.errorTypes.VALIDATION;
          userMessage = responseData?.message || 'Dữ liệu không hợp lệ';
          break;
        case 401:
          errorType = this.errorTypes.AUTHENTICATION;
          userMessage = 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại';
          this.handleAuthError();
          break;
        case 403:
          errorType = this.errorTypes.AUTHORIZATION;
          userMessage = 'Bạn không có quyền thực hiện hành động này';
          break;
        case 404:
          errorType = this.errorTypes.NOT_FOUND;
          userMessage = 'Không tìm thấy dữ liệu';
          break;
        case 422:
          errorType = this.errorTypes.VALIDATION;
          userMessage = this.formatValidationErrors(responseData?.errors || []);
          break;
        case 500:
          errorType = this.errorTypes.SERVER;
          userMessage = 'Lỗi máy chủ, vui lòng thử lại sau';
          shouldRetry = true;
          break;
        case 503:
          errorType = this.errorTypes.SERVER;
          userMessage = 'Dịch vụ tạm thời không khả dụng';
          shouldRetry = true;
          break;
        default:
          userMessage = responseData?.message || `Lỗi ${status}`;
      }
    } else if (error.request) {
      // Network error
      errorType = this.errorTypes.NETWORK;
      userMessage = 'Lỗi kết nối mạng, vui lòng kiểm tra internet';
      shouldRetry = true;
    } else {
      // Other error
      userMessage = error.message || 'Có lỗi không xác định';
    }

    // Show error to user
    this.showError(userMessage, errorType);

    return {
      type: errorType,
      message: userMessage,
      shouldRetry,
      originalError: error
    };
  }

  /**
   * Format validation errors into readable message
   */
  formatValidationErrors(errors) {
    if (!Array.isArray(errors) || errors.length === 0) {
      return 'Dữ liệu không hợp lệ';
    }

    if (errors.length === 1) {
      return errors[0];
    }

    return `Có ${errors.length} lỗi: ${errors.join(', ')}`;
  }

  /**
   * Handle authentication errors
   */
  handleAuthError() {
    // Clear stored auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  }

  /**
   * Show error to user
   */
  showError(message, type) {
    // Use toast notification
    toast.error(message, {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    });

    // Log to console for debugging
    console.error(`Error [${type}]:`, message);
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    toast.success(message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    });
  }

  /**
   * Show warning message
   */
  showWarning(message) {
    toast.warning(message, {
      position: 'top-right',
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    });
  }

  /**
   * Show info message
   */
  showInfo(message) {
    toast.info(message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    });
  }

  /**
   * Handle form validation errors
   */
  handleFormErrors(errors, setFieldError) {
    if (!errors || typeof errors !== 'object') return;

    Object.keys(errors).forEach(field => {
      const errorMessage = Array.isArray(errors[field]) 
        ? errors[field].join(', ') 
        : errors[field];
      
      if (setFieldError) {
        setFieldError(field, { message: errorMessage });
      }
    });
  }

  /**
   * Create user-friendly error message
   */
  createUserFriendlyMessage(error) {
    const errorMap = {
      'NETWORK_ERROR': 'Lỗi kết nối mạng',
      'VALIDATION_ERROR': 'Dữ liệu không hợp lệ',
      'AUTHENTICATION_ERROR': 'Phiên đăng nhập đã hết hạn',
      'AUTHORIZATION_ERROR': 'Không có quyền truy cập',
      'NOT_FOUND_ERROR': 'Không tìm thấy dữ liệu',
      'SERVER_ERROR': 'Lỗi máy chủ',
      'UNKNOWN_ERROR': 'Có lỗi xảy ra'
    };

    return errorMap[error.type] || error.message || 'Có lỗi xảy ra';
  }
}

// Create singleton instance
const errorService = new ErrorService();

export default errorService;
export { ErrorService };
