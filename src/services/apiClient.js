// Centralized API Client for consistent integration
import axios from 'axios';
import config from '../config/environment';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: config.API_URL,
  timeout: config.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => {
    // Standardize response format
    const body = response.data;
    // Preserve pagination payloads (have totalCount/page/pageSize)
    const hasPagingKeys = body && typeof body === 'object' && (
      Object.prototype.hasOwnProperty.call(body, 'totalCount') ||
      Object.prototype.hasOwnProperty.call(body, 'page') ||
      Object.prototype.hasOwnProperty.call(body, 'pageSize') ||
      Object.prototype.hasOwnProperty.call(body, 'TotalCount') ||
      Object.prototype.hasOwnProperty.call(body, 'Page') ||
      Object.prototype.hasOwnProperty.call(body, 'PageSize')
    );

    // Handle both camelCase (data) and PascalCase (Data) from .NET serialization
    // .NET by default uses PascalCase, but can be configured to camelCase
    const normalizedData = hasPagingKeys 
      ? body 
      : (body?.data ?? body?.Data ?? body);

    return {
      success: true,
      data: normalizedData,
      message: body?.message || body?.Message || 'Success',
      timestamp: body?.timestamp || body?.Timestamp || new Date().toISOString()
    };
  },
  (error) => {
    // Global error handling
    console.error('API Error:', error);
    console.error('API Error Response:', error.response);
    console.error('API Error Response Data:', error.response?.data);
    
    let errorMessage = 'An unexpected error occurred';
    let errorCode = 500;
    
    if (error.response) {
      // Server responded with error status
      errorCode = error.response.status;
      const responseData = error.response.data;
      
      // Đảm bảo giữ nguyên error.response.data để component có thể truy cập
      // Không thay đổi error object, chỉ log thông tin
      
      if (responseData?.message) {
        errorMessage = responseData.message;
      } else if (responseData?.errors && Array.isArray(responseData.errors)) {
        errorMessage = responseData.errors.join(', ');
      } else {
        switch (errorCode) {
          case 400:
            errorMessage = 'Bad request';
            break;
          case 401:
            errorMessage = 'Unauthorized - please login again';
            // Clear token
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Only redirect to login if not already on login or home page
            // This prevents auto-redirect when app first loads with invalid token
            const currentPath = window.location.pathname;
            if (currentPath !== '/login' && currentPath !== '/' && currentPath !== '/register') {
              window.location.href = '/login';
            }
            break;
          case 403:
            errorMessage = 'Access forbidden';
            break;
          case 404:
            errorMessage = 'Resource not found';
            break;
          case 500:
            errorMessage = 'Internal server error';
            break;
          default:
            errorMessage = `Error ${errorCode}`;
        }
      }
    } else if (error.request) {
      // Network error - không thể kết nối đến server
      errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy tại http://localhost:5000 không.';
      errorCode = 0;
    } else {
      // Other error
      errorMessage = error.message || 'An unexpected error occurred';
    }
    
    // Giữ nguyên error object gốc để component có thể truy cập error.response.data
    // Chỉ thêm thông tin bổ sung nếu cần
    if (error.response) {
      // Đảm bảo error.response.data được giữ nguyên
      error.response.data = error.response.data || {};
      if (!error.response.data.message && errorMessage) {
        error.response.data.message = errorMessage;
      }
    }
    
    // Thêm thông tin bổ sung vào error object
    error.apiErrorMessage = errorMessage;
    error.apiErrorCode = errorCode;
    
    return Promise.reject(error);
  }
);

// API Methods
export const api = {
  // Generic methods
  get: (url, config = {}) => apiClient.get(url, config),
  post: (url, data, config = {}) => apiClient.post(url, data, config),
  put: (url, data, config = {}) => apiClient.put(url, data, config),
  patch: (url, data, config = {}) => apiClient.patch(url, data, config),
  delete: (url, config = {}) => apiClient.delete(url, config),
  
  // File upload
  upload: (url, formData, config = {}) => {
    return apiClient.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config.headers
      }
    });
  }
};

