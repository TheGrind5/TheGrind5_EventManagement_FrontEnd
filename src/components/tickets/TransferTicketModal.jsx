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
  IconButton,
  CircularProgress,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  InputAdornment
} from '@mui/material';
import { Close, Send, Mail, AttachMoney } from '@mui/icons-material';
import TicketTransferService from '../../services/ticketTransferService';

const TransferTicketModal = ({ ticket, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    toEmail: '',
    message: ''
  });
  const [transferType, setTransferType] = useState('free');
  const [customPrice, setCustomPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Get ticket price
  const ticketPrice = ticket.ticketType?.price || 0;

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
    
    // Calculate transfer fee based on type
    let transferFee = 0;
    if (transferType === 'original') {
      transferFee = ticketPrice;
    } else if (transferType === 'custom') {
      transferFee = parseFloat(customPrice) || 0;
      if (transferFee <= 0) {
        setError('Giá chuyển nhượng phải lớn hơn 0');
        return;
      }
      if (transferFee > ticketPrice * 2) {
        setError('Giá chuyển nhượng không được quá 2 lần giá gốc');
        return;
      }
    }
    
    // Validation
    const validation = TicketTransferService.validateTransferRequest({
      ticketId: ticket.ticketId,
      toEmail: formData.toEmail,
      message: formData.message,
      transferFee: transferFee
    });

    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await TicketTransferService.initiateTransfer({
        ticketId: ticket.ticketId,
        toEmail: formData.toEmail.trim(),
        message: formData.message.trim(),
        transferFee: transferFee
      });

      setSuccess(true);
      
      // Show success message for 2 seconds then close
      setTimeout(() => {
        onSuccess && onSuccess(response.transfer);
        onClose();
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi chuyển nhượng vé');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={true} 
      onClose={!loading ? onClose : null}
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Send color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Chuyển nhượng vé
          </Typography>
        </Box>
        <IconButton onClick={onClose} disabled={loading} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              Đã gửi yêu cầu chuyển nhượng!
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Email thông báo đã được gửi đến {formData.toEmail}. Người nhận có 48 giờ để chấp nhận hoặc từ chối.
            </Typography>
          </Alert>
        ) : (
          <>
            {/* Ticket Info */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Thông tin vé
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {ticket.event?.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {ticket.ticketType?.typeName} • {ticket.ticketType?.price?.toLocaleString('vi-VN')}₫
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Mã vé: {ticket.serialNumber}
              </Typography>
            </Box>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email người nhận"
                name="toEmail"
                type="email"
                value={formData.toEmail}
                onChange={handleInputChange}
                placeholder="recipient@example.com"
                required
                disabled={loading}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: <Mail sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                helperText="Nhập email của người bạn muốn chuyển nhượng vé"
              />

              {/* Payment Options */}
              <FormControl component="fieldset" sx={{ mb: 3 }}>
                <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                  <AttachMoney sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
                  Phương thức chuyển nhượng
                </FormLabel>
                <RadioGroup
                  value={transferType}
                  onChange={(e) => setTransferType(e.target.value)}
                >
                  <FormControlLabel
                    value="free"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Tặng miễn phí
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Người nhận không phải trả tiền
                        </Typography>
                      </Box>
                    }
                    disabled={loading}
                  />
                  <FormControlLabel
                    value="original"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Hoàn giá gốc ({ticketPrice.toLocaleString('vi-VN')}₫)
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Bạn nhận lại {(ticketPrice * 0.95).toLocaleString('vi-VN')}₫ (sau phí 5%)
                        </Typography>
                      </Box>
                    }
                    disabled={loading}
                  />
                  <FormControlLabel
                    value="custom"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Giá tự định
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Tối đa {(ticketPrice * 2).toLocaleString('vi-VN')}₫
                        </Typography>
                      </Box>
                    }
                    disabled={loading}
                  />
                </RadioGroup>
              </FormControl>

              {/* Custom Price Input */}
              {transferType === 'custom' && (
                <TextField
                  fullWidth
                  label="Giá chuyển nhượng"
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="Nhập giá"
                  required
                  disabled={loading}
                  sx={{ mb: 3 }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">₫</InputAdornment>
                  }}
                  helperText={`Bạn sẽ nhận: ${(parseFloat(customPrice) * 0.95 || 0).toLocaleString('vi-VN')}₫ (sau phí 5%)`}
                />
              )}

              <TextField
                fullWidth
                label="Tin nhắn (không bắt buộc)"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Ví dụ: Mình không thể tham dự được. Bạn muốn vé này không?"
                multiline
                rows={3}
                disabled={loading}
                inputProps={{ maxLength: 500 }}
                helperText={`${formData.message.length}/500 ký tự`}
              />

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              {/* Info Box */}
              <Box sx={{ mt: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 1, border: 1, borderColor: 'info.light' }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>📧 Cách thức hoạt động:</strong>
                </Typography>
                <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
                  • Email sẽ được gửi đến người nhận với link chấp nhận chuyển nhượng
                </Typography>
                <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
                  • Link có hiệu lực trong 48 giờ
                </Typography>
                <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
                  • Bạn có thể hủy yêu cầu nếu người nhận chưa chấp nhận
                </Typography>
                <Typography variant="caption" component="div">
                  • Sau khi chấp nhận, vé sẽ chuyển sang sở hữu của người nhận
                </Typography>
              </Box>
            </form>
          </>
        )}
      </DialogContent>

      {!success && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={onClose} 
            disabled={loading}
            variant="outlined"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Send />}
          >
            {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default TransferTicketModal;
