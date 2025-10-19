const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to ensure UTF-8 encoding
const createHeaders = (additionalHeaders = {}) => ({
  'Content-Type': 'application/json; charset=utf-8',
  'Accept': 'application/json; charset=utf-8',
  ...additionalHeaders
});

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/Auth/login`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Login failed');
    }

    return response.json();
  },

  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/Auth/register`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Registration failed');
    }

    return response.json();
  },

  getUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/Auth/user/${userId}`, {
      method: 'GET',
      headers: createHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get user');
    }

    return response.json();
  },

  getCurrentUserProfile: async (token) => {
    const response = await fetch(`${API_BASE_URL}/Auth/profile`, {
      method: 'GET',
      headers: createHeaders({
        'Authorization': `Bearer ${token}`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get profile');
    }

    const profile = await response.json();
    
    // Convert relative avatar URL to absolute URL
    if (profile.avatar && profile.avatar.startsWith('/')) {
      // Extract filename from path like /uploads/avatars/filename.jpg
      const fileName = profile.avatar.split('/').pop();
      profile.avatar = `${API_BASE_URL}/Auth/avatar/${fileName}`;
    }

    return profile;
  },

  updateProfile: async (profileData, token) => {
    const response = await fetch(`${API_BASE_URL}/Auth/profile`, {
      method: 'PUT',
      headers: createHeaders({
        'Authorization': `Bearer ${token}`,
      }),
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update profile');
    }

    return response.json();
  },

  uploadAvatar: async (file, token) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${API_BASE_URL}/Auth/upload-avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to upload avatar');
    }

    const result = await response.json();
    
    // Convert relative URL to absolute URL
    if (result.avatarUrl && result.avatarUrl.startsWith('/')) {
      // Extract filename from path like /uploads/avatars/filename.jpg
      const fileName = result.avatarUrl.split('/').pop();
      result.avatarUrl = `${API_BASE_URL}/Auth/avatar/${fileName}`;
    }

    return result;
  }
};

// Events API
export const eventsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/Event`, {
      method: 'GET',
      headers: createHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }

    return response.json();
  },

  getById: async (eventId) => {
    const response = await fetch(`${API_BASE_URL}/Event/${eventId}`, {
      method: 'GET',
      headers: createHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch event');
    }

    return response.json();
  },

  create: async (eventData) => {
    const response = await fetch(`${API_BASE_URL}/Event`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      throw new Error('Failed to create event');
    }

    return response.json();
  },

  update: async (eventId, eventData) => {
    const response = await fetch(`${API_BASE_URL}/Event/${eventId}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      throw new Error('Failed to update event');
    }

    return response.json();
  },

  delete: async (eventId) => {
    const response = await fetch(`${API_BASE_URL}/Event/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete event');
    }

    return response.json();
  },

  getByHost: async (hostId) => {
    const response = await fetch(`${API_BASE_URL}/Event/host/${hostId}`, {
      method: 'GET',
      headers: createHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch host events');
    }

    return response.json();
  },

  seedSample: async () => {
    const response = await fetch(`${API_BASE_URL}/Event/seed`, {
      method: 'POST',
      headers: createHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to seed sample events');
    }

    return response.json();
  },

  uploadImage: async (file) => {
    // Validation file
    if (!file) {
      throw new Error('Không có file được chọn');
    }

    // Kiểm tra kích thước file (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File quá lớn. Vui lòng chọn file nhỏ hơn 5MB');
    }

    // Kiểm tra loại file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Định dạng file không được hỗ trợ. Vui lòng chọn file JPG, PNG, GIF hoặc WebP');
    }

    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken();
    console.log('Uploading image:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      hasToken: !!token
    });

    try {
      const response = await fetch(`${API_BASE_URL}/Event/upload-image`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: formData,
      });

      console.log('Upload response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Upload error:', errorData);
        throw new Error(errorData.message || `Upload failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log('Upload success:', result);
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  // Multi-step event creation APIs
  createEventStep1: async (eventData) => {
    const response = await fetch(`${API_BASE_URL}/Event/create/step1`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create event step 1');
    }

    return response.json();
  },

  updateEventStep2: async (eventId, eventData) => {
    console.log('=== API updateEventStep2 Debug ===');
    console.log('EventId:', eventId);
    console.log('EventData:', eventData);
    console.log('EventData JSON:', JSON.stringify(eventData, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/Event/${eventId}/create/step2`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(eventData),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', errorData);
      throw new Error(errorData.message || 'Failed to update event step 2');
    }

    const result = await response.json();
    console.log('API Success:', result);
    return result;
  },

  updateEventStep3: async (eventId, eventData) => {
    console.log('=== API updateEventStep3 Debug ===');
    console.log('EventId:', eventId);
    console.log('EventData:', eventData);
    console.log('EventData JSON:', JSON.stringify(eventData, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/Event/${eventId}/create/step3`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(eventData),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', errorData);
      throw new Error(errorData.message || 'Failed to update event step 3');
    }

    const result = await response.json();
    console.log('API Success:', result);
    return result;
  },

  updateEventStep4: async (eventId, eventData) => {
    console.log('=== API updateEventStep4 Debug ===');
    console.log('EventId:', eventId);
    console.log('EventData:', eventData);
    console.log('EventData JSON:', JSON.stringify(eventData, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/Event/${eventId}/create/step4`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(eventData),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', errorData);
      throw new Error(errorData.message || 'Failed to update event step 4');
    }

    const result = await response.json();
    console.log('API Success:', result);
    return result;
  }
};

