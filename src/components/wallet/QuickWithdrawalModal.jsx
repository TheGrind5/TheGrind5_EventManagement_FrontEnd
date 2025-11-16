import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Paper
} from '@mui/material';
import { MoneyOff } from '@mui/icons-material';
import WalletService from '../../services/walletService';

const QuickWithdrawalModal = ({ open, onClose, currentBalance, userBankInfo }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');

    // Validate amount
    const amountValue = parseFloat(amount);
    const validation = WalletService.validateWithdrawalAmount(amountValue, currentBalance);
    
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    // Check if user has bank info
    if (!userBankInfo || !userBankInfo.bankName || !userBankInfo.bankAccountNumber) {
      setError('Vui lòng cập nhật thông tin ngân hàng trước khi rút tiền!');
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        amount: amountValue,
        bankName: userBankInfo.bankName,
        bankAccountNumber: userBankInfo.bankAccountNumber,
        bankAccountName: userBankInfo.bankAccountName || userBankInfo.username,
        bankCode: userBankInfo.bankCode || 'UNKNOWN'
      };

      await WalletService.createWithdrawalRequest(requestData);
      
      // Success
      alert('Tạo yêu cầu rút tiền thành công! Vui lòng đợi admin duyệt.');
      onClose();
      setAmount('');
      
      // Refresh page
      window.location.reload();
    } catch (err) {
      console.error('Error creating withdrawal request:', err);
      setError(err.response?.data?.message || 'Không thể tạo yêu cầu rút tiền');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAmount('');
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <MoneyOff /> Rút tiền từ ví
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          {/* Current Balance */}
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Số dư hiện tại:</strong> {currentBalance.toLocaleString('vi-VN')} VND<br/>
            <strong>Số tiền rút tối thiểu:</strong> 50,000 VND
          </Alert>

          {/* Bank Info Display */}
          {userBankInfo && userBankInfo.bankName ? (
            <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Thông tin ngân hàng nhận tiền:
              </Typography>
              <Typography variant="body2"><strong>Ngân hàng:</strong> {userBankInfo.bankName}</Typography>
              <Typography variant="body2"><strong>Số tài khoản:</strong> {userBankInfo.bankAccountNumber}</Typography>
              <Typography variant="body2"><strong>Chủ tài khoản:</strong> {userBankInfo.bankAccountName || userBankInfo.username}</Typography>
            </Paper>
          ) : (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Bạn chưa cập nhật thông tin ngân hàng. Vui lòng cập nhật trước khi rút tiền!
            </Alert>
          )}

          {/* Amount Input */}
          <TextField
            label="Số tiền rút"
            type="number"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={!!error}
            helperText={error}
            placeholder="Nhập số tiền cần rút..."
            InputProps={{
              endAdornment: <Typography variant="caption" color="text.secondary">VND</Typography>
            }}
            disabled={loading || !userBankInfo || !userBankInfo.bankName}
            autoFocus
          />

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            💡 Sau khi tạo yêu cầu, admin sẽ duyệt và chuyển tiền vào tài khoản ngân hàng của bạn
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !amount || !userBankInfo || !userBankInfo.bankName}
          startIcon={loading ? <CircularProgress size={16} /> : <MoneyOff />}
        >
          {loading ? 'Đang xử lý...' : 'Tạo yêu cầu rút tiền'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickWithdrawalModal;
