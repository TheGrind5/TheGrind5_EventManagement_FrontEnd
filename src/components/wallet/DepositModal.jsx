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
import { Close, AccountBalanceWallet } from '@mui/icons-material';
import { walletAPI } from '../../services/apiClient';

const DepositModal = ({ onClose, onSuccess }) => {
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
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await walletAPI.deposit({
        amount: parseFloat(formData.amount),
        description: formData.description || 'Nạp tiền vào ví'
      });

      // Success
      onSuccess(response.data.newBalance);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
            placeholder="Ví dụ: Nạp tiền từ thẻ ngân hàng..."
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Payment Info */}
          <Paper sx={{ p: 2, bgcolor: 'info.light', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              💡 Thông tin thanh toán
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Nạp tiền tức thì, không mất phí<br/>
              • Số dư sẽ được cập nhật ngay sau khi nạp<br/>
              • Tất cả giao dịch đều được ghi nhận
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
          disabled={loading}
          variant="contained"
          color="success"
          startIcon={loading ? <CircularProgress size={16} /> : <AccountBalanceWallet />}
        >
          {loading ? 'Đang xử lý...' : 'Nạp tiền'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DepositModal;
