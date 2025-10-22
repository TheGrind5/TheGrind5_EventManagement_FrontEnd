import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { ordersAPI, walletAPI } from '../services/apiClient';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  FormControlLabel,
  Radio,
  RadioGroup,
  Chip,
  Grid,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  AccountBalanceWallet,
  CreditCard,
  Payment,
  CheckCircle,
  Error as ErrorIcon,
  ArrowBack
} from '@mui/icons-material';

const PaymentPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    
    // State management
    const [order, setOrder] = useState(null);
    const [walletBalance, setWalletBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('wallet');
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    
    // Fetch order details and wallet balance
    useEffect(() => {
        // Check authentication first
        if (!authLoading && !user) {
            setError('Bạn cần đăng nhập để truy cập trang này');
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                console.log('=== DEBUG PAYMENT PAGE ===');
                console.log('Fetching order with ID:', orderId);
                console.log('Current token:', localStorage.getItem('token'));
                console.log('Token exists:', !!localStorage.getItem('token'));
                console.log('API URL:', `http://localhost:5000/api/Order/${orderId}`);
                console.log('Current user:', user);
                console.log('User ID from context:', user?.userId);
                console.log('User email from context:', user?.email);
                console.log('Auth loading:', authLoading);
                console.log('================================');
                
                // Fetch order details
                const orderData = await ordersAPI.getById(orderId);
                console.log('Order data received:', orderData);
                console.log('Order data structure:', {
                    data: orderData.data,
                    status: orderData.status,
                    headers: orderData.headers
                });
                
                // Check if orderData has the expected structure
                if (orderData.data) {
                    setOrder(orderData.data);
                } else {
                    setOrder(orderData);
                }
                
                // Fetch wallet balance from real API
                try {
                    const balanceData = await walletAPI.getBalance();
                    console.log('Real wallet balance:', balanceData);
                    const parsedBalance =
                        (balanceData && balanceData.data && typeof balanceData.data.balance === 'number')
                            ? balanceData.data.balance
                            : (typeof balanceData.balance === 'number' ? balanceData.balance : 0);
                    setWalletBalance(parsedBalance);
                } catch (walletError) {
                    console.error('Error fetching wallet balance:', walletError);
                    setWalletBalance(0);
                }
                
                // Check if order is already paid
                if (orderData.status === 'Paid') {
                    setError('Đơn hàng này đã được thanh toán');
                } else if (orderData.status === 'Cancelled') {
                    setError('Đơn hàng này đã bị hủy và không thể thanh toán');
                }
                
            } catch (err) {
                console.error('Error fetching order:', err);
                console.error('Error details:', {
                    message: err.message,
                    status: err.status,
                    response: err.response
                });
                
                // Enhanced error handling with user context
                if (err.message.includes('401') || err.message.includes('Unauthorized')) {
                    setError('Bạn cần đăng nhập để truy cập trang này. Vui lòng đăng nhập trước.');
                } else if (err.message.includes('403') || err.message.includes('Forbid') || err.message.includes('không có quyền')) {
                    setError(`Bạn không có quyền truy cập đơn hàng này. Đơn hàng này thuộc về tài khoản khác. (User hiện tại: ${user?.email || 'Unknown'})`);
                } else if (err.message.includes('404') || err.message.includes('Not Found')) {
                    setError('Không tìm thấy đơn hàng với ID này.');
                } else if (err.message.includes('400') || err.message.includes('Bad Request')) {
                    setError('Dữ liệu yêu cầu không hợp lệ. Vui lòng kiểm tra lại.');
                } else {
                    setError(err.message || 'Không thể tải thông tin đơn hàng');
                }
            } finally {
                setLoading(false);
            }
        };
        
        if (orderId && user) {
            fetchData();
        }
    }, [orderId, user, authLoading]);
    
    // Handle payment processing
    const handlePayment = async () => {
        if (!order) return;
        
        try {
            setProcessing(true);
            setError(null);
            
            if (paymentMethod === 'wallet') {
                // Check wallet balance
                if (walletBalance < order.amount) {
                    setError(`Số dư ví không đủ. Cần ${order.amount.toLocaleString()} VND, hiện có ${walletBalance.toLocaleString()} VND`);
                    return;
                }
                
                // Process wallet payment
                const paymentData = {
                    paymentMethod: 'wallet',
                    transactionId: `WALLET_${Date.now()}`
                };
                
                const result = await ordersAPI.processPayment(orderId, paymentData);
                console.log('Payment result:', result);
                
                // Check if payment was successful (backend returns message: "Thanh toán thành công")
                if (result.message && result.message.includes('Thanh toán thành công')) {
                    console.log('Payment successful, showing popup');
                    // Show success popup
                    setShowSuccessPopup(true);
                    
                    // Redirect to my-tickets page after 3 seconds
                    setTimeout(() => {
                        console.log('Redirecting to my-tickets');
                        navigate('/my-tickets');
                    }, 3000);
                } else {
                    console.log('Payment failed:', result.message);
                    setError(result.message || 'Thanh toán thất bại');
                }
            } else {
                // Other payment methods (to be implemented)
                setError('Phương thức thanh toán này chưa được hỗ trợ');
            }
            
        } catch (err) {
            console.error('Payment error:', err);
            setError(err.message || 'Có lỗi xảy ra khi xử lý thanh toán');
        } finally {
            setProcessing(false);
        }
    };
    
    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };
    
    if (loading) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
                <Header />
                <Container maxWidth="md" sx={{ py: 4 }}>
                    <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                        <Box textAlign="center" py={4}>
                            <CircularProgress size={40} />
                            <Typography variant="body1" sx={{ mt: 2 }}>
                                Đang tải thông tin thanh toán...
                            </Typography>
                        </Box>
                    </Paper>
                </Container>
            </Box>
        );
    }
    
    if (error && !order) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
                <Header />
                <Container maxWidth="md" sx={{ py: 4 }}>
                    <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                        <Alert severity="error" sx={{ mb: 3 }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box display="flex" alignItems="center">
                                    <ErrorIcon sx={{ mr: 1 }} />
                                    <Typography>{error}</Typography>
                                </Box>
                                <Stack direction="row" spacing={1}>
                                    {error.includes('đăng nhập') && (
                                        <Button
                                            variant="contained"
                                            onClick={() => navigate('/login')}
                                        >
                                            Đăng nhập
                                        </Button>
                                    )}
                                    {error.includes('không có quyền') && (
                                        <Button
                                            variant="contained"
                                            color="success"
                                            onClick={() => navigate('/')}
                                        >
                                            Tạo đơn hàng mới
                                        </Button>
                                    )}
                                    {error.includes('Bạn cần đăng nhập để truy cập trang này') && (
                                        <Button
                                            variant="contained"
                                            onClick={() => navigate('/login')}
                                        >
                                            Đăng nhập
                                        </Button>
                                    )}
                                    {error.includes('không có quyền truy cập đơn hàng này') && (
                                        <Button
                                            variant="contained"
                                            color="success"
                                            onClick={() => navigate('/')}
                                        >
                                            Tạo đơn hàng mới
                                        </Button>
                                    )}
                                    <Button
                                        variant="outlined"
                                        onClick={() => {
                                            setError(null);
                                            setLoading(true);
                                            setTimeout(() => {
                                                window.location.reload();
                                            }, 100);
                                        }}
                                    >
                                        Thử lại
                                    </Button>
                                </Stack>
                            </Box>
                        </Alert>
                    </Paper>
                </Container>
            </Box>
        );
    }
    
    if (!order) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
                <Header />
                <Container maxWidth="md" sx={{ py: 4 }}>
                    <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                        <Alert severity="warning">
                            <Typography variant="h6" gutterBottom>
                                ⚠️ Không tìm thấy đơn hàng
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                Đơn hàng không tồn tại hoặc bạn không có quyền truy cập.
                            </Typography>
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/dashboard')}
                            >
                                Quay về Dashboard
                            </Button>
                        </Alert>
                    </Paper>
                </Container>
            </Box>
        );
    }
    
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <Header />
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                    <Typography variant="h3" component="h1" textAlign="center" gutterBottom sx={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 700
                    }}>
                        Thanh Toán
                    </Typography>
                    
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            <Typography>{error}</Typography>
                        </Alert>
                    )}

                    <Stack spacing={3}>
                        {/* Order Summary */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Thông tin đơn hàng
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Sự kiện:
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {order.orderItems?.[0]?.eventTitle || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Loại vé:
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {order.orderItems?.[0]?.ticketTypeName || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Số lượng:
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {order.orderItems?.[0]?.quantity || 1}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Trạng thái:
                                        </Typography>
                                        <Chip 
                                            label={order.status === 'Pending' ? 'Chờ thanh toán' : order.status}
                                            color={order.status === 'Pending' ? 'warning' : 'success'}
                                            size="small"
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Payment Amount */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Tổng thanh toán
                                </Typography>
                                <Box 
                                    sx={{ 
                                        p: 2, 
                                        borderRadius: 2,
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white'
                                    }}
                                >
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="h6">Tổng cộng:</Typography>
                                        <Typography variant="h4" fontWeight="bold">
                                            {formatCurrency(order.amount || order.Amount || 0)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Wallet Balance */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Số dư ví
                                </Typography>
                                <Box 
                                    sx={{ 
                                        p: 2, 
                                        borderRadius: 2,
                                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                        color: 'white'
                                    }}
                                >
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="h6">Số dư hiện tại:</Typography>
                                        <Typography variant="h4" fontWeight="bold">
                                            {formatCurrency(walletBalance)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Payment Method Selection */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Phương thức thanh toán
                                </Typography>
                                <RadioGroup
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                >
                                    <FormControlLabel
                                        value="wallet"
                                        control={<Radio />}
                                        disabled={walletBalance < (order.amount || 0)}
                                        label={
                                            <Box display="flex" alignItems="center">
                                                <AccountBalanceWallet sx={{ mr: 1 }} />
                                                <Box>
                                                    <Typography variant="body1" fontWeight="medium">
                                                        Ví điện tử
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {walletBalance < (order.amount || 0) 
                                                            ? `Số dư không đủ (cần thêm ${formatCurrency((order.amount || 0) - walletBalance)})`
                                                            : 'Số dư khả dụng'
                                                        }
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        }
                                    />
                                    <FormControlLabel
                                        value="card"
                                        control={<Radio />}
                                        label={
                                            <Box display="flex" alignItems="center">
                                                <CreditCard sx={{ mr: 1 }} />
                                                <Box>
                                                    <Typography variant="body1" fontWeight="medium">
                                                        Thẻ tín dụng/ghi nợ
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Thanh toán qua thẻ ngân hàng
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        }
                                    />
                                </RadioGroup>
                            </CardContent>
                        </Card>

                        {/* Payment Actions */}
                        <Box textAlign="center" sx={{ mt: 3 }}>
                            <Stack direction="row" spacing={2} justifyContent="center">
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={processing ? <CircularProgress size={20} /> : <Payment />}
                                    onClick={handlePayment}
                                    disabled={processing || (paymentMethod === 'wallet' && walletBalance < (order.amount || 0))}
                                    sx={{ minWidth: 200 }}
                                >
                                    {processing ? 'Đang xử lý...' : 'Thanh toán ngay'}
                                </Button>
                                
                                <Button
                                    variant="outlined"
                                    size="large"
                                    startIcon={<ArrowBack />}
                                    onClick={() => navigate('/')}
                                    sx={{ minWidth: 150 }}
                                >
                                    Quay lại
                                </Button>
                            </Stack>
                        </Box>

                        {/* Security Notice */}
                        <Box textAlign="center" sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                <CheckCircle sx={{ mr: 0.5, fontSize: 16 }} />
                                Giao dịch được bảo mật và mã hóa SSL
                            </Typography>
                        </Box>
                    </Stack>
                </Paper>
            </Container>
            
            {/* Success Popup */}
            <Dialog
                open={showSuccessPopup}
                onClose={() => setShowSuccessPopup(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        p: 2
                    }
                }}
            >
                <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                        <CheckCircle sx={{ fontSize: 60, color: 'success.main' }} />
                    </Box>
                    <Typography variant="h4" component="h2" color="success.main" fontWeight="bold">
                        🎉 Thanh toán thành công!
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Cảm ơn bạn đã mua vé!
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        Vé của bạn đã được tạo và gửi đến email. Bạn sẽ được chuyển đến trang vé trong giây lát...
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <CircularProgress size={24} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/my-tickets')}
                        sx={{ minWidth: 120 }}
                    >
                        Xem vé ngay
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PaymentPage;
