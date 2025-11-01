import apiClient from './apiClient';

export const aiSuggestionAPI = {
  /**
   * Get personalized event recommendations for the current user (Customer only)
   */
  getEventRecommendations: async () => {
    try {
      // apiClient trả về { success, data: EventRecommendationResponse, message }
      // Trả về response trực tiếp để component có thể truy cập response.data
      const response = await apiClient.post('/aisuggestion/recommend-events');
      return response;
    } catch (error) {
      console.error('Error getting event recommendations:', error);
      throw error;
    }
  },

  /**
   * Ask the AI chatbot a question
   * @param {string} question - The question to ask
   * @param {number} eventId - Optional event ID for context-aware responses
   */
  askChatbot: async (question, eventId = null) => {
    try {
      // apiClient trả về { success, data: ChatbotResponse, message }
      // Trả về response trực tiếp để component có thể truy cập response.data
      const response = await apiClient.post('/aisuggestion/chatbot', {
        question,
        eventId
      });
      return response;
    } catch (error) {
      console.error('Error asking chatbot:', error);
      throw error;
    }
  },

  /**
   * Get pricing suggestions for event creation (Host only)
   * @param {Object} data - Pricing suggestion request data
   * @param {string} data.category - Event category
   * @param {Date} data.startTime - Event start time
   * @param {string} data.location - Event location
   */
  getSuggestedPricing: async (data) => {
    try {
      const response = await apiClient.post('/aisuggestion/suggest-pricing', data);
      return response;
    } catch (error) {
      console.error('Error getting suggested pricing:', error);
      throw error;
    }
  },

  /**
   * Generate content for event description (Host only)
   * @param {Object} data - Content generation request data
   * @param {string} data.eventType - Type of event
   * @param {string} data.title - Event title
   * @param {string} data.category - Event category
   */
  generateContent: async (data) => {
    try {
      const response = await apiClient.post('/aisuggestion/generate-content', data);
      return response;
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    }
  },

  /**
   * Get user's AI suggestion history
   */
  getHistory: async () => {
    try {
      const response = await apiClient.get('/aisuggestion/history');
      return response;
    } catch (error) {
      console.error('Error getting AI history:', error);
      throw error;
    }
  }
};

export default aiSuggestionAPI;

