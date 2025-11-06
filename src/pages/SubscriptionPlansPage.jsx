import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  useTheme,
  Divider
} from '@mui/material';
import {
  CheckCircle,
  Star,
  TrendingUp,
  Diamond,
  ArrowBack,
  Info
} from '@mui/icons-material';
import Header from '../components/layout/Header';
import { subscriptionAPI, subscriptionHelpers } from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';

const SubscriptionPlansPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansResponse, subscriptionResponse] = await Promise.all([
        subscriptionAPI.getAvailablePlans(),
        subscriptionAPI.getMySubscription().catch(() => null) // Ignore if no subscription
      ]);

      // Backend returns { Plans: [...] } not array directly
      const plansData = plansResponse.data?.Plans || plansResponse.data?.plans || plansResponse.data || [];
      setPlans(Array.isArray(plansData) ? plansData : []);
      
      // Handle subscription response - could be SubscriptionStatusResponse or SubscriptionResponse
      const subData = subscriptionResponse?.data;
      if (subData?.ActiveSubscription) {
        setCurrentSubscription(subData.ActiveSubscription);
      } else if (subData?.planType || subData?.PlanType) {
        setCurrentSubscription(subData);
      } else {
        setCurrentSubscription(null);
      }
    } catch (err) {
      console.error('Error loading subscription data:', err);
      setError('Không thể tải thông tin gói subscription');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (planType) => {
    try {
      setPurchasing(planType);
      setError(null);

      const response = await subscriptionAPI.purchaseSubscription(planType);
      
      // Backend returns { PaymentUrl: "..." } or { paymentUrl: "..." }
      const paymentUrl = response.data?.PaymentUrl || response.data?.paymentUrl;
      
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        throw new Error('Không nhận được URL thanh toán');
      }
    } catch (err) {
      console.error('Error purchasing subscription:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error ||
                          err.message ||
                          'Không thể mua gói subscription. Vui lòng thử lại.';
      setError(errorMessage);
      setPurchasing(null);
    }
  };

  const isActiveSubscription = (subscription) => {
    if (!subscription) return false;
    const now = new Date();
    const startDate = new Date(subscription.StartDate ?? subscription.startDate);
    const endDate = new Date(subscription.EndDate ?? subscription.endDate);
    const status = subscription.Status ?? subscription.status;
    return startDate <= now && endDate >= now && status === 'Active';
  };

  const getPlanIcon = (planType) => {
    switch (planType) {
      case 'RisingHost':
        return <Star sx={{ fontSize: 40, color: '#FF9800' }} />;
      case 'BreakoutHost':
        return <TrendingUp sx={{ fontSize: 40, color: '#2196F3' }} />;
      case 'Professional':
        return <Diamond sx={{ fontSize: 40, color: '#9C27B0' }} />;
      default:
        return <Star sx={{ fontSize: 40 }} />;
    }
  };

  const getPlanColor = (planType) => {
    switch (planType) {
      case 'RisingHost':
        return '#FF9800';
      case 'BreakoutHost':
        return '#2196F3';
      case 'Professional':
        return '#9C27B0';
      default:
        return theme.palette.primary.main;
    }
  };

  const getFeatures = (plan) => {
    const features = [];
    
    // Map field names (backend uses MaxEvents, frontend might use different casing)
    const maxEvents = plan.MaxEvents ?? plan.maxEvents ?? plan.maxEventsAllowed ?? 0;
    const durationMonths = plan.DurationMonths ?? plan.durationMonths ?? 1;
    const planFeatures = plan.Features ?? plan.features ?? plan.enabledFeatures ?? [];
    
    // Max events (check for unlimited: -1, int.MaxValue, or very large number)
    if (maxEvents === -1 || maxEvents === 2147483647 || maxEvents > 1000000) {
      features.push('Không giới hạn sự kiện');
    } else {
      features.push(`${maxEvents} sự kiện trong ${durationMonths} tháng`);
    }
    
    // Duration
    features.push(`Thời hạn: ${durationMonths} tháng`);
    
    // Virtual Stage limits based on plan type
    const planType = plan.PlanType ?? plan.planType ?? '';
    if (planType === 'RisingHost') {
      features.push('Virtual Stage tối đa 5 khu vực');
    } else if (planType === 'BreakoutHost' || planType === 'Professional') {
      features.push('Virtual Stage không giới hạn');
    }
    
    // Enabled features from plan config
    if (Array.isArray(planFeatures) && planFeatures.length > 0) {
      planFeatures.forEach(feature => {
        if (feature && typeof feature === 'string') {
          features.push(feature);
        }
      });
    }
    
    return features;
  };

  if (loading) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <Header />
        <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Đang tải thông tin gói subscription...
          </Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Header />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ 
            mb: 3, 
            color: theme.palette.text.secondary,
            '&:hover': { 
              color: theme.palette.text.primary, 
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
            } 
          }}
        >
          Quay lại
        </Button>

        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
            Upgrade Your Plan
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Choose a new plan to unlock more features today.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2, maxWidth: 600, mx: 'auto' }}>
              {error}
            </Alert>
          )}
        </Box>

        {currentSubscription && isActiveSubscription(currentSubscription) && (
          <Alert 
            severity="info" 
            sx={{ mb: 4 }}
            icon={<Info />}
          >
            <Typography variant="body1" fontWeight={600}>
              Gói hiện tại: {subscriptionHelpers.getPlanDisplayName(
                currentSubscription.PlanType ?? currentSubscription.planType ?? ''
              )}
            </Typography>
            <Typography variant="body2">
              Bạn đang có subscription đang hoạt động. Bạn có thể mua gói mới để gia hạn hoặc nâng cấp.
            </Typography>
          </Alert>
        )}
        
        {location.state?.message && (
          <Alert 
            severity={location.state.paymentSuccess ? "success" : "warning"} 
            sx={{ mb: 4 }} 
            onClose={() => navigate(location.pathname, { state: {} })}
          >
            {location.state.message}
          </Alert>
        )}
        
        {location.state?.paymentSuccess && (
          <Alert severity="success" sx={{ mb: 4 }} icon={<CheckCircle />}>
            <Typography variant="body1" fontWeight={600}>
              Thanh toán thành công!
            </Typography>
            <Typography variant="body2">
              Gói subscription của bạn đã được kích hoạt. Bạn có thể tạo sự kiện ngay bây giờ.
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => navigate('/create-event')}
            >
              Tạo sự kiện ngay
            </Button>
          </Alert>
        )}

        {/* Plans Container with horizontal layout */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 4,
            justifyContent: 'center',
            alignItems: 'stretch',
            mb: 4
          }}
        >
          {plans.length === 0 ? (
            <Alert severity="warning" sx={{ width: '100%' }}>
              Không có gói subscription nào khả dụng. Vui lòng liên hệ quản trị viên.
            </Alert>
          ) : plans.map((plan, index) => {
            const planType = plan.PlanType ?? plan.planType ?? '';
            const isCurrentPlan = currentSubscription && 
              (currentSubscription.PlanType ?? currentSubscription.planType ?? '') === planType &&
              isActiveSubscription(currentSubscription);
            const features = getFeatures(plan);
            const planColor = getPlanColor(planType);
            
            // Map field names for display
            const planName = plan.Name ?? plan.name ?? planType;
            const planPrice = plan.Price ?? plan.price ?? 0;
            const planDescription = plan.Description ?? plan.description ?? '';
            const durationMonths = plan.DurationMonths ?? plan.durationMonths ?? 1;

            // Determine if this is the best deal (Professional plan)
            const isBestDeal = planType === 'Professional';
            
            // Get gradient colors for each plan
            const getGradientColors = (planType) => {
              switch (planType) {
                case 'Professional':
                  return { start: '#FF9800', end: '#FFC107' }; // Orange to Yellow
                case 'BreakoutHost':
                  return { start: '#E91E63', end: '#9C27B0' }; // Pink to Purple
                case 'RisingHost':
                  return { start: '#4CAF50', end: '#388E3C' }; // Green gradient
                default:
                  return { start: planColor, end: planColor };
              }
            };

            const gradient = getGradientColors(planType);
            
            // Get duration display text
            const getDurationText = (months) => {
              if (months === 12) return '/năm';
              if (months === 1) return '/tháng';
              return `/${months} tháng`;
            };

            const durationText = getDurationText(durationMonths);

            return (
              <Box
                key={planType}
                sx={{
                  flex: { xs: '1 1 auto', md: '1 1 0' },
                  minWidth: { xs: '100%', md: '280px' },
                  maxWidth: { xs: '100%', md: '400px' },
                  position: 'relative',
                }}
              >
                {/* Best Deal Ribbon */}
                {isBestDeal && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 20,
                      left: -10,
                      zIndex: 10,
                      background: `linear-gradient(135deg, ${gradient.start}, ${gradient.end})`,
                      color: 'white',
                      padding: '4px 16px',
                      fontSize: '12px',
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      borderRadius: '4px',
                      boxShadow: theme.palette.mode === 'dark' 
                        ? '0 2px 8px rgba(0,0,0,0.3)' 
                        : '0 2px 8px rgba(0,0,0,0.2)',
                      transform: 'rotate(-5deg)',
                    }}
                  >
                    BEST DEAL!
                  </Box>
                )}

                {/* Current Plan Ribbon */}
                {isCurrentPlan && !isBestDeal && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      left: -8,
                      zIndex: 10,
                      background: '#9C27B0',
                      color: 'white',
                      padding: '4px 20px',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      boxShadow: theme.palette.mode === 'dark' 
                        ? '0 2px 8px rgba(0,0,0,0.3)' 
                        : '0 2px 8px rgba(0,0,0,0.2)',
                      transform: 'rotate(-12deg)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        right: '-8px',
                        top: 0,
                        bottom: 0,
                        width: '8px',
                        background: '#7B1FA2',
                      }
                    }}
                  >
                    Current Plan
                  </Box>
                )}

                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    background: theme.palette.mode === 'dark' 
                      ? (isCurrentPlan ? 'rgba(33, 33, 33, 0.95)' : 'rgba(40, 40, 40, 0.95)')
                      : (isCurrentPlan ? 'rgba(255, 255, 255, 0.98)' : 'rgba(250, 250, 250, 0.98)'),
                    border: `3px solid transparent`,
                    backgroundImage: `linear-gradient(${theme.palette.mode === 'dark' 
                      ? (isCurrentPlan ? 'rgba(33, 33, 33, 0.95)' : 'rgba(40, 40, 40, 0.95)')
                      : (isCurrentPlan ? 'rgba(255, 255, 255, 0.98)' : 'rgba(250, 250, 250, 0.98)')}, ${
                      theme.palette.mode === 'dark' 
                        ? (isCurrentPlan ? 'rgba(33, 33, 33, 0.95)' : 'rgba(40, 40, 40, 0.95)')
                        : (isCurrentPlan ? 'rgba(255, 255, 255, 0.98)' : 'rgba(250, 250, 250, 0.98)')
                    }), 
                                   linear-gradient(135deg, ${gradient.start}, ${gradient.end})`,
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    overflow: 'visible',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: theme.palette.mode === 'dark'
                        ? `0 16px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px ${gradient.start}40`
                        : `0 16px 32px rgba(0, 0, 0, 0.15), 0 0 0 1px ${gradient.start}40`,
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 4, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      {getPlanIcon(planType)}
                      <Typography 
                        variant="h5" 
                        component="h2" 
                        sx={{ 
                          mt: 2, 
                          fontWeight: 700,
                          color: isBestDeal ? '#FFC107' : (planType === 'BreakoutHost' ? '#E91E63' : '#BA68C8'),
                          fontSize: '1.25rem',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {planName.toUpperCase()}
                      </Typography>
                      
                      <Box sx={{ mt: 2, mb: 1, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.5 }}>
                        <Typography 
                          variant="h6" 
                          component="span"
                          sx={{ 
                            color: gradient.start,
                            fontWeight: 700,
                            fontSize: '1.5rem'
                          }}
                        >
                          ₫
                        </Typography>
                        <Typography 
                          variant="h3" 
                          component="span"
                          sx={{ 
                            color: 'text.primary',
                            fontWeight: 700,
                            fontSize: '2.75rem',
                            lineHeight: 1
                          }}
                        >
                          {new Intl.NumberFormat('vi-VN').format(planPrice)}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          component="span"
                          sx={{ 
                            color: 'text.secondary',
                            ml: 0.5,
                            fontSize: '0.875rem',
                            fontWeight: 400
                          }}
                        >
                          {durationText}
                        </Typography>
                      </Box>
                      
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          mt: 2,
                          lineHeight: 1.6,
                          minHeight: '48px'
                        }}
                      >
                        {planDescription}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2.5, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />

                    <List dense sx={{ flexGrow: 1, mb: 2 }}>
                      {features.map((feature, idx) => (
                        <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircle sx={{ color: gradient.start, fontSize: 18 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={feature}
                            primaryTypographyProps={{
                              variant: 'body2',
                              sx: {
                                color: 'text.primary',
                                fontSize: '0.875rem'
                              }
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>

                    <Box sx={{ mt: 'auto', pt: 2 }}>
                      <Button
                        fullWidth
                        variant={isCurrentPlan ? 'outlined' : 'contained'}
                        size="large"
                        onClick={() => handlePurchase(planType)}
                        disabled={purchasing === planType || purchasing !== null || isCurrentPlan}
                        sx={{
                          py: 1.75,
                          backgroundColor: isCurrentPlan ? 'transparent' : gradient.start,
                          backgroundImage: isCurrentPlan ? 'none' : `linear-gradient(135deg, ${gradient.start}, ${gradient.end})`,
                          borderColor: gradient.start,
                          borderWidth: 2,
                          color: isCurrentPlan ? gradient.start : 'white',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase',
                          borderRadius: '8px',
                          '&:hover': {
                            backgroundImage: isCurrentPlan ? 'none' : `linear-gradient(135deg, ${gradient.end}, ${gradient.start})`,
                            backgroundColor: isCurrentPlan ? `${gradient.start}15` : gradient.end,
                            opacity: 0.95,
                            transform: 'translateY(-2px)',
                            boxShadow: `0 8px 16px ${gradient.start}40`
                          },
                          '&:disabled': {
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                            color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)',
                            borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                            cursor: 'not-allowed'
                          }
                        }}
                      >
                        {purchasing === planType ? (
                          <>
                            <CircularProgress size={18} sx={{ mr: 1, color: 'inherit' }} />
                            Đang xử lý...
                          </>
                        ) : isCurrentPlan ? (
                          'CURRENT PLAN'
                        ) : (
                          'UPGRADE NOW'
                        )}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Box>

        <Paper sx={{ p: 3, mt: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Info sx={{ color: 'primary.main', mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Lưu ý quan trọng
            </Typography>
          </Box>
          <Box component="ul" sx={{ m: 0, pl: 3 }}>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Sau khi thanh toán thành công qua VNPay, gói subscription sẽ được kích hoạt tự động
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Nếu bạn đang có gói subscription đang hoạt động, gói mới sẽ được bắt đầu sau khi gói cũ hết hạn
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Bạn có thể tạo sự kiện ngay sau khi gói subscription được kích hoạt thành công
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Mỗi gói có giới hạn số lượng sự kiện và thời hạn khác nhau, vui lòng chọn gói phù hợp với nhu cầu
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Gói Professional không giới hạn số lượng sự kiện trong 1 năm
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default SubscriptionPlansPage;

