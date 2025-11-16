import apiClient from './apiClient';

/**
 * OAuth Service for Google and Facebook authentication
 */
const oauthService = {
  /**
   * Login with Google ID Token
   * @param {string} idToken - Google ID Token from OAuth response
   * @returns {Promise} API response with JWT token and user info
   */
  async googleLogin(idToken) {
    try {
      const response = await apiClient.post('/OAuth/google', { 
        idToken 
      });
      return response;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  },

  /**
   * Login with Facebook Access Token
   * @param {string} accessToken - Facebook Access Token
   * @returns {Promise} API response with JWT token and user info
   */
  async facebookLogin(accessToken) {
    try {
      const response = await apiClient.post('/OAuth/facebook', { 
        accessToken 
      });
      return response;
    } catch (error) {
      console.error('Facebook login error:', error);
      throw error;
    }
  }
};

export default oauthService;
