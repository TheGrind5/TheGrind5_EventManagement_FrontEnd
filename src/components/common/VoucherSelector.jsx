import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip,
  Alert,
  Collapse
} from '@mui/material';
import { 
  LocalOffer as VoucherIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { voucherAPI } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';

const VoucherSelector = ({ 
  originalAmount, 
  onVoucherApplied, 
  appliedVoucher, 
  onRemoveVoucher 
}) => {
  const { user } = useAuth(); // Lấy user từ AuthContext
  const [voucherCode, setVoucherCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showVoucherForm, setShowVoucherForm] = useState(false);

  const handleApplyVoucher = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation(); // Ngăn submit form cha
    }
    
    if (!voucherCode.trim()) {
      setError('Vui lòng nhập mã voucher');
      return;
    }

    if (!originalAmount || originalAmount <= 0) {
      setError('Số tiền không hợp lệ');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Lấy userId từ user object (nếu user đã đăng nhập)
      // Kiểm tra nhiều cách để lấy userId vì có thể là camelCase hoặc PascalCase
      const userId = user?.userId || user?.UserId || user?.user?.userId || user?.user?.UserId || null;
      console.log('[VoucherSelector] Validating voucher:', { 
        voucherCode: voucherCode.trim(), 
        originalAmount, 
        userId, 
        user,
        userKeys: user ? Object.keys(user) : null
      });
      
      // Nếu userId vẫn null, thử lấy từ localStorage
      let finalUserId = userId;
      if (!finalUserId) {
        try {
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            finalUserId = parsedUser?.userId || parsedUser?.UserId || null;
            console.log('[VoucherSelector] Got userId from localStorage:', finalUserId);
          }
        } catch (e) {
          console.error('[VoucherSelector] Error parsing saved user:', e);
        }
      }
      
      const response = await voucherAPI.validate(voucherCode.trim(), originalAmount, finalUserId);
      
      // Handle both response formats
      const responseData = response.data?.data || response.data;
      
      if (responseData?.isValid) {
        setSuccess('Áp dụng voucher thành công!');
        onVoucherApplied(responseData);
        setVoucherCode('');
        setShowVoucherForm(false);
      } else {
        setError(responseData?.message || 'Voucher không hợp lệ');
      }
    } catch (error) {
      console.error('Error applying voucher:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Có lỗi xảy ra khi áp dụng voucher';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    onRemoveVoucher();
    setError('');
    setSuccess('');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <VoucherIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" component="h3">
            Mã giảm giá
          </Typography>
        </Box>

        {appliedVoucher ? (
          <Box>
            <Alert 
              severity="success" 
              action={
                <Button 
                  size="small" 
                  onClick={handleRemoveVoucher}
                  startIcon={<CloseIcon />}
                >
                  Xóa
                </Button>
              }
            >
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  Voucher: {appliedVoucher.voucherCode}
                </Typography>
                <Typography variant="body2">
                  Giảm {appliedVoucher.discountPercentage}% - 
                  Tiết kiệm: {formatCurrency(appliedVoucher.discountAmount)}
                </Typography>
                <Typography variant="body2" color="success.main" fontWeight="bold">
                  Còn lại: {formatCurrency(appliedVoucher.finalAmount)}
                </Typography>
              </Box>
            </Alert>
          </Box>
        ) : (
          <Box>
            {!showVoucherForm ? (
              <Button 
                variant="outlined" 
                onClick={() => setShowVoucherForm(true)}
                startIcon={<VoucherIcon />}
                fullWidth
              >
                Áp dụng mã giảm giá
              </Button>
            ) : (
              <form onSubmit={handleApplyVoucher} onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyVoucher(e);
                }
              }}>
                <Box display="flex" gap={1} mb={2}>
                  <TextField
                    fullWidth
                    label="Nhập mã voucher"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyVoucher(e);
                      }
                    }}
                    placeholder="VD: WELCOME10, SAVE20..."
                    size="small"
                    disabled={loading}
                  />
                  <Button 
                    type="button"
                    onClick={handleApplyVoucher}
                    variant="contained" 
                    disabled={loading || !voucherCode.trim()}
                    startIcon={loading ? null : <CheckIcon />}
                  >
                    {loading ? 'Đang kiểm tra...' : 'Áp dụng'}
                  </Button>
                </Box>
                
                <Button 
                  variant="text" 
                  size="small" 
                  onClick={() => {
                    setShowVoucherForm(false);
                    setVoucherCode('');
                    setError('');
                    setSuccess('');
                  }}
                >
                  Hủy
                </Button>
              </form>
            )}

            <Collapse in={error !== '' || success !== ''}>
              {error && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" sx={{ mt: 1 }}>
                  {success}
                </Alert>
              )}
            </Collapse>

            <Box mt={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Mã voucher có sẵn:
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {['WELCOME10', 'SAVE20', 'SUMMER25', 'VIP30'].map((code) => (
                  <Chip
                    key={code}
                    label={code}
                    size="small"
                    variant="outlined"
                    onClick={() => setVoucherCode(code)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default VoucherSelector;
