// Environment configuration for consistent integration
const config = {
  // API Configuration
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  BASE_URL: process.env.REACT_APP_BASE_URL || 'http://localhost:5000',
  
  // Environment
  ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT || 'development',
  IS_DEVELOPMENT: process.env.REACT_APP_ENVIRONMENT === 'development',
  IS_PRODUCTION: process.env.REACT_APP_ENVIRONMENT === 'production',
  
  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.REACT_APP_MAX_FILE_SIZE) || 5242880, // 5MB
  ALLOWED_FILE_TYPES: (process.env.REACT_APP_ALLOWED_FILE_TYPES || 'image/jpeg,image/jpg,image/png,image/gif,image/webp').split(','),
  
  // Pagination
  DEFAULT_PAGE_SIZE: parseInt(process.env.REACT_APP_DEFAULT_PAGE_SIZE) || 10,
  MAX_PAGE_SIZE: parseInt(process.env.REACT_APP_MAX_PAGE_SIZE) || 100,
  
  // Token
  TOKEN_EXPIRY_DAYS: parseInt(process.env.REACT_APP_TOKEN_EXPIRY_DAYS) || 7,
  
  // CORS
  ALLOWED_ORIGINS: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  
  // API Timeout
  API_TIMEOUT: 10000, // 10 seconds
  
  // Retry Configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
};

export default config;
