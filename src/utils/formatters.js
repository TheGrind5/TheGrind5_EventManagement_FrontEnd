// Date & Time Formatters
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Currency Formatters
export const formatCurrency = (amount, currency = 'VND') => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const formatNumber = (number) => {
  return new Intl.NumberFormat('vi-VN').format(number);
};

// Text Formatters
export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (text) => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};

// Status Formatters
export const getStatusColor = (status) => {
  const statusColors = {
    pending: '#ed6c02',
    confirmed: '#2e7d32',
    cancelled: '#d32f2f',
    completed: '#1976d2',
    success: '#2e7d32',
    failed: '#d32f2f',
    refunded: '#0288d1'
  };
  return statusColors[status] || '#757575';
};

export const getStatusText = (status) => {
  const statusTexts = {
    pending: 'Đang chờ',
    confirmed: 'Đã xác nhận',
    cancelled: 'Đã hủy',
    completed: 'Hoàn thành',
    success: 'Thành công',
    failed: 'Thất bại',
    refunded: 'Đã hoàn tiền'
  };
  return statusTexts[status] || status;
};
