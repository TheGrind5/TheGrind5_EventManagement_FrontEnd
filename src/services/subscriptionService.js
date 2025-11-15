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
  },

  // Check subscription and navigate to create event or subscription plans
  // Returns true if can create event, false if redirected to subscription plans
  checkSubscriptionAndNavigate: async (navigate, user) => {
    // If not logged in, redirect to login
    if (!user) {
      navigate('/login', { state: { from: '/create-event' } });
      return false;
    }

    // If user is Customer, redirect to subscription plans to purchase
    if (user.role === 'Customer') {
      console.log('[SubscriptionHelper] Customer user - redirecting to subscription plans');
      navigate('/subscriptions/plans', { 
        replace: false,
        state: { 
          message: 'Bạn cần đăng ký gói subscription để tạo sự kiện. Vui lòng mua gói subscription trước khi tạo sự kiện.',
          from: '/create-event'
        }
      });
      return false;
    }

    // Only check subscription for Host users
    if (user.role !== 'Host') {
      // Other roles (Admin, etc.) - redirect to subscription plans
      navigate('/subscriptions/plans', { 
        replace: false,
        state: { 
          message: 'Bạn cần đăng ký gói subscription để tạo sự kiện. Vui lòng mua gói subscription trước khi tạo sự kiện.',
          from: '/create-event'
        }
      });
      return false;
    }

    try {
      const response = await subscriptionAPI.checkStatus();
      
      // Check response data structure - handle nested response
      const responseData = response.data || response;
      let canCreate = responseData?.canCreateEvent ?? responseData?.CanCreateEvent ?? false;
      const hasSubscription = responseData?.hasActiveSubscription ?? responseData?.HasActiveSubscription ?? false;
      const remainingEvents = responseData?.remainingEvents ?? responseData?.RemainingEvents ?? 0;
      const activeSubscription = responseData?.activeSubscription ?? responseData?.ActiveSubscription;
      
      // Get plan details
      const planType = activeSubscription?.planType ?? activeSubscription?.PlanType ?? '';
      const status = activeSubscription?.status ?? activeSubscription?.Status ?? '';
      
      console.log('[SubscriptionHelper] Full subscription check:', {
        hasSubscription,
        status,
        canCreate,
        planType,
        remainingEvents,
        activeSubscription: activeSubscription ? 'exists' : 'null',
        fullResponse: responseData
      });
      
      // QUAN TRỌNG: Kiểm tra xem có subscription active không
      if (!hasSubscription || !activeSubscription) {
        console.warn('[SubscriptionHelper] No active subscription found - redirecting to subscription plans', {
          hasSubscription,
          activeSubscription: activeSubscription ? 'exists' : 'null'
        });
        navigate('/subscriptions/plans', { 
          replace: false,
          state: { message: 'Bạn cần đăng ký gói subscription để tạo sự kiện. Vui lòng mua gói subscription trước khi tạo sự kiện.' }
        });
        return false;
      }
      
      // Kiểm tra status của subscription
      if (status !== 'Active') {
        console.warn('[SubscriptionHelper] Subscription is not active - redirecting to subscription plans', { 
          status,
          planType,
          hasSubscription
        });
        navigate('/subscriptions/plans', { 
          replace: false,
          state: { message: `Gói subscription của bạn đang ở trạng thái "${status}". Vui lòng kích hoạt gói subscription để tạo sự kiện.` }
        });
        return false;
      }
      
      // QUAN TRỌNG: Professional plan luôn cho phép tạo event (unlimited)
      // Phải check trước khi check canCreate
      const isProfessional = planType === 'Professional';
      if (isProfessional && hasSubscription && status === 'Active') {
        console.log('[SubscriptionHelper] ✅ Professional plan detected - allowing unlimited event creation (overriding canCreate)');
        canCreate = true;
      }
      
      // Final check - nếu không thể tạo event (hết quota) - chỉ check nếu không phải Professional
      if (!canCreate && !isProfessional) {
        console.warn('[SubscriptionHelper] Cannot create event - redirecting to subscription plans', {
          canCreate,
          isProfessional,
          hasSubscription,
          status,
          remainingEvents,
          planType
        });
        navigate('/subscriptions/plans', { 
          replace: false,
          state: { 
            message: remainingEvents === 0 
              ? 'Bạn đã vượt quá giới hạn số sự kiện cho phép. Vui lòng nâng cấp gói subscription để tạo thêm sự kiện.'
              : 'Bạn cần đăng ký gói subscription để tạo sự kiện'
          }
        });
        return false;
      }
      
      // All checks passed - navigate to create event
      console.log('[SubscriptionHelper] ✅ Allowed to create event - navigating to create-event');
      navigate('/create-event');
      return true;
    } catch (err) {
      console.error('[SubscriptionHelper] Error checking subscription:', err);
      console.error('[SubscriptionHelper] Error details:', err.response?.data || err.message);
      
      // QUAN TRỌNG: Khi có lỗi, vẫn redirect về trang subscription để đảm bảo an toàn
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error || 
                         err.message || 
                         'Không thể kiểm tra trạng thái subscription. Vui lòng thử lại sau.';
      
      console.warn('[SubscriptionHelper] Error checking subscription - redirecting to subscription plans for safety');
      navigate('/subscriptions/plans', { 
        replace: false,
        state: { 
          message: `Lỗi kiểm tra subscription: ${errorMessage}. Vui lòng đảm bảo bạn đã có gói subscription hợp lệ.`
        }
      });
      return false;
    }
  }
};

export default {
  ...subscriptionAPI,
  helpers: subscriptionHelpers
};

