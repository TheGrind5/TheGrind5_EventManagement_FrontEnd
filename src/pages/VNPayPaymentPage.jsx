import React, { useState, useEffect, useRef } from 'react';
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
  Paper,
  useTheme,
  Divider,
  Chip
} from '@mui/material';
import {
  ArrowBack,
  QrCode,
  CreditCard,
  CheckCircle,
  Cancel,
  AccessTime,
  Info
} from '@mui/icons-material';
import Header from '../components/layout/Header';
import CountdownTimer from '../components/common/CountdownTimer';
import { useAuth } from '../contexts/AuthContext';
import { ordersAPI, paymentAPI } from '../services/apiClient';

const VNPayPaymentPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();

  const [order, setOrder] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, paid, failed, expired
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdownExpired, setCountdownExpired] = useState(false);
  const [pollingCount, setPollingCount] = useState(0);
  
  const pollingIntervalRef = useRef(null);
  const MAX_POLL_COUNT = 100; // Poll tối đa 100 lần (5 phút với 3s interval)

  // Check if timer expired
  const handleTimerExpire = () => {
    setCountdownExpired(true);
    stopPolling();
    setError('Đã hết thời gian thanh toán! Đơn hàng sẽ bị hủy.');
    
    // Cancel payment
    if (paymentId) {
      paymentAPI.cancelPayment(paymentId).catch(err => {
        console.error('Error canceling payment:', err);
      });
    }

    setTimeout(() => {
      navigate('/');
    }, 3000);
  };

  useEffect(() => {
    const initializePayment = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch order details
        let orderData;
        if (location.state?.order) {
          orderData = location.state.order;
          setOrder(orderData);
        } else {
          const orderResponse = await ordersAPI.getById(orderId);
          orderData = orderResponse.data || orderResponse;
          setOrder(orderData);
        }

        // Check if order is already paid
        if (orderData.status === 'Paid') {
          navigate(`/order-confirmation/${orderId}`, { state: { order: orderData } });
          return;
        }

        // Create VNPay payment and get QR code
        try {
          const paymentResponse = await paymentAPI.createVNPayQR(orderId);
          const paymentData = paymentResponse.data || paymentResponse;
          
          setPaymentId(paymentData.paymentId || paymentData.id);
          setQrCodeUrl(paymentData.qrCodeUrl || paymentData.qrCode);
          
          // Start polling for payment status
          startPolling(paymentData.paymentId || paymentData.id);
          
        } catch (paymentError) {
          console.error('Error creating payment:', paymentError);
          setError(paymentError.message || 'Không thể tạo mã QR thanh toán. Vui lòng thử lại.');
        }

      } catch (err) {
        console.error('Error initializing payment:', err);
        setError('Không thể tải thông tin thanh toán. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    if (orderId && user) {
      initializePayment();
    }

    // Cleanup polling on unmount
    return () => {
      stopPolling();
    };
  }, [orderId, user, location.state]);

  const startPolling = (paymentIdToPoll) => {
    // Clear existing interval
    stopPolling();

    // Poll every 3 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const statusResponse = await paymentAPI.getStatus(paymentIdToPoll);
        const statusData = statusResponse.data || statusResponse;
        
        const status = statusData.status || statusData.paymentStatus;
        
        setPollingCount(prev => {
          const newCount = prev + 1;
          
          // Stop if exceeded max poll count
          if (newCount >= MAX_POLL_COUNT) {
            stopPolling();
            setError('Hết thời gian chờ thanh toán. Vui lòng thử lại.');
            return newCount;
          }

          // Check payment status
          if (status === 'paid' || status === 'Paid' || status === 'success') {
            setPaymentStatus('paid');
            stopPolling();
            
            // Redirect to confirmation page after a short delay
            setTimeout(() => {
              navigate(`/order-confirmation/${orderId}`, {
                state: { order: order }
              });
            }, 1500);
          } else if (status === 'failed' || status === 'Failed') {
            setPaymentStatus('failed');
            stopPolling();
            setError('Thanh toán thất bại. Vui lòng thử lại.');
          } else if (status === 'cancelled' || status === 'Cancelled') {
            setPaymentStatus('failed');
            stopPolling();
            setError('Thanh toán đã bị hủy.');
          }
          
          return newCount;
        });

      } catch (err) {
        console.error('Error polling payment status:', err);
        // Don't stop polling on error, just log it
      }
    }, 3000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const handleCancel = async () => {
    try {
      if (paymentId) {
        await paymentAPI.cancelPayment(paymentId);
      }
      stopPolling();
      navigate(`/order-information/${orderId}`);
    } catch (err) {
      console.error('Error canceling payment:', err);
      navigate(`/order-information/${orderId}`);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Calculate countdown duration (10 minutes = 600 seconds)
  const COUNTDOWN_DURATION = 10 * 60;

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
        <Header />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={60} />
            <Typography variant="h6" color="text.secondary">
              Đang tạo mã thanh toán...
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
            Đã hết thời gian thanh toán! Đơn hàng sẽ bị hủy. Đang chuyển về trang chủ...
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
          onClick={handleCancel}
          sx={{ mb: 3 }}
          disabled={paymentStatus === 'paid'}
        >
          Hủy thanh toán
        </Button>

        {/* Countdown Timer */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Hoàn tất thanh toán trong
            </Typography>
          </Box>
          <CountdownTimer duration={COUNTDOWN_DURATION} onExpire={handleTimerExpire} size="large" />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {paymentStatus === 'paid' && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle />
              <Typography>Thanh toán thành công! Đang chuyển đến trang xác nhận...</Typography>
            </Box>
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Left Column: Order Info */}
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
                  Thông tin đơn hàng
                </Typography>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Mã đơn hàng
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      #{order.orderId || order.id}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Sự kiện
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {order.orderItems?.[0]?.eventTitle || 'N/A'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Tổng tiền
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="primary.main">
                      {formatCurrency((order.amount || 0) - (order.discountAmount || 0))}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Trạng thái
                    </Typography>
                    <Chip
                      label={paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                      color={paymentStatus === 'paid' ? 'success' : 'warning'}
                      icon={paymentStatus === 'paid' ? <CheckCircle /> : <AccessTime />}
                      size="small"
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Center Column: QR Code */}
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
                  Quét mã QR để thanh toán
                </Typography>

                {qrCodeUrl ? (
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: 'white',
                      borderRadius: 2,
                      display: 'inline-block',
                      mb: 2
                    }}
                  >
                    <img
                      src={qrCodeUrl}
                      alt="VNPay QR Code"
                      style={{
                        width: '100%',
                        maxWidth: '300px',
                        height: 'auto',
                        display: 'block'
                      }}
                    />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: '300px',
                      height: '300px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      mb: 2
                    }}
                  >
                    <CircularProgress />
                  </Box>
                )}

                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Sử dụng ứng dụng ngân hàng của bạn để quét mã QR
                </Typography>

                {paymentStatus === 'pending' && (
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption" color="text.secondary">
                      Đang chờ thanh toán...
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Payment Guide */}
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Info color="primary" />
                  Hướng dẫn thanh toán
                </Typography>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ minWidth: 24, height: 24, borderRadius: '50%', backgroundColor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem' }}>
                      1
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Mở ứng dụng ngân hàng
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Mở ứng dụng ngân hàng trên điện thoại của bạn
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ minWidth: 24, height: 24, borderRadius: '50%', backgroundColor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem' }}>
                      2
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Quét mã QR
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Chọn tính năng quét QR và quét mã trên màn hình
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ minWidth: 24, height: 24, borderRadius: '50%', backgroundColor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem' }}>
                      3
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Xác nhận thanh toán
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Kiểm tra thông tin và xác nhận thanh toán
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ minWidth: 24, height: 24, borderRadius: '50%', backgroundColor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem' }}>
                      4
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Hoàn tất
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Hệ thống sẽ tự động xác nhận và chuyển đến trang vé
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Alert severity="info" sx={{ mt: 3 }}>
                  <Typography variant="caption">
                    Thanh toán sẽ được xử lý tự động. Vui lòng không đóng trang này cho đến khi thanh toán hoàn tất.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default VNPayPaymentPage;