// Helper function để lấy token từ localStorage
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  console.log('Auth token:', token);
  return token;
};

// Helper function để tạo headers với authorization
const getAuthHeaders = () => {
  const token = getAuthToken();
  const headers = createHeaders({
    ...(token && { 'Authorization': `Bearer ${token}` })
  });
  console.log('Request headers:', headers);
  return headers;
};

// Orders API
export const ordersAPI = {
  create: async (orderData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Order`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Order creation failed:', errorData);
        throw new Error(errorData.message || 'Failed to create order');
      }

      const result = await response.json();
      console.log('Order created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error in ordersAPI.create:', error);
      throw error;
    }
  },

  getById: async (orderId) => {
    console.log('=== API DEBUG ===');
    console.log('API URL:', `${API_BASE_URL}/Order/${orderId}`);
    console.log('Headers:', getAuthHeaders());
    
    const response = await fetch(`${API_BASE_URL}/Order/${orderId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('Error data:', errorData);
      console.log('==================');
      throw new Error(errorData.message || 'Failed to fetch order');
    }

    const result = await response.json();
    console.log('Success result:', result);
    console.log('==================');
    return result;
  },

  getMyOrders: async () => {
    const response = await fetch(`${API_BASE_URL}/Order/my-orders`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch orders');
    }

    return response.json();
  },

  getUserOrders: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/Order/user/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch user orders');
    }

    return response.json();
  },

  updateStatus: async (orderId, status) => {
    const response = await fetch(`${API_BASE_URL}/Order/${orderId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update order status');
    }

    return response.json();
  },

  cancel: async (orderId) => {
    const response = await fetch(`${API_BASE_URL}/Order/${orderId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to cancel order');
    }

    return response.json();
  },

  processPayment: async (orderId, paymentData) => {
    const response = await fetch(`${API_BASE_URL}/Order/${orderId}/payment`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to process payment');
    }

    return response.json();
  }
};

