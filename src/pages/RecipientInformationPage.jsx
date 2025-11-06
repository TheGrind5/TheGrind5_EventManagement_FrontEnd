import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Box,
  TextField,
  Paper,
  useTheme
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Person,
  Phone,
  Email,
  LocationOn
} from '@mui/icons-material';
import Header from '../components/layout/Header';
import OrderSummaryCard from '../components/common/OrderSummaryCard';
import CountdownTimer from '../components/common/CountdownTimer';
import { useAuth } from '../contexts/AuthContext';
import { ordersAPI } from '../services/apiClient';
import { isValidPhone, isValidEmail } from '../utils/validators';

const RecipientInformationPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [countdownExpired, setCountdownExpired] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientPhone: '',
    recipientEmail: '',
    recipientAddress: ''
  });

  const [formErrors, setFormErrors] = useState({});

  // Check if timer expired
  const handleTimerExpire = () => {
    setCountdownExpired(true);
    setError('Đã hết thời gian! Đơn hàng sẽ bị hủy.');
    setTimeout(() => {
      navigate('/');
    }, 3000);
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get order from location state or fetch from API
        if (location.state?.order) {
          setOrder(location.state.order);
        } else {
          const orderResponse = await ordersAPI.getById(orderId);
          const orderData = orderResponse.data || orderResponse;
          setOrder(orderData);
        }

        // Pre-fill form từ user profile
        if (user) {
          setFormData({
            recipientName: user.fullName || user.name || '',
            recipientPhone: user.phone || '',
            recipientEmail: user.email || '',
            recipientAddress: user.address || ''
          });
        }

      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    if (orderId && user) {
      fetchOrder();
    }
  }, [orderId, user, location.state]);

  const validateForm = () => {
    const errors = {};

    // Validate recipient name
    if (!formData.recipientName.trim()) {
      errors.recipientName = 'Vui lòng nhập tên người nhận';
    } else if (formData.recipientName.trim().length < 2) {
      errors.recipientName = 'Tên phải có ít nhất 2 ký tự';
    }

    // Validate phone
    if (!formData.recipientPhone.trim()) {
      errors.recipientPhone = 'Vui lòng nhập số điện thoại';
    } else if (!isValidPhone(formData.recipientPhone)) {
      errors.recipientPhone = 'Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng (VD: 0912345678)';
    }

    // Validate email
    if (!formData.recipientEmail.trim()) {
      errors.recipientEmail = 'Vui lòng nhập email';
    } else if (!isValidEmail(formData.recipientEmail)) {
      errors.recipientEmail = 'Email không hợp lệ';
    }

    // Address is optional, no validation needed

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      setError('Vui lòng kiểm tra lại thông tin đã nhập');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Update order with recipient information
      const updateData = {
        recipientName: formData.recipientName.trim(),
        recipientPhone: formData.recipientPhone.trim(),
        recipientEmail: formData.recipientEmail.trim(),
        recipientAddress: formData.recipientAddress.trim() || null
      };

      await ordersAPI.update(orderId, updateData);

      // Get payment method from location state
      const paymentMethod = location.state?.paymentMethod || 'vnpay';

      // Navigate to payment page based on payment method
      if (paymentMethod === 'vnpay') {
        navigate(`/payment/vnpay/${orderId}`);
      } else {
        // For wallet payment, go to existing payment page
        navigate(`/payment/${orderId}`);
      }

    } catch (err) {
      console.error('Error updating order:', err);
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      setSubmitting(false);
    }
  };

  // Calculate countdown duration (15 minutes = 900 seconds)
  const COUNTDOWN_DURATION = 15 * 60;

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
        <Header />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={60} />
            <Typography variant="h6" color="text.secondary">
              Đang tải thông tin...
            </Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  if (countdownExpired) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
        <Header />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="warning">
            Đã hết thời gian! Đơn hàng sẽ bị hủy. Đang chuyển về trang chủ...
          </Alert>
        </Container>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
        <Header />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">
            Không tìm thấy đơn hàng. Vui lòng thử lại.
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Header />

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        {/* Back Button */}
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/order-information/${orderId}`)}
          sx={{ mb: 3 }}
        >
          Quay lại
        </Button>

        {/* Countdown Timer */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Hoàn tất đặt vé trong
            </Typography>
          </Box>
          <CountdownTimer duration={COUNTDOWN_DURATION} onExpire={handleTimerExpire} size="large" />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Left Column: Form */}
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
                  Thông tin người nhận vé
                </Typography>

                <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {/* Recipient Name */}
                  <TextField
                    name="recipientName"
                    label="Họ và tên người nhận"
                    value={formData.recipientName}
                    onChange={handleInputChange}
                    error={!!formErrors.recipientName}
                    helperText={formErrors.recipientName}
                    required
                    fullWidth
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />

                  {/* Phone */}
                  <TextField
                    name="recipientPhone"
                    label="Số điện thoại"
                    value={formData.recipientPhone}
                    onChange={handleInputChange}
                    error={!!formErrors.recipientPhone}
                    helperText={formErrors.recipientPhone || 'VD: 0912345678'}
                    required
                    fullWidth
                    InputProps={{
                      startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />

                  {/* Email */}
                  <TextField
                    name="recipientEmail"
                    label="Email"
                    type="email"
                    value={formData.recipientEmail}
                    onChange={handleInputChange}
                    error={!!formErrors.recipientEmail}
                    helperText={formErrors.recipientEmail}
                    required
                    fullWidth
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />

                  {/* Address (Optional) */}
                  <TextField
                    name="recipientAddress"
                    label="Địa chỉ nhận vé (tùy chọn)"
                    value={formData.recipientAddress}
                    onChange={handleInputChange}
                    error={!!formErrors.recipientAddress}
                    helperText={formErrors.recipientAddress || 'Chỉ cần điền nếu nhận vé vật lý'}
                    fullWidth
                    multiline
                    rows={3}
                    InputProps={{
                      startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary', alignSelf: 'flex-start', mt: 1 }} />
                    }}
                  />

                  {/* Continue Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={submitting}
                    onClick={handleContinue}
                    sx={{
                      mt: 2,
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      borderRadius: 2,
                      boxShadow: 'none',
                      '&:hover': {
                        boxShadow: `0 8px 24px rgba(61, 190, 41, 0.35)`,
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                    startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
                  >
                    {submitting ? 'Đang xử lý...' : 'Tiếp tục thanh toán ›'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Order Summary */}
          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'sticky', top: 80 }}>
              <OrderSummaryCard
                orderItems={order.orderItems || []}
                orderProducts={order.orderProducts || []}
                subtotal={order.subTotalAmount || 0} // Giá gốc trước giảm
                discount={order.discountAmount || 0}
                total={order.amount || 0} // Giá cuối cùng sau giảm
              />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default RecipientInformationPage;

