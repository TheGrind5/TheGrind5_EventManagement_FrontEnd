/**
 * Text Decoder Utility
 * Decodes HTML entities and handles text encoding issues
 */

/**
 * Decodes HTML entities in text
 * @param {string} text - Text to decode
 * @returns {string} - Decoded text
 */
export const decodeText = (text) => {
  if (!text || typeof text !== 'string') {
    return text || '';
  }

  try {
    // Create a temporary textarea element to decode HTML entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value || text;
  } catch (error) {
    // Fallback: try to decode common HTML entities manually
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }
};

/**
 * Alternative decoder using DOMParser (more reliable for SSR)
 * @param {string} text - Text to decode
 * @returns {string} - Decoded text
 */
export const decodeTextSafe = (text) => {
  if (!text || typeof text !== 'string') {
    return text || '';
  }

  try {
    if (typeof window !== 'undefined' && window.DOMParser) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      return doc.documentElement.textContent || text;
    }
    // Fallback for Node.js environments
    return decodeText(text);
  } catch (error) {
    console.warn('Error decoding text:', error);
    return text;
  }
};

export default decodeText;

