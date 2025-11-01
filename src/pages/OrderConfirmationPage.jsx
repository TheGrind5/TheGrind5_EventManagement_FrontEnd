import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  CheckCircle,
  Celebration,
  Receipt,
  CreditCard,
  ConfirmationNumber,
  Download,
  Share,
  Home,
  Dashboard,
  Event,
  AccessTime,
  Email,
  ArrowBack
} from '@mui/icons-material';
import Header from '../components/layout/Header';
import { ordersAPI, ticketsAPI } from '../services/apiClient';
import { decodeText } from '../utils/textDecoder';

const OrderConfirmationPage = () => {
    const { orderId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
  const theme = useTheme();
    
    const [order, setOrder] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  const [pollingCount, setPollingCount] = useState(0);
    
    // Get data from navigation state or fetch from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Try to get data from navigation state first
        let orderData;
                if (location.state?.order) {
          orderData = location.state.order;
          setOrder(orderData);
                } else {
                    // Fetch order details from API
          const response = await ordersAPI.getById(orderId);
          orderData = response.data || response;
                    setOrder(orderData);
                }
                
                // Fetch tickets for this order
        await fetchTickets();
                
            } catch (err) {
                console.error('Error fetching data:', err);
                
                let errorMessage = 'Không thể tải thông tin đơn hàng';
                let errorCode = 500;
                
                if (err.success === false) {
                    errorMessage = err.message || errorMessage;
                    errorCode = err.code || 500;
        } else if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                    errorCode = err.response.status;
        } else if (err.data?.message) {
                    errorMessage = err.data.message;
        } else if (err.message) {
                    errorMessage = err.message;
                }
                
                if (errorCode === 404) {
                    errorMessage = 'Không tìm thấy đơn hàng. Có thể đơn hàng đã bị xóa hoặc không tồn tại.';
                } else if (errorCode === 401) {
                    errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
                } else if (errorCode === 0) {
                    errorMessage = 'Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.';
                }
                
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };
        
        if (orderId) {
            fetchData();
        }
    }, [orderId, location.state]);
  
  // Poll for tickets if order is paid but tickets not yet created
  useEffect(() => {
    if (!order || order.status !== 'Paid' || tickets.length > 0 || pollingCount >= 5) {
      return;
    }
    
    const interval = setInterval(async () => {
      setPollingCount(prev => prev + 1);
      await fetchTickets();
    }, 3000); // Poll every 3 seconds
    
    return () => clearInterval(interval);
  }, [order, tickets.length, pollingCount]);
  
  const fetchTickets = async () => {
    try {
      const ticketsData = await ticketsAPI.getTicketsByOrder(orderId);
      const ticketsList = ticketsData.tickets || ticketsData.data || ticketsData;
      if (Array.isArray(ticketsList) && ticketsList.length > 0) {
        setTickets(ticketsList);
      }
    } catch (ticketError) {
      console.warn('Could not fetch tickets:', ticketError);
      // Tickets might not be created yet, that's okay
    }
  };
    
    // Format currency
    const formatCurrency = (amount) => {
    if (!amount) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };
    
    // Format date
    const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
  
  // Get order timeline steps
  const getOrderSteps = () => {
    const steps = [
      { label: 'Đặt vé', completed: true, description: 'Đơn hàng đã được tạo' },
      { label: 'Thanh toán', completed: order?.status === 'Paid', description: order?.status === 'Paid' ? 'Đã thanh toán thành công' : 'Chờ thanh toán' },
      { label: 'Phát hành vé', completed: tickets.length > 0, description: tickets.length > 0 ? `Đã phát hành ${tickets.length} vé` : 'Đang xử lý...' },
      { label: 'Hoàn tất', completed: tickets.length > 0 && order?.status === 'Paid', description: 'Đơn hàng hoàn tất' }
    ];
    return steps;
  };
  
  const handleDownloadTicket = (ticket) => {
    // TODO: Implement download ticket as PDF/image
    console.log('Download ticket:', ticket);
    alert('Tính năng tải vé sẽ được triển khai sớm!');
  };
  
  const handleShareTicket = (ticket) => {
    // TODO: Implement share ticket
    if (navigator.share) {
      navigator.share({
        title: `Vé ${ticket.serialNumber}`,
        text: `Mã vé của tôi: ${ticket.serialNumber}`,
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(ticket.serialNumber);
      alert('Đã sao chép mã vé vào clipboard!');
    }
  };
    
    if (loading) {
        return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
                <Header />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={60} />
            <Typography variant="h6" color="text.secondary">
              Đang tải thông tin xác nhận...
            </Typography>
          </Box>
        </Container>
      </Box>
        );
    }
    
    if (error || !order) {
        return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
                <Header />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Card>
            <CardContent>
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>❌ Lỗi</Typography>
                <Typography>{error || 'Không tìm thấy thông tin đơn hàng'}</Typography>
              </Alert>
              <Button
                variant="outlined"
                startIcon={<Dashboard />}
                                onClick={() => navigate('/dashboard')}
                            >
                                Quay về Dashboard
              </Button>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }
  
  const orderSteps = getOrderSteps();
  const activeStep = orderSteps.findIndex(step => !step.completed);
  const isOrderPaid = order.status === 'Paid';
  
  // Get order items
  const orderItems = order.orderItems || [];
  const firstOrderItem = orderItems[0] || {};
  const eventTitle = decodeText(firstOrderItem.eventTitle || firstOrderItem.Event?.Title || order.event?.title || 'N/A');
    
    return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <Header />
      
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        {/* Back Button */}
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard')}
          sx={{ mb: 3 }}
        >
          Quay lại
        </Button>
        
                    {/* Success Header */}
        <Card 
          elevation={0}
          sx={{
            mb: 4,
            background: 'linear-gradient(135deg, rgba(255, 122, 0, 0.1) 0%, rgba(255, 138, 0, 0.1) 100%)',
            border: `2px solid ${theme.palette.success.main}`,
            borderRadius: 3
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulse 2s infinite'
                }}
              >
                <Celebration sx={{ fontSize: 50, color: 'white' }} />
              </Box>
            </Box>
            <Typography variant="h3" component="h1" fontWeight={700} gutterBottom color="success.main">
              🎉 Thanh toán thành công!
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Đơn hàng của bạn đã được xử lý thành công. {tickets.length > 0 ? 'Vé đã được tạo và gửi đến tài khoản của bạn.' : 'Vé đang được xử lý và sẽ sớm có trong tài khoản của bạn.'}
            </Typography>
          </CardContent>
        </Card>
        
        <Grid container spacing={3}>
          {/* Left Column: Order Timeline & Details */}
          <Grid item xs={12} md={8}>
            {/* Order Timeline */}
            <Card elevation={0} sx={{ mb: 3, border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
                  <AccessTime sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Trạng thái đơn hàng
                </Typography>
                <Stepper activeStep={activeStep} orientation="vertical">
                  {orderSteps.map((step, index) => (
                    <Step key={step.label} completed={step.completed}>
                      <StepLabel
                        StepIconComponent={() => (
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              bgcolor: step.completed ? 'success.main' : 'grey.300',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          >
                            {step.completed ? <CheckCircle /> : index + 1}
                          </Box>
                        )}
                      >
                        <Typography variant="subtitle1" fontWeight={600}>
                          {step.label}
                        </Typography>
                      </StepLabel>
                      <StepContent>
                        <Typography variant="body2" color="text.secondary">
                          {step.description}
                        </Typography>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              </CardContent>
            </Card>
                    
                    {/* Order Summary */}
            <Card elevation={0} sx={{ mb: 3, border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Receipt sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" fontWeight={700}>
                    Thông tin đơn hàng
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Mã đơn hàng
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      #{order.orderId || order.OrderId}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Ngày tạo
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {formatDate(order.createdAt || order.CreatedAt)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Sự kiện
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {eventTitle}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Tổng tiền
                    </Typography>
                    <Typography variant="h6" color="primary.main" fontWeight={700}>
                      {formatCurrency(order.amount || order.Amount || 0)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Trạng thái
                    </Typography>
                    <Chip
                      label={isOrderPaid ? 'Đã thanh toán' : order.status}
                      color={isOrderPaid ? 'success' : 'warning'}
                      icon={isOrderPaid ? <CheckCircle /> : <AccessTime />}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
                    
                    {/* Payment Information */}
                    {location.state?.paymentResult && (
              <Card elevation={0} sx={{ mb: 3, border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CreditCard sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight={700}>
                      Thông tin thanh toán
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Phương thức
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                                        {location.state.paymentMethod === 'wallet' ? 'Ví điện tử' : location.state.paymentMethod}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Mã giao dịch
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {location.state.paymentResult.walletTransactionId || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Grid>
          
          {/* Right Column: Tickets */}
          <Grid item xs={12} md={4}>
            <Card 
              elevation={0}
              sx={{
                position: 'sticky',
                top: 80,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <ConfirmationNumber sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" fontWeight={700}>
                    Vé của bạn
                  </Typography>
                </Box>
                
                    {tickets.length > 0 ? (
                  <Stack spacing={2}>
                    {tickets.map((ticket, index) => {
                      const ticketType = ticket.ticketType || ticket.TicketType || {};
                      const serialNumber = ticket.serialNumber || ticket.SerialNumber || 'N/A';
                      const ticketTypeName = ticketType.typeName || ticketType.TypeName || 'N/A';
                      
                      return (
                        <Paper
                          key={ticket.ticketId || ticket.TicketId || index}
                          elevation={2}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: `2px solid ${theme.palette.primary.main}`,
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              width: 40,
                              height: 40,
                              bgcolor: 'success.main',
                              borderRadius: '0 0 0 40px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <CheckCircle sx={{ color: 'white', fontSize: 20 }} />
                          </Box>
                          
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Vé #{index + 1}
                          </Typography>
                          <Typography variant="h6" fontWeight={700} gutterBottom>
                            {serialNumber}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Loại: {decodeText(ticketTypeName)}
                          </Typography>
                          
                          <Chip
                            label="Có thể sử dụng"
                            color="success"
                            size="small"
                            sx={{ mt: 1 }}
                          />
                          
                          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            <Tooltip title="Tải vé">
                              <IconButton
                                size="small"
                                onClick={() => handleDownloadTicket(ticket)}
                                sx={{ border: `1px solid ${theme.palette.divider}` }}
                              >
                                <Download fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Chia sẻ">
                              <IconButton
                                size="small"
                                onClick={() => handleShareTicket(ticket)}
                                sx={{ border: `1px solid ${theme.palette.divider}` }}
                              >
                                <Share fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Paper>
                      );
                    })}
                  </Stack>
                ) : (
                  <Alert severity="info" icon={<Email />}>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Vé đang được tạo
                    </Typography>
                    <Typography variant="body2">
                      Bạn sẽ nhận được thông báo khi vé sẵn sàng. Thông thường vé sẽ được tạo trong vòng vài phút.
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
                    
                    {/* Next Steps */}
        <Card elevation={0} sx={{ mt: 3, border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              📝 Bước tiếp theo
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: 'primary.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    <Email sx={{ color: 'primary.main' }} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Kiểm tra email
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Chúng tôi đã gửi thông tin đơn hàng đến email của bạn
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: 'success.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    <ConfirmationNumber sx={{ color: 'success.main' }} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Xem vé của bạn
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vé đã được lưu trong tài khoản của bạn
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: 'warning.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    <Event sx={{ color: 'warning.main' }} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Tham gia sự kiện
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Mang vé đến sự kiện để check-in
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
                    
                    {/* Action Buttons */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4, justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<ConfirmationNumber />}
                            onClick={() => navigate('/my-tickets')}
            sx={{ minWidth: 200 }}
                        >
                            Xem vé của tôi
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<Dashboard />}
                            onClick={() => navigate('/dashboard')}
            sx={{ minWidth: 200 }}
                        >
                            Về Dashboard
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<Home />}
                            onClick={() => navigate('/')}
            sx={{ minWidth: 200 }}
                        >
                            Xem sự kiện khác
          </Button>
        </Stack>
      </Container>
      
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.9;
            }
          }
        `}
      </style>
    </Box>
    );
};

export default OrderConfirmationPage;