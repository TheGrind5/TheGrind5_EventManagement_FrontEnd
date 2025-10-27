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
    return {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || 'Success',
      timestamp: response.data?.timestamp || new Date().toISOString()
    };
  },
  (error) => {
    // Global error handling
    console.error('API Error:', error);
    
    let errorMessage = 'An unexpected error occurred';
    let errorCode = 500;
    
    if (error.response) {
      // Server responded with error status
      errorCode = error.response.status;
      const responseData = error.response.data;
      
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
            // Clear token and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
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
      // Network error
      errorMessage = 'Network error - please check your connection';
      errorCode = 0;
    } else {
      // Other error
      errorMessage = error.message || 'An unexpected error occurred';
    }
    
    return Promise.reject({
      success: false,
      message: errorMessage,
      code: errorCode,
      originalError: error
    });
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
  
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.upload('/Auth/upload-avatar', formData);
  },
  
  getAvatar: (fileName) => {
    return `${config.BASE_URL}/Auth/avatar/${fileName}`;
  }
};

// Events API
export const eventsAPI = {
  getAll: async () => {
    return api.get('/Event');
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
  
  // Venue Layout API for Virtual Stage 2D
  getVenueLayout: async (eventId) => {
    return api.get(`/Event/${eventId}/venue-layout`);
  },
  
  saveVenueLayout: async (eventId, layoutData) => {
    return api.post(`/Event/${eventId}/venue-layout`, layoutData);
  },
  
  deleteVenueLayout: async (eventId) => {
    return api.delete(`/Event/${eventId}/venue-layout`);
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
  
  validateTicket: async (ticketId) => {
    return api.get(`/Ticket/${ticketId}/validate`);
  }
};

// Voucher API
export const voucherAPI = {
  validate: async (voucherCode, originalAmount) => {
    return api.post('/Voucher/validate', { voucherCode, originalAmount });
  },
  
  getByCode: async (voucherCode) => {
    return api.get(`/Voucher/code/${voucherCode}`);
  },
  
  getAll: async () => {
    return api.get('/Voucher');
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

export default apiClient;