// Voucher API
export const voucherAPI = {
  validate: async (voucherCode, originalAmount) => {
    const response = await fetch(`${API_BASE_URL}/Voucher/validate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        voucherCode,
        originalAmount
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to validate voucher');
    }

    return response.json();
  },

  getByCode: async (voucherCode) => {
    const response = await fetch(`${API_BASE_URL}/Voucher/code/${voucherCode}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to get voucher');
    }

    return response.json();
  },

  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/Voucher`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to get vouchers');
    }

    return response.json();
  }
};

// Wallet API
export const walletAPI = {
  getBalance: async () => {
    const response = await fetch(`${API_BASE_URL}/Wallet/balance`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to get wallet balance');
    }

    return response.json();
  },

  deposit: async (depositData) => {
    const response = await fetch(`${API_BASE_URL}/Wallet/deposit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(depositData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to deposit money');
    }

    return response.json();
  },

  withdraw: async (withdrawData) => {
    const response = await fetch(`${API_BASE_URL}/Wallet/withdraw`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(withdrawData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to withdraw money');
    }

    return response.json();
  },

  getTransactions: async (page = 1, pageSize = 10) => {
    const response = await fetch(`${API_BASE_URL}/Wallet/transactions?page=${page}&pageSize=${pageSize}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch transactions');
    }

    return response.json();
  },

  getTransaction: async (transactionId) => {
    const response = await fetch(`${API_BASE_URL}/Wallet/transactions/${transactionId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch transaction');
    }

    return response.json();
  },

  checkSufficientBalance: async (amount) => {
    const response = await fetch(`${API_BASE_URL}/Wallet/check-balance?amount=${amount}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to check balance');
    }

    return response.json();
  }
};

// Tickets API
export const ticketsAPI = {
  getMyTickets: async () => {
    const response = await fetch(`${API_BASE_URL}/Ticket/my-tickets`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch tickets');
    }

    return response.json();
  },

  getTicketById: async (ticketId) => {
    const response = await fetch(`${API_BASE_URL}/Ticket/${ticketId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch ticket');
    }

    return response.json();
  },

  getTicketsByEvent: async (eventId) => {
    const response = await fetch(`${API_BASE_URL}/Ticket/event/${eventId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch event tickets');
    }

    return response.json();
  },

  checkInTicket: async (ticketId) => {
    const response = await fetch(`${API_BASE_URL}/Ticket/${ticketId}/check-in`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to check in ticket');
    }

    return response.json();
  },

  refundTicket: async (ticketId) => {
    const response = await fetch(`${API_BASE_URL}/Ticket/${ticketId}/refund`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to refund ticket');
    }

    return response.json();
  },

  validateTicket: async (ticketId) => {
    const response = await fetch(`${API_BASE_URL}/Ticket/${ticketId}/validate`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to validate ticket');
    }

    return response.json();
  },

  getTicketTypesByEvent: async (eventId) => {
    const response = await fetch(`${API_BASE_URL}/Ticket/event/${eventId}/types`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch ticket types');
    }

    return response.json();
  },

  getTicketsByOrder: async (orderId) => {
    const response = await fetch(`${API_BASE_URL}/Ticket/order/${orderId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch tickets by order');
    }

    return response.json();
  }
};

// Wishlist API
export const wishlistAPI = {
  getWishlist: async () => {
    const response = await fetch(`${API_BASE_URL}/Wishlist`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch wishlist');
    }

    return response.json();
  },

  addItem: async (ticketTypeId, quantity = 1) => {
    const response = await fetch(`${API_BASE_URL}/Wishlist/items`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ticketTypeId, quantity }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to add item to wishlist');
    }

    return response.json();
  },

  updateItem: async (itemId, quantity) => {
    const response = await fetch(`${API_BASE_URL}/Wishlist/items/${itemId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ quantity }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update wishlist item');
    }

    return response.json();
  },

  deleteItem: async (itemId) => {
    const response = await fetch(`${API_BASE_URL}/Wishlist/items/${itemId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete wishlist item');
    }

    return response.json();
  },

  bulkDelete: async (itemIds) => {
    const response = await fetch(`${API_BASE_URL}/Wishlist/bulk-delete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ Ids: itemIds }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete wishlist items');
    }

    return response.json();
  },

  checkout: async (itemIds) => {
    const response = await fetch(`${API_BASE_URL}/Wishlist/checkout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ Ids: itemIds }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to checkout wishlist');
    }

    return response.json();
  }
};