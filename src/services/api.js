const API_BASE_URL = 'http://localhost:5000/api';

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/Auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user');
    }

    return response.json();
  },

  getCurrentUserProfile: async (token) => {
    const response = await fetch(`${API_BASE_URL}/Auth/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get profile');
    }

    return response.json();
  },

  updateProfile: async (profileData, token) => {
    const response = await fetch(`${API_BASE_URL}/Auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update profile');
    }

    return response.json();
  }
};

// Events API
export const eventsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/Event`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }

    return response.json();
  },

  getById: async (eventId) => {
    const response = await fetch(`${API_BASE_URL}/Event/${eventId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch event');
    }

    return response.json();
  },

  create: async (eventData) => {
    const response = await fetch(`${API_BASE_URL}/Event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch host events');
    }

    return response.json();
  },

  seedSample: async () => {
    const response = await fetch(`${API_BASE_URL}/Event/seed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to seed sample events');
    }

    return response.json();
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
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
  console.log('Request headers:', headers);
  return headers;
};

// Orders API
export const ordersAPI = {
  create: async (orderData) => {
    const response = await fetch(`${API_BASE_URL}/Order`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create order');
    }

    return response.json();
  },

  getById: async (orderId) => {
    const response = await fetch(`${API_BASE_URL}/Order/${orderId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch order');
    }

    return response.json();
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
  }
};