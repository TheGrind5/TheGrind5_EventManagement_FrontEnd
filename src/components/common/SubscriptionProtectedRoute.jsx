import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography, Container } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { subscriptionAPI } from '../../services/subscriptionService';
import Header from '../layout/Header';

/**
 * Protected route that requires active subscription for Host users
 * Customer users are redirected to subscription plans page
 */
const SubscriptionProtectedRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkSubscription = async () => {
      // Wait for auth to load
      if (authLoading) {
        return;
      }

      // If not logged in, redirect to login
      if (!user) {
        setChecking(false);
        return;
      }

      // Only check subscription for Host users
      // Customer users should be redirected to subscription plans
      if (user.role !== 'Host') {
        console.log('[SubscriptionProtectedRoute] User is not Host - redirecting to subscription plans');
        setChecking(false);
        setHasAccess(false);
        return;
      }

      try {
        setChecking(true);
        const response = await subscriptionAPI.checkStatus();
        
        // Check response data structure
        const responseData = response.data || response;
        const hasSubscription = responseData?.hasActiveSubscription ?? responseData?.HasActiveSubscription ?? false;
        const activeSubscription = responseData?.activeSubscription ?? responseData?.ActiveSubscription;
        let canCreate = responseData?.canCreateEvent ?? responseData?.CanCreateEvent ?? false;
        const status = activeSubscription?.status ?? activeSubscription?.Status ?? '';
        const planType = activeSubscription?.planType ?? activeSubscription?.PlanType ?? '';
        const remainingEvents = responseData?.remainingEvents ?? responseData?.RemainingEvents ?? 0;
        
        console.log('[SubscriptionProtectedRoute] Subscription check:', {
          hasSubscription,
          status,
          canCreate,
          planType,
          remainingEvents,
          userRole: user.role,
          activeSubscription: activeSubscription ? 'exists' : 'null'
        });

        // Check if has active subscription
        if (!hasSubscription || !activeSubscription) {
          console.warn('[SubscriptionProtectedRoute] No active subscription - redirecting to subscription plans');
          setHasAccess(false);
          setChecking(false);
          return;
        }

        // Check if subscription is active
        if (status !== 'Active') {
          console.warn('[SubscriptionProtectedRoute] Subscription not active - redirecting to subscription plans', { status });
          setHasAccess(false);
          setChecking(false);
          return;
        }

        // QUAN TRỌNG: Professional plan luôn cho phép tạo event (unlimited)
        const isProfessional = planType === 'Professional';
        if (isProfessional && hasSubscription && status === 'Active') {
          console.log('[SubscriptionProtectedRoute] ✅ Professional plan detected - allowing unlimited event creation');
          canCreate = true;
        }

        // Check if can create event (for quota limits) - chỉ check nếu không phải Professional
        if (!canCreate && !isProfessional) {
          console.warn('[SubscriptionProtectedRoute] Cannot create event (quota exceeded) - redirecting to subscription plans', {
            canCreate,
            isProfessional,
            planType,
            remainingEvents
          });
          setHasAccess(false);
          setChecking(false);
          return;
        }

        // All checks passed
        console.log('[SubscriptionProtectedRoute] ✅ Access granted');
        setHasAccess(true);
      } catch (err) {
        console.error('[SubscriptionProtectedRoute] Error checking subscription:', err);
        setError(err.message || 'Không thể kiểm tra subscription');
        setHasAccess(false);
      } finally {
        setChecking(false);
      }
    };

    checkSubscription();
  }, [user, authLoading]);

  // Show loading while checking auth
  if (authLoading || checking) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <Header />
        <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Đang kiểm tra subscription...
          </Typography>
        </Container>
      </Box>
    );
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is not Host, redirect to subscription plans
  if (user.role !== 'Host') {
    return (
      <Navigate 
        to="/subscriptions/plans" 
        state={{ 
          message: 'Bạn cần đăng ký gói subscription để tạo sự kiện. Vui lòng mua gói subscription trước khi tạo sự kiện.',
          from: location.pathname
        }} 
        replace 
      />
    );
  }

  // If no access (no subscription or not active), redirect to subscription plans
  if (!hasAccess) {
    const message = error 
      ? `Lỗi kiểm tra subscription: ${error}. Vui lòng đảm bảo bạn đã có gói subscription hợp lệ.`
      : 'Bạn cần đăng ký gói subscription để tạo sự kiện. Vui lòng mua gói subscription trước khi tạo sự kiện.';
    
    return (
      <Navigate 
        to="/subscriptions/plans" 
        state={{ 
          message,
          from: location.pathname
        }} 
        replace 
      />
    );
  }

  // All checks passed, render children
  return children;
};

export default SubscriptionProtectedRoute;

