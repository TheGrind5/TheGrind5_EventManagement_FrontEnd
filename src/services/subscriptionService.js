// Subscription Service for Host Subscription Management
import { api } from './apiClient';

// Subscription API
export const subscriptionAPI = {
  // Get all available plans
  getAvailablePlans: async () => {
    return api.get('/subscriptions/plans');
  },

  // Get my current subscription
  getMySubscription: async () => {
    return api.get('/subscriptions/my-subscription');
  },

  // Check subscription status
  checkStatus: async () => {
    return api.get('/subscriptions/check-status');
  },

  // Purchase a new subscription
  purchaseSubscription: async (planType) => {
    return api.post('/subscriptions/purchase', { planType });
  },

  // Get subscription history
  getHistory: async () => {
    return api.get('/subscriptions/history');
  },

  // Get payment history
  getPaymentHistory: async () => {
    return api.get('/subscriptions/payments');
  },

  // Validate Virtual Stage features
  validateVirtualStage: async (areasCount) => {
    return api.post('/subscriptions/validate-virtual-stage', { areasCount });
  },

  // Cancel subscription
  cancelSubscription: async (subscriptionId) => {
    return api.post(`/subscriptions/${subscriptionId}/cancel`);
  }
};

// Helper functions
export const subscriptionHelpers = {
  // Format price to Vietnamese currency
  formatPrice: (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  },

  // Format date
  formatDate: (date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  },

  // Calculate days remaining
  getDaysRemaining: (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  },

  // Get plan display name
  getPlanDisplayName: (planType) => {
    const planNames = {
      'RisingHost': 'Rising Host',
      'BreakoutHost': 'Breakout Host',
      'Professional': 'Professional'
    };
    return planNames[planType] || planType;
  },

  // Get plan description
  getPlanDescription: (planType) => {
    const descriptions = {
      'RisingHost': 'Gói cơ bản cho host mới bắt đầu. Tạo được 2 sự kiện trong 1 tháng với chức năng Virtual Stage giới hạn.',
      'BreakoutHost': 'Gói nâng cao cho host chuyên nghiệp. Tạo được 30 sự kiện trong 6 tháng với đầy đủ tính năng Virtual Stage.',
      'Professional': 'Gói cao cấp nhất không giới hạn số sự kiện trong 1 năm với tất cả tính năng nâng cao.'
    };
    return descriptions[planType] || '';
  },

  // Check if subscription is expired
  isExpired: (subscription) => {
    if (!subscription) return true;
    const endDate = new Date(subscription.endDate);
    const now = new Date();
    return endDate < now;
  },

  // Check if subscription is active
  isActive: (subscription) => {
    if (!subscription) return false;
    const startDate = new Date(subscription.startDate);
    const endDate = new Date(subscription.endDate);
    const now = new Date();
    return startDate <= now && endDate >= now && subscription.status === 'Active';
  },

  // Get subscription status badge color
  getStatusBadgeColor: (status) => {
    const colors = {
      'Active': 'bg-green-500',
      'Pending': 'bg-yellow-500',
      'Expired': 'bg-gray-500',
      'Cancelled': 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  },

  // Get subscription status display name
  getStatusDisplayName: (status) => {
    const names = {
      'Active': 'Đang hoạt động',
      'Pending': 'Đang chờ',
      'Expired': 'Hết hạn',
      'Cancelled': 'Đã hủy'
    };
    return names[status] || status;
  },

  // Check if can create event
  canCreateEvent: (subscription) => {
    if (!subscription) return false;
    
    // Check if active
    if (!subscriptionHelpers.isActive(subscription)) return false;
    
    // Check if not exceeded max events
    if (subscription.maxEventsAllowed !== -1) {
      return subscription.eventsCreated < subscription.maxEventsAllowed;
    }
    
    // Unlimited plan
    return true;
  },

  // Get remaining events
  getRemainingEvents: (subscription) => {
    if (!subscription) return 0;
    if (subscription.maxEventsAllowed === -1) return 'Unlimited';
    const remaining = subscription.maxEventsAllowed - subscription.eventsCreated;
    return remaining > 0 ? remaining : 0;
  },

  // Get Virtual Stage limit for plan
  getVirtualStageLimit: (planType) => {
    const limits = {
      'RisingHost': 5,
      'BreakoutHost': -1, // Unlimited
      'Professional': -1 // Unlimited
    };
    return limits[planType] || 0;
  }
};

export default {
  ...subscriptionAPI,
  helpers: subscriptionHelpers
};

