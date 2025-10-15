// API Constants
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Theme Constants
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user_data',
  THEME: 'theme_preference',
  CART: 'cart_items'
};

// Route Constants
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  WALLET: '/wallet',
  TICKETS: '/my-tickets',
  CHECKOUT: '/checkout',
  CREATE_ORDER: '/create-order'
};

// Status Constants
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// UI Constants
export const BREAKPOINTS = {
  XS: 'xs',
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl'
};

export const SPACING = {
  XS: 1,
  SM: 2,
  MD: 3,
  LG: 4,
  XL: 5
};

export const COLORS = {
  PRIMARY: '#1976d2',
  SECONDARY: '#dc004e',
  SUCCESS: '#2e7d32',
  ERROR: '#d32f2f',
  WARNING: '#ed6c02',
  INFO: '#0288d1'
};

// Event Categories
export const EVENT_CATEGORIES = {
  ALL: 'all',
  CONCERT: 'concert',
  SPORTS: 'sports',
  CONFERENCE: 'conference',
  WORKSHOP: 'workshop',
  EXHIBITION: 'exhibition'
};

// Event Status
export const EVENT_STATUS = {
  ALL: 'all',
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};
