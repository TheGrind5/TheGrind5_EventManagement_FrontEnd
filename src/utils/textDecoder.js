/**
 * Decode text that may have encoding issues
 * @param {string} text - Text to decode
 * @returns {string} - Decoded text
 */
export const decodeText = (text) => {
  if (!text) return '';
  
  try {
    // Try to decode if it's a URL-encoded string
    return decodeURIComponent(text);
  } catch (error) {
    // If decoding fails, return the original text
    return text;
  }
};

