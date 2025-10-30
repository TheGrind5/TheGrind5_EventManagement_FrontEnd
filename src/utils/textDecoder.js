/**
 * Text Decoder Utility
 * Fixes UTF-8 encoding issues from backend
 */

/**
 * Decode text that was incorrectly encoded (mojibake)
 * Handles double-encoded UTF-8 text
 * @param {string} text - Text to decode
 * @returns {string} - Decoded text
 */
export const decodeText = (text) => {
  if (!text || typeof text !== 'string') return text || '';
  
  try {
    // Pattern để phát hiện text bị encoding sai (mojibake)
    // Các ký tự như Ã, Ä, Æ°, Æ¡, á», v.v. xuất hiện nhiều là dấu hiệu của mojibake
    const hasMojibake = /Ã|Ä|Å|á»|Æ°|Æ¡|Äá|Äá»/.test(text) && 
                        /[À-ÿ]{2,}/.test(text);
    
    if (!hasMojibake) {
      return text;
    }

    // Method 1: Decode double-encoded UTF-8
    try {
      // Convert string to bytes (assume it's Latin-1 encoded UTF-8)
      const bytes = new Uint8Array(
        text.split('').map(char => char.charCodeAt(0) & 0xFF)
      );
      
      // Decode as UTF-8
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const decoded = decoder.decode(bytes);
      
      // Kiểm tra xem kết quả có tốt hơn không
      // Đếm số ký tự tiếng Việt hợp lệ
      const vietnameseChars = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/gi;
      const originalVietnameseCount = (text.match(vietnameseChars) || []).length;
      const decodedVietnameseCount = (decoded.match(vietnameseChars) || []).length;
      
      const betterResult = !/Ã|Äá|á»/.test(decoded) || 
                          decodedVietnameseCount > originalVietnameseCount;
      
      if (betterResult && decoded !== text) {
        console.debug('Successfully decoded text:', { original: text, decoded });
        return decoded;
      }
    } catch (e) {
      console.debug('UTF-8 decode failed:', e);
    }

    // Method 2: Try decodeURIComponent + escape for URL-encoded text
    try {
      const decoded = decodeURIComponent(escape(text));
      if (decoded !== text && !/Ã|Äá|á»/.test(decoded)) {
        console.debug('Successfully decoded text via URI:', { original: text, decoded });
        return decoded;
      }
    } catch (e) {
      console.debug('URI decode failed:', e);
    }
    
    // Nếu tất cả đều thất bại, trả về text gốc
    console.warn('Could not decode text, returning original:', text);
    return text;
    
  } catch (error) {
    console.error('Text decode error:', error);
    return text;
  }
};

/**
 * Decode all text properties in an object
 * @param {object} obj - Object with text properties
 * @param {string[]} fields - Fields to decode
 * @returns {object} - Object with decoded text
 */
export const decodeObject = (obj, fields) => {
  if (!obj) return obj;
  
  const decoded = { ...obj };
  fields.forEach(field => {
    if (decoded[field]) {
      decoded[field] = decodeText(decoded[field]);
    }
  });
  
  return decoded;
};

/**
 * Decode event object
 * @param {object} event - Event object
 * @returns {object} - Event with decoded text
 */
export const decodeEvent = (event) => {
  if (!event) return event;
  
  return decodeObject(event, [
    'title',
    'description',
    'location',
    'category',
    'hostName'
  ]);
};

/**
 * Decode array of events
 * @param {array} events - Array of events
 * @returns {array} - Array of events with decoded text
 */
export const decodeEvents = (events) => {
  if (!Array.isArray(events)) return events;
  return events.map(decodeEvent);
};

export default {
  decodeText,
  decodeObject,
  decodeEvent,
  decodeEvents
};

