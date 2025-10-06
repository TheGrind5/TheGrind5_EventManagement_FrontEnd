const API_BASE_URL = 'http://localhost:5000/api';

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  },

  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    return response.json();
  },

  getUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/auth/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user');
    }

    return response.json();
  }
};

// Events API
export const eventsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/event`, {
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
    const response = await fetch(`${API_BASE_URL}/event/${eventId}`, {
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
    const response = await fetch(`${API_BASE_URL}/event`, {
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
    const response = await fetch(`${API_BASE_URL}/event/${eventId}`, {
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
    const response = await fetch(`${API_BASE_URL}/event/${eventId}`, {
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
    const response = await fetch(`${API_BASE_URL}/event/host/${hostId}`, {
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
    const response = await fetch(`${API_BASE_URL}/event/seed`, {
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
