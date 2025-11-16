import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Stack
} from '@mui/material';
import {
  MoneyOff,
  Warning,
  Info
} from '@mui/icons-material';
import refundService from '../../services/refundService';

const RefundRequestModal = ({ open, onClose, order, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do hoàn tiền');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const refundData = {
        orderId: order.orderId,
        reason: reason.trim(),
        // refundAmount: order.amount // Optional - defaults to full amount
      };

      await refundService.createRefundRequest(refundData);

      // Success
      if (onSuccess) {
        onSuccess();
      }

      // Reset and close
      setReason('');
      onClose();
    } catch (err) {
      console.error('Error submitting refund request:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.errors?.[0] ||
                          err.message ||
                          'Không thể tạo yêu cầu hoàn tiền. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
      setError(null);
      onClose();
    }
  };

  if (!order) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <MoneyOff color="error" />
          <Typography variant="h6">Yêu Cầu Hoàn Tiền</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {/* Order Info */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Thông tin đơn hàng
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2">
                <strong>Mã đơn:</strong> #{order.orderId}
              </Typography>
              <Typography variant="body2">
                <strong>Sự kiện:</strong> {order.eventTitle || order.eventName || 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>Số tiền:</strong> {order.amount?.toLocaleString('vi-VN')} VNĐ
              </Typography>
              {order.discountAmount > 0 && (
                <Typography variant="body2" color="success.main">
                  <strong>Đã giảm:</strong> {order.discountAmount?.toLocaleString('vi-VN')} VNĐ
                </Typography>
              )}
            </Box>
          </Paper>

          {/* Warning */}
          <Alert severity="warning" icon={<Warning />}>
            <Typography variant="body2">
              • Vé đã sử dụng hoặc đã check-in không thể hoàn tiền<br />
              • Sự kiện đã diễn ra không thể hoàn tiền<br />
              • Số tiền hoàn sẽ được cộng vào ví của bạn sau khi Admin duyệt
            </Typography>
          </Alert>

          {/* Reason Input */}
          <TextField
            label="Lý do hoàn tiền *"
            multiline
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Vui lòng nhập lý do yêu cầu hoàn tiền..."
            helperText={`${reason.length}/1000 ký tự`}
            inputProps={{ maxLength: 1000 }}
            disabled={loading}
            fullWidth
            required
          />

          {/* Info */}
          <Alert severity="info" icon={<Info />}>
            <Typography variant="body2">
              Yêu cầu hoàn tiền sẽ được gửi đến Admin để xét duyệt. 
              Bạn sẽ nhận được thông báo khi yêu cầu được xử lý.
            </Typography>
          </Alert>

          {/* Error Display */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
        >
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="error"
          disabled={loading || !reason.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : <MoneyOff />}
        >
          {loading ? 'Đang gửi...' : 'Gửi Yêu Cầu'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RefundRequestModal;
