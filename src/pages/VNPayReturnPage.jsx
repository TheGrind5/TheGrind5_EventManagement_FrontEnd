import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  ArrowForward
} from '@mui/icons-material';
import Header from '../components/layout/Header';
import { ordersAPI } from '../services/apiClient';

const VNPayReturnPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Parse query parameters from VNPay
        const searchParams = new URLSearchParams(location.search);
        const vnpResponseCode = searchParams.get('vnp_ResponseCode');
        const vnpTxnRef = searchParams.get('vnp_TxnRef');
        
        // Extract order ID from TxnRef (format: ORDER_{OrderId}_{Timestamp})
        if (vnpTxnRef && vnpTxnRef.startsWith('ORDER_')) {
          const parts = vnpTxnRef.split('_');
          if (parts.length >= 2) {
            const extractedOrderId = parseInt(parts[1]);
            setOrderId(extractedOrderId);
          }
        }

        // Check payment status based on VNPay response code
        // ResponseCode "00" means success
        if (vnpResponseCode === '00') {
          setStatus('success');
          setMessage('Thanh toán thành công! Đơn hàng của bạn đã được xử lý.');
          
          // Wait a bit for webhook to process, then fetch order
          setTimeout(async () => {
            if (orderId) {
              try {
                const orderResponse = await ordersAPI.getById(orderId);
                const orderData = orderResponse.data || orderResponse;
                
                // Navigate to order confirmation after 2 seconds
                setTimeout(() => {
                  navigate(`/order-confirmation/${orderId}`, {
                    state: { order: orderData }
                  });
                }, 2000);
              } catch (err) {
                console.error('Error fetching order:', err);
              }
            }
          }, 1500);
        } else {
          setStatus('failed');
          setMessage('Thanh toán thất bại. Vui lòng thử lại.');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setStatus('error');
        setMessage('Có lỗi xảy ra khi xử lý thanh toán. Vui lòng kiểm tra lại.');
      }
    };

    checkPaymentStatus();
  }, [location.search, navigate, orderId]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleViewOrder = () => {
    if (orderId) {
      navigate(`/order-confirmation/${orderId}`);
    }
  };

  return (
    <>
      <Header />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            {status === 'loading' && (
              <>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h5" component="h1" gutterBottom>
                  Đang xử lý thanh toán...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Vui lòng đợi trong giây lát
                </Typography>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" component="h1" gutterBottom color="success.main">
                  Thanh toán thành công!
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {message}
                </Typography>
                {orderId && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Mã đơn hàng: #{orderId}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    endIcon={<ArrowForward />}
                    onClick={handleViewOrder}
                  >
                    Xem đơn hàng
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleGoHome}
                  >
                    Về trang chủ
                  </Button>
                </Box>
              </>
            )}

            {status === 'failed' && (
              <>
                <Cancel sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
                <Typography variant="h5" component="h1" gutterBottom color="error.main">
                  Thanh toán thất bại
                </Typography>
                <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                  {message}
                </Alert>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleGoHome}
                  >
                    Về trang chủ
                  </Button>
                </Box>
              </>
            )}

            {status === 'error' && (
              <>
                <Alert severity="warning" sx={{ mb: 3 }}>
                  {message}
                </Alert>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleGoHome}
                  >
                    Về trang chủ
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default VNPayReturnPage;