// Auth API
export const authAPI = {
  login: async (email, password) => {
    return api.post('/Auth/login', { email, password });
  },
  
  register: async (userData) => {
    return api.post('/Auth/register', userData);
  },

  checkPhone: async (phone) => {
    return api.get(`/Auth/check-phone?phone=${encodeURIComponent(phone)}`);
  },
  
  getCurrentUser: async () => {
    return api.get('/Auth/me');
  },
  
  getProfile: async () => {
    return api.get('/Auth/profile');
  },
  
  getCurrentUserProfile: async (token) => {
    // Alias for getProfile to maintain compatibility
    return api.get('/Auth/profile');
  },
  
  updateProfile: async (profileData) => {
    return api.put('/Auth/profile', profileData);
  },
  
  changePassword: async (oldPassword, newPassword) => {
    return api.post('/Auth/change-password', { oldPassword, newPassword });
  },
  
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.upload('/Auth/upload-avatar', formData);
  },
  
  // Forgot/Reset password
  forgotPassword: async (email) => {
    return api.post('/Auth/forgot-password', { email });
  },

  resetPassword: async (email, token, newPassword) => {
    return api.post('/Auth/reset-password', { email, token, newPassword });
  },
  
  getAvatar: (fileName) => {
    return `${config.BASE_URL}/Auth/avatar/${fileName}`;
  }
};

// Events API
export const eventsAPI = {
  getAll: async (page = 1, pageSize = 12, filters = {}) => {
    // Build query params
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('pageSize', pageSize);
    
    // Add filters if provided
    if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
    if (filters.category) params.append('category', filters.category);
    if (filters.eventMode) params.append('eventMode', filters.eventMode);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.location) params.append('location', filters.location);
    if (filters.city) params.append('city', filters.city);
    
    return api.get(`/Event?${params.toString()}`);
  },
  
  getById: async (eventId) => {
    return api.get(`/Event/${eventId}`);
  },
  
  create: async (eventData) => {
    return api.post('/Event', eventData);
  },
  
  update: async (eventId, eventData) => {
    return api.put(`/Event/${eventId}`, eventData);
  },
  
  delete: async (eventId) => {
    return api.delete(`/Event/${eventId}`);
  },
  
  getByHost: async (hostId) => {
    return api.get(`/Event/host/${hostId}`);
  },

  getMyEvents: async () => {
    return api.get('/Event/my-events');
  },

  getEditStatus: async (eventId) => {
    return api.get(`/Event/${eventId}/edit-status`);
  },
  
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload('/Event/upload-image', formData);
  },
  
  // Multi-step event creation
  createStep1: async (eventData) => {
    return api.post('/Event/create/step1', eventData);
  },
  
  updateStep2: async (eventId, eventData) => {
    return api.put(`/Event/${eventId}/create/step2`, eventData);
  },
  
  updateStep3: async (eventId, eventData) => {
    return api.put(`/Event/${eventId}/create/step3`, eventData);
  },
  
  updateStep4: async (eventId, eventData) => {
    return api.put(`/Event/${eventId}/create/step4`, eventData);
  },

  // Tạo event hoàn chỉnh với tất cả 5 bước cùng lúc
  createCompleteEvent: async (eventData) => {
    return api.post('/Event/create/complete', eventData);
  },
  
  // Venue Layout API for Virtual Stage 2D
  getVenueLayout: async (eventId) => {
    return api.get(`/Event/${eventId}/venue-layout`);
  },
  
  saveVenueLayout: async (eventId, layoutData) => {
    return api.post(`/Event/${eventId}/venue-layout`, layoutData);
  },
  
  deleteVenueLayout: async (eventId) => {
    return api.delete(`/Event/${eventId}/venue-layout`);
  },
  
  // Report Event API
  reportEvent: async (eventId) => {
    return api.post(`/Event/${eventId}/report`);
  },
  
  getReportStatus: async (eventId) => {
    return api.get(`/Event/${eventId}/report/status`);
  }
};

// Orders API
export const ordersAPI = {
  create: async (orderData) => {
    return api.post('/Order', orderData);
  },
  
  getById: async (orderId) => {
    return api.get(`/Order/${orderId}`);
  },
  
  update: async (orderId, orderData) => {
    return api.put(`/Order/${orderId}`, orderData);
  },
  
  getMyOrders: async () => {
    return api.get('/Order/my-orders');
  },
  
  getUserOrders: async (userId) => {
    return api.get(`/Order/user/${userId}`);
  },
  
  updateStatus: async (orderId, status) => {
    return api.put(`/Order/${orderId}/status`, { status });
  },
  
  cancel: async (orderId) => {
    return api.delete(`/Order/${orderId}`);
  },
  
  processPayment: async (orderId, paymentData) => {
    return api.post(`/Order/${orderId}/payment`, paymentData);
  },

  getHostOrders: async ({ page = 1, pageSize = 10, status, eventId, search } = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('pageSize', pageSize);
    if (status) params.append('status', status);
    if (eventId !== undefined && eventId !== null && !Number.isNaN(eventId)) {
      params.append('eventId', eventId);
    }
    if (search) params.append('search', search);

    return api.get(`/Order/host-orders/summary?${params.toString()}`);
  }
};

