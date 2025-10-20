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
  CircularProgress
} from '@mui/material';
import { Close, Remove } from '@mui/icons-material';
import { walletAPI } from '../../services/apiClient';

const WithdrawModal = ({ currentBalance, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    amount: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    
    const amount = parseFloat(formData.amount);
    
    if (!formData.amount || amount <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (amount > currentBalance) {
      setError(`Số tiền rút không được vượt quá số dư hiện tại (${currentBalance.toLocaleString('vi-VN')}₫)`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await walletAPI.withdraw({
        amount: amount,
        description: formData.description || 'Rút tiền từ ví'
      });

      // Success
      onSuccess(response.data.newBalance);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [
    Math.min(50000, currentBalance),
    Math.min(100000, currentBalance),
    Math.min(200000, currentBalance),
    Math.min(currentBalance * 0.5, currentBalance),
    currentBalance
  ].filter((amount, index, arr) => amount > 0 && arr.indexOf(amount) === index);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + '₫';
  };

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
        <Remove color="warning" />
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Rút tiền từ ví
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
          {/* Balance Info */}
          <Paper sx={{ p: 2, bgcolor: 'primary.light', mb: 3 }}>
            <Typography variant="body1">
              Số dư hiện tại: <strong>{formatCurrency(currentBalance)}</strong>
            </Typography>
          </Paper>

          <TextField
            fullWidth
            label="Số tiền rút (VND)"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="Nhập số tiền rút..."
            inputProps={{ 
              min: 1000, 
              max: currentBalance, 
              step: 1000 
            }}
            required
            sx={{ mb: 2 }}
          />
          
          {/* Quick Amount Buttons */}
          {quickAmounts.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Chọn nhanh:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {quickAmounts.map(amount => (
                  <Chip
                    key={amount}
                    label={formatCurrency(amount)}
                    onClick={() => setFormData(prev => ({ ...prev, amount: amount.toString() }))}
                    variant="outlined"
                    clickable
                    size="small"
                  />
                ))}
              </Stack>
            </Box>
          )}

          <TextField
            fullWidth
            label="Ghi chú (tùy chọn)"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Ví dụ: Rút tiền về tài khoản ngân hàng..."
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Withdraw Info */}
          <Paper sx={{ p: 2, bgcolor: 'warning.light', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              ⚠️ Lưu ý quan trọng
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Số tiền rút sẽ được trừ khỏi ví ngay lập tức<br/>
              • Không thể hoàn tác sau khi rút tiền<br/>
              • Vui lòng kiểm tra kỹ thông tin trước khi xác nhận
              {currentBalance <= 0 && (
                <><br/>• Không thể rút tiền khi ví trống</>
              )}
            </Typography>
          </Paper>
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
        <Button
          onClick={handleSubmit}
          disabled={loading || currentBalance <= 0}
          variant="contained"
          color="warning"
          startIcon={loading ? <CircularProgress size={16} /> : <Remove />}
        >
          {loading ? 'Đang xử lý...' : 'Rút tiền'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WithdrawModal;
