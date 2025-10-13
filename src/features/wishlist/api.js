const API_BASE_URL = 'http://localhost:5000/api';

// Helper function để lấy token từ localStorage
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  return token;
};

// Helper function để tạo headers với authorization
const getAuthHeaders = () => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
  return headers;
};

// Wishlist API
export const wishlistAPI = {
  // GET /api/wishlist
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

  // POST /api/wishlist/items
  addItem: async (ticketTypeId, quantity = 1) => {
    console.log('wishlistAPI.addItem: Starting - ticketTypeId:', ticketTypeId, 'quantity:', quantity);
    console.log('wishlistAPI.addItem: API URL:', `${API_BASE_URL}/Wishlist/items`);
    console.log('wishlistAPI.addItem: Headers:', getAuthHeaders());
    
    const response = await fetch(`${API_BASE_URL}/Wishlist/items`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ticketTypeId, quantity }),
    });

    console.log('wishlistAPI.addItem: Response status:', response.status);
    console.log('wishlistAPI.addItem: Response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('wishlistAPI.addItem: Error response:', errorData);
      throw new Error(errorData.message || 'Failed to add item to wishlist');
    }

    const result = await response.json();
    console.log('wishlistAPI.addItem: Success result:', result);
    return result;
  },

  // PATCH /api/wishlist/items/:itemId
  updateItem: async (itemId, quantity) => {
    const response = await fetch(`${API_BASE_URL}/Wishlist/items/${itemId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ quantity }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update item quantity');
    }

    return response.json();
  },

  // DELETE /api/wishlist/items/:itemId
  deleteItem: async (itemId) => {
    const response = await fetch(`${API_BASE_URL}/Wishlist/items/${itemId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete item');
    }

    return response.json();
  },

  // POST /api/wishlist/bulk-delete
  bulkDelete: async (ids) => {
    const response = await fetch(`${API_BASE_URL}/Wishlist/bulk-delete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ Ids: ids }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete items');
    }

    return response.json();
  },

  // POST /api/wishlist/checkout
  checkout: async (ids) => {
    const response = await fetch(`${API_BASE_URL}/Wishlist/checkout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ Ids: ids }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to checkout');
    }

    return response.json();
  }
};