// Wallet API
export const walletAPI = {
  getBalance: async () => {
    return api.get('/Wallet/balance');
  },
  
  deposit: async (depositData) => {
    return api.post('/Wallet/deposit', depositData);
  },
  
  withdraw: async (withdrawData) => {
    return api.post('/Wallet/withdraw', withdrawData);
  },
  
  getTransactions: async (page = 1, pageSize = 10) => {
    return api.get(`/Wallet/transactions?page=${page}&pageSize=${pageSize}`);
  },
  
  getTransaction: async (transactionId) => {
    return api.get(`/Wallet/transactions/${transactionId}`);
  },
  
  checkBalance: async (amount) => {
    return api.get(`/Wallet/check-balance?amount=${amount}`);
  }
};

// Tickets API
export const ticketsAPI = {
  getMyTickets: async () => {
    return api.get('/Ticket/my-tickets');
  },
  
  getTicketById: async (ticketId) => {
    return api.get(`/Ticket/${ticketId}`);
  },
  
  getTicketsByEvent: async (eventId) => {
    return api.get(`/Ticket/event/${eventId}`);
  },
  
  getTicketTypesByEvent: async (eventId) => {
    return api.get(`/Ticket/event/${eventId}/types`);
  },
  
  getTicketsByOrder: async (orderId) => {
    return api.get(`/Ticket/order/${orderId}`);
  },
  
  checkInTicket: async (ticketId) => {
    return api.put(`/Ticket/${ticketId}/check-in`);
  },
  
  refundTicket: async (ticketId) => {
    return api.put(`/Ticket/${ticketId}/refund`);
  },
  
  cancelTicket: async (ticketId) => {
    return api.put(`/Ticket/${ticketId}/cancel`);
  },
  
  validateTicket: async (ticketId) => {
    return api.get(`/Ticket/${ticketId}/validate`);
  }
};

// Voucher API
export const voucherAPI = {
  validate: async (voucherCode, originalAmount, userId = null) => {
    return api.post('/Voucher/validate', { 
      voucherCode, 
      originalAmount,
      userId 
    });
  },
  
  getByCode: async (voucherCode) => {
    return api.get(`/Voucher/code/${voucherCode}`);
  },
  
  getById: async (voucherId) => {
    return api.get(`/Voucher/${voucherId}`);
  },
  
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.isActive !== undefined) params.append('IsActive', filters.isActive);
    if (filters.validFrom) params.append('ValidFrom', filters.validFrom);
    if (filters.validTo) params.append('ValidTo', filters.validTo);
    if (filters.searchCode) params.append('SearchCode', filters.searchCode);
    if (filters.page) params.append('Page', filters.page);
    if (filters.pageSize) params.append('PageSize', filters.pageSize);
    
    const queryString = params.toString();
    return api.get(`/Voucher${queryString ? '?' + queryString : ''}`);
  },
  
  create: async (voucherData) => {
    return api.post('/Voucher', voucherData);
  },
  
  update: async (voucherId, voucherData) => {
    return api.put(`/Voucher/${voucherId}`, voucherData);
  },
  
  delete: async (voucherId) => {
    return api.delete(`/Voucher/${voucherId}`);
  },
  
  getUsageHistory: async (voucherId) => {
    return api.get(`/Voucher/${voucherId}/usage`);
  },
  
  getUsageCount: async (voucherId) => {
    return api.get(`/Voucher/${voucherId}/usage-count`);
  }
};

// Wishlist API
export const wishlistAPI = {
  getWishlist: async () => {
    return api.get('/Wishlist');
  },
  
  addItem: async (ticketTypeId, quantity = 1) => {
    return api.post('/Wishlist/items', { ticketTypeId, quantity });
  },
  
  updateItem: async (itemId, quantity) => {
    return api.patch(`/Wishlist/items/${itemId}`, { quantity });
  },
  
  deleteItem: async (itemId) => {
    return api.delete(`/Wishlist/items/${itemId}`);
  },
  
  bulkDelete: async (itemIds) => {
    return api.post('/Wishlist/bulk-delete', { Ids: itemIds });
  },
  
  checkout: async (itemIds) => {
    return api.post('/Wishlist/checkout', { Ids: itemIds });
  }
};

// Notification API
export const notificationAPI = {
  getNotifications: async (page = 1, pageSize = 10) => {
    return api.get(`/Notification?page=${page}&pageSize=${pageSize}`);
  },
  
  getNotification: async (notificationId) => {
    return api.get(`/Notification/${notificationId}`);
  },
  
  markAsRead: async (notificationId) => {
    return api.put(`/Notification/${notificationId}/read`);
  },
  
  markAllAsRead: async () => {
    return api.put('/Notification/read-all');
  },
  
  deleteNotification: async (notificationId) => {
    return api.delete(`/Notification/${notificationId}`);
  },
  
  getStats: async () => {
    return api.get('/Notification/stats');
  }
};

// EventQuestion API
export const eventQuestionsAPI = {
  getByEventId: async (eventId) => {
    return api.get(`/EventQuestion/by-event/${eventId}`);
  },
  
  getById: async (questionId) => {
    return api.get(`/EventQuestion/${questionId}`);
  },
  
  create: async (data) => {
    return api.post('/EventQuestion', data);
  },
  
  update: async (questionId, data) => {
    return api.put(`/EventQuestion/${questionId}`, data);
  },
  
  delete: async (questionId) => {
    return api.delete(`/EventQuestion/${questionId}`);
  }
};

// Payment API
export const paymentAPI = {
  getStatus: async (paymentId) => {
    return api.get(`/Payment/status/${paymentId}`);
  },
  
  cancelPayment: async (paymentId) => {
    return api.post(`/Payment/${paymentId}/cancel`);
  },
  
  // PayOS APIs
  createPayOSTopUp: async (topUpData) => {
    return api.post('/Payment/payos/create-topup', topUpData);
  },
  
  getPayOSStatus: async (paymentId) => {
    return api.get(`/Payment/payos/${paymentId}/status`);
  },
  
  cancelPayOSPayment: async (paymentId) => {
    return api.post(`/Payment/payos/${paymentId}/cancel`);
  }
};

// Product API
export const productsAPI = {
  getByEvent: async (eventId) => {
    return api.get(`/Product/by-event/${eventId}`);
  },
  
  getById: async (productId) => {
    return api.get(`/Product/${productId}`);
  },
  
  create: async (productData) => {
    return api.post('/Product', productData);
  },
  
  update: async (productId, productData) => {
    return api.put(`/Product/${productId}`, productData);
  },
  
  delete: async (productId) => {
    return api.delete(`/Product/${productId}`);
  }
};

// Announcement API
export const announcementAPI = {
  getAll: async () => {
    return api.get('/Announcement');
  },
  
  getActive: async () => {
    return api.get('/Announcement/active');
  },
  
  getById: async (announcementId) => {
    return api.get(`/Announcement/${announcementId}`);
  },
  
  create: async (content) => {
    return api.post('/Announcement', { content });
  },
  
  update: async (announcementId, data) => {
    return api.put(`/Announcement/${announcementId}`, data);
  },
  
  delete: async (announcementId) => {
    return api.delete(`/Announcement/${announcementId}`);
  }
};

// Comment API
export const commentsAPI = {
  create: async (eventId, content, parentCommentId = null) => {
    return api.post('/Comment', {
      eventId,
      content,
      parentCommentId
    });
  },
  
  getByEventId: async (eventId, page = 1, pageSize = 20) => {
    return api.get(`/Comment/event/${eventId}?page=${page}&pageSize=${pageSize}`);
  },
  
  getById: async (commentId) => {
    return api.get(`/Comment/${commentId}`);
  },
  
  update: async (commentId, content) => {
    return api.put(`/Comment/${commentId}`, { content });
  },
  
  delete: async (commentId) => {
    return api.delete(`/Comment/${commentId}`);
  },
  
  toggleReaction: async (commentId, reactionType) => {
    return api.post(`/Comment/${commentId}/reaction`, { reactionType });
  }
};

// Host Marketing API
export const hostMarketingAPI = {
  getOverview: async () => {
    return api.get('/HostMarketing/overview');
  },

  getEvents: async () => {
    return api.get('/HostMarketing/events');
  },
  
  getEventAnalytics: async (eventId) => {
    return api.get(`/HostMarketing/events/${eventId}/analytics`);
  },
  
  getAudiencePreview: async (eventId, includePending = false) => {
    return api.get(`/HostMarketing/events/${eventId}/audience-preview?includePending=${includePending}`);
  },
  
  sendBroadcast: async (payload) => {
    return api.post(`/HostMarketing/events/${payload.eventId}/broadcast`, payload);
  },
  
  sendReminder: async (payload) => {
    return api.post(`/HostMarketing/events/${payload.eventId}/reminder`, payload);
  }
};

export default apiClient;
