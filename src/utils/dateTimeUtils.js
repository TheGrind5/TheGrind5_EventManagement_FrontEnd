/**
 * Utility functions để xử lý DateTime theo múi giờ UTC+7 (Việt Nam)
 */

/**
 * Parse DateTime string từ backend và convert sang UTC+7
 * @param {string} dateTimeString - DateTime string từ API
 * @returns {Date} Date object đã được adjust sang UTC+7
 */
export const parseVietnamDateTime = (dateTimeString) => {
  if (!dateTimeString) return null;
  
  // Parse string thành Date object
  let date = new Date(dateTimeString);
  
  // Nếu date invalid, return null
  if (isNaN(date.getTime())) return null;
  
  return date;
};

/**
 * Format DateTime theo định dạng Việt Nam: dd/mm/yyyy hh:mm:ss
 * @param {string|Date} dateTime - DateTime string hoặc Date object
 * @returns {string} Formatted date string
 */
export const formatVietnamDateTime = (dateTime) => {
  if (!dateTime) return 'N/A';
  
  const date = typeof dateTime === 'string' ? parseVietnamDateTime(dateTime) : dateTime;
  if (!date) return 'N/A';
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

/**
 * Format Date (không có giờ): dd/mm/yyyy
 * @param {string|Date} dateTime - DateTime string hoặc Date object
 * @returns {string} Formatted date string
 */
export const formatVietnamDate = (dateTime) => {
  if (!dateTime) return 'N/A';
  
  const date = typeof dateTime === 'string' ? parseVietnamDateTime(dateTime) : dateTime;
  if (!date) return 'N/A';
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Format Time (không có ngày): hh:mm:ss
 * @param {string|Date} dateTime - DateTime string hoặc Date object
 * @returns {string} Formatted time string
 */
export const formatVietnamTime = (dateTime) => {
  if (!dateTime) return 'N/A';
  
  const date = typeof dateTime === 'string' ? parseVietnamDateTime(dateTime) : dateTime;
  if (!date) return 'N/A';
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
};

/**
 * Format DateTime ngắn gọn: dd/mm/yyyy hh:mm
 * @param {string|Date} dateTime - DateTime string hoặc Date object
 * @returns {string} Formatted date string
 */
export const formatVietnamDateTimeShort = (dateTime) => {
  if (!dateTime) return 'N/A';
  
  const date = typeof dateTime === 'string' ? parseVietnamDateTime(dateTime) : dateTime;
  if (!date) return 'N/A';
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Lấy thời gian hiện tại theo múi giờ Việt Nam
 * @returns {Date} Current date/time
 */
export const getVietnamNow = () => {
  return new Date();
};

