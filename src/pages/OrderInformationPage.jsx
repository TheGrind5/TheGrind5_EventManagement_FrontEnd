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
  Paper,
  useTheme,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  IconButton,
  Stack
} from '@mui/material';
import {
  AccessTime,
  ArrowBack,
  CheckCircle
} from '@mui/icons-material';
import Header from '../components/layout/Header';
import QuestionnaireForm from '../components/common/QuestionnaireForm';
import OrderSummaryCard from '../components/common/OrderSummaryCard';
import CountdownTimer from '../components/common/CountdownTimer';
import { useAuth } from '../contexts/AuthContext';
import { ordersAPI, eventQuestionsAPI } from '../services/apiClient';

const OrderInformationPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();

  const [order, setOrder] = useState(null);
  const [eventQuestions, setEventQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [countdownExpired, setCountdownExpired] = useState(false);

  // Check if timer expired
  const handleTimerExpire = () => {
    setCountdownExpired(true);
    setError('Đã hết thời gian! Đơn hàng sẽ bị hủy.');
    setTimeout(() => {
      navigate('/');
    }, 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch order details
        const orderResponse = await ordersAPI.getById(orderId);
        const orderData = orderResponse.data || orderResponse;
        setOrder(orderData);

        // Fetch event questions if order has event
        if (orderData.eventId) {
          try {
            const questionsResponse = await eventQuestionsAPI.getByEventId(orderData.eventId);
            const questions = questionsResponse.data || [];
            setEventQuestions(questions);
            console.log('Event questions:', questions);
          } catch (questionError) {
            console.log('No questions for this event:', questionError);
            setEventQuestions([]);
          }
        }

      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    if (orderId && user) {
      fetchData();
    }
  }, [orderId, user]);

  const handleContinue = async () => {
    // Validate if has questions
    if (eventQuestions.length > 0) {
      const requiredQuestions = eventQuestions.filter(q => q.isRequired);
      const unansweredRequired = requiredQuestions.filter(q => !answers[q.questionId]);

      if (unansweredRequired.length > 0) {
        setError('Vui lòng trả lời tất cả các câu hỏi bắt buộc');
        return;
      }
    }

    try {
      setSubmitting(true);

      // Update order with answers if has questions
      if (eventQuestions.length > 0 && Object.keys(answers).length > 0) {
        const orderAnswersJSON = JSON.stringify(answers);
        await ordersAPI.update(orderId, { OrderAnswers: orderAnswersJSON });
      }

      // Navigate to recipient info page
      navigate(`/recipient-info/${orderId}`, {
        state: {
          order: order,
          paymentMethod: paymentMethod
        }
      });

    } catch (err) {
      console.error('Error updating order:', err);
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
      setSubmitting(false);
    }
  };

  const handleAnswersChange = (newAnswers) => {
    setAnswers(newAnswers);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate countdown duration (15 minutes = 900 seconds)
  const COUNTDOWN_DURATION = 15 * 60;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Header />

      {loading && (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={60} />
            <Typography variant="h6" color="text.secondary">
              Đang tải thông tin...
            </Typography>
          </Box>
        </Container>
      )}

      {error && !loading && (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      )}

      {countdownExpired && (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="warning">
            Đã hết thời gian! Đơn hàng sẽ bị hủy. Đang chuyển về trang chủ...
          </Alert>
        </Container>
      )}

      {!loading && !error && !countdownExpired && order && (
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
          {/* Back Button */}
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/event/${order.eventId}`)}
            sx={{ mb: 3 }}
          >
            Chọn lại vé
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

          <Grid container spacing={3}>
            {/* Left Column: Questions OR Payment Methods */}
            <Grid item xs={12} md={6}>
              {eventQuestions.length > 0 ? (
                // Show Questionnaire if has questions
                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <QuestionnaireForm
                      questions={eventQuestions}
                      onAnswersChange={handleAnswersChange}
                      initialAnswers={answers}
                    />
                  </CardContent>
                </Card>
              ) : (
                // Show Payment Method Selection if no questions
                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Phương thức thanh toán
                    </Typography>
                    <FormControl component="fieldset" sx={{ mt: 2 }}>
                      <RadioGroup
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <FormControlLabel
                          value="wallet"
                          control={<Radio />}
                          label={
                            <Box>
                              <Typography fontWeight={600}>Ví điện tử</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Thanh toán bằng ví của bạn
                              </Typography>
                            </Box>
                          }
                        />
                        <FormControlLabel
                          value="vnpay"
                          control={<Radio />}
                          label={
                            <Box>
                              <Typography fontWeight={600}>VNPay / Ứng dụng ngân hàng</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Thanh toán qua VNPay QR
                              </Typography>
                            </Box>
                          }
                        />
                      </RadioGroup>
                    </FormControl>
                  </CardContent>
                </Card>
              )}
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

                {/* Action Buttons */}
                <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                  <Button
                    variant="outlined"
                    size="large"
                    disabled={submitting}
                    onClick={async () => {
                      // Cập nhật order status thành "Failed" khi người dùng quay lại
                      try {
                        await ordersAPI.updateStatus(orderId, 'Failed');
                      } catch (statusError) {
                        console.error('Error updating order status to Failed:', statusError);
                      }
                      // Quay về trang chọn vé và phụ kiện
                      navigate(`/ticket-selection/${order.eventId}`);
                    }}
                    sx={{
                      flex: 1,
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      borderRadius: 2,
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      '&:hover': {
                        borderColor: 'primary.dark',
                        backgroundColor: 'primary.light',
                        opacity: 0.8
                      },
                      transition: 'all 0.3s ease'
                    }}
                    startIcon={<ArrowBack />}
                  >
                    Quay lại
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    disabled={submitting}
                    onClick={handleContinue}
                    sx={{
                      flex: 1,
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
                    {submitting ? 'Đang xử lý...' : 'Tiếp tục ›'}
                  </Button>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Container>
      )}
    </Box>
  );
};

export default OrderInformationPage;

