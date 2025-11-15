import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Stack,
  Chip,
  Paper,
  IconButton,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Divider
} from '@mui/material';
import { 
  Close, 
  AccountBalanceWallet, 
  CreditCard,
  QrCodeScanner,
  Payments
} from '@mui/icons-material';
import { walletAPI, paymentAPI } from '../../services/apiClient';

const DepositModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    amount: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [payOSPayment, setPayOSPayment] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Chỉ hỗ trợ nạp tiền qua PayOS
      const response = await paymentAPI.createPayOSTopUp({
        amount: parseFloat(formData.amount),
        description: formData.description || 'Nạp tiền qua PayOS'
      });

      // Lưu thông tin PayOS payment
      const paymentData = response.data?.payment;
      setPayOSPayment(paymentData);
      
      // Auto redirect to PayOS checkout page ngay lập tức
      const checkoutUrl = paymentData?.CheckoutUrl || paymentData?.checkoutUrl || paymentData?.PaymentUrl;
      if (checkoutUrl) {
        // Redirect ngay lập tức đến trang thanh toán PayOS
        window.location.href = checkoutUrl;
        return; // Dừng lại, không cần setLoading(false) vì đã redirect
      } else {
        setError('Không thể lấy được link thanh toán PayOS. Vui lòng thử lại.');
      }
      
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tạo yêu cầu nạp tiền');
      console.error('Error creating PayOS topup:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayOSComplete = () => {
    // Sau khi thanh toán PayOS thành công, refresh balance
    window.location.reload(); // Simple refresh để cập nhật balance
  };

  const handlePayOSRedirect = () => {
    if (payOSPayment?.CheckoutUrl) {
      window.open(payOSPayment.CheckoutUrl, '_blank');
    }
  };

  const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

  return (
    <Dialog 
      open={true} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccountBalanceWallet color="success" />
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Nạp tiền vào ví
        </Typography>
        <IconButton 
          onClick={onClose} 
          sx={{ ml: 'auto' }}
          size="small"
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          {/* PayOS Header */}
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <CreditCard sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Nạp tiền qua PayOS
            </Typography>
            <Typography variant="body2" color="text.secondary">
              An toàn - Nhanh chóng - Bảo mật
            </Typography>
          </Box>

          <TextField
            fullWidth
            label="Số tiền nạp (VND)"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="Nhập số tiền..."
            inputProps={{ min: 1000, step: 1000 }}
            required
            sx={{ mb: 2 }}
          />
          
          {/* Quick Amount Buttons */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Chọn nhanh:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {quickAmounts.map(amount => (
                <Chip
                  key={amount}
                  label={`${amount.toLocaleString('vi-VN')}₫`}
                  onClick={() => setFormData(prev => ({ ...prev, amount: amount.toString() }))}
                  variant="outlined"
                  clickable
                  size="small"
                />
              ))}
            </Stack>
          </Box>

          <TextField
            fullWidth
            label="Ghi chú (tùy chọn)"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Ví dụ: Nạp tiền từ thẻ tín dụng..."
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* PayOS Info */}
          <Paper sx={{ p: 2, bgcolor: 'info.light', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              💳 Thông tin PayOS
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Thanh toán qua PayOS, an toàn và bảo mật<br/>
              • Hỗ trợ nhiều phương thức: Thẻ tín dụng, QR code, ví điện tử<br/>
              • Số dư được cập nhật ngay sau khi thanh toán thành công<br/>
              • Phí giao dịch: 0% (khuyến mãi)
            </Typography>
          </Paper>

          {/* PayOS Payment Info */}
          {payOSPayment && (
            <Paper sx={{ p: 2, bgcolor: 'success.light', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                🎉 Đã tạo yêu cầu thanh toán PayOS!
              </Typography>
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Mã đơn hàng:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {payOSPayment.orderCode}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Số tiền:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {parseFloat(formData.amount).toLocaleString('vi-VN')}₫
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Hạn thanh toán:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(payOSPayment.expiredAt).toLocaleString('vi-VN')}
                  </Typography>
                </Box>

                {payOSPayment.qrCodeUrl && (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      Quét mã QR để thanh toán:
                    </Typography>
                    <img 
                      src={payOSPayment.qrCodeUrl} 
                      alt="PayOS QR Code" 
                      style={{ maxWidth: '200px', height: 'auto' }}
                    />
                  </Box>
                )}

                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<QrCodeScanner />}
                    onClick={handlePayOSRedirect}
                    fullWidth
                  >
                    Mở trang thanh toán
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handlePayOSComplete}
                    fullWidth
                  >
                    Đã thanh toán
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
        >
          Hủy
        </Button>
        {!payOSPayment && (
          <Button
            onClick={handleSubmit}
            disabled={loading}
            variant="contained"
            color="success"
            startIcon={loading ? <CircularProgress size={16} /> : <Payments />}
          >
            {loading ? 'Đang xử lý...' : 'Tạo thanh toán PayOS'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DepositModal;
