import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Person,
  Mail,
  AccessTime,
  Event,
  ConfirmationNumber,
  CheckCircle,
  Cancel,
  Send
} from '@mui/icons-material';
import TicketTransferService from '../../services/ticketTransferService';

const TransferRequestCard = ({ transfer, currentUserEmail, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const isSender = transfer.fromUser?.email === currentUserEmail;
  const isExpired = TicketTransferService.isExpired(transfer.expiresAt);
  const canRespond = TicketTransferService.canRespond(transfer, currentUserEmail);

  const handleAccept = async () => {
    if (!window.confirm('Bạn có chắc muốn chấp nhận vé này?')) return;

    setLoading(true);
    try {
      await TicketTransferService.acceptTransfer(transfer.transferCode);
      onUpdate && onUpdate();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi chấp nhận chuyển nhượng');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await TicketTransferService.rejectTransfer(transfer.transferCode, rejectionReason);
      setShowRejectDialog(false);
      onUpdate && onUpdate();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi từ chối chuyển nhượng');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = () => {
    const color = TicketTransferService.getStatusColor(transfer.transferStatus);
    const label = TicketTransferService.formatStatus(transfer.transferStatus);
    
    return (
      <Chip 
        label={label}
        color={color}
        size="small"
        sx={{ fontWeight: 600 }}
      />
    );
  };

  return (
    <>
      <Card 
        sx={{ 
          mb: 2,
          border: 1,
          borderColor: isExpired ? 'grey.300' : transfer.transferStatus === 'Pending' ? 'warning.main' : 'grey.300',
          borderRadius: 2,
          opacity: isExpired || transfer.transferStatus !== 'Pending' ? 0.7 : 1
        }}
      >
        <CardContent>
          {/* Header with Status */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Send fontSize="small" color={isSender ? 'primary' : 'success'} />
              <Typography variant="subtitle2" color="text.secondary">
                {isSender ? 'Đã gửi' : 'Đã nhận'}
              </Typography>
            </Box>
            {getStatusChip()}
          </Box>

          {/* Sender/Receiver Info */}
          <Stack spacing={1.5} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person fontSize="small" color="action" />
              <Typography variant="body2">
                <strong>{isSender ? 'Gửi đến:' : 'Từ:'}</strong>{' '}
                {isSender ? transfer.toEmail : transfer.fromUser?.fullName || transfer.fromUser?.email}
              </Typography>
            </Box>

            {!isSender && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Mail fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {transfer.fromUser?.email}
                </Typography>
              </Box>
            )}
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Ticket Info */}
          {transfer.ticket && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Event fontSize="small" color="primary" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {transfer.ticket.event?.title}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {transfer.ticket.ticketType?.typeName} • {transfer.ticket.ticketType?.price?.toLocaleString('vi-VN')}₫
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <ConfirmationNumber fontSize="small" sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {transfer.ticket.serialNumber}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Message */}
          {transfer.message && (
            <Alert severity="info" icon={<Mail />} sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Tin nhắn:</strong> {transfer.message}
              </Typography>
            </Alert>
          )}

          {/* Rejection Reason */}
          {transfer.rejectionReason && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Lý do từ chối:</strong> {transfer.rejectionReason}
              </Typography>
            </Alert>
          )}

          {/* Time Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AccessTime fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              Yêu cầu lúc: {TicketTransferService.formatDate(transfer.requestedAt)}
            </Typography>
          </Box>

          {transfer.transferStatus === 'Pending' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTime fontSize="small" color={isExpired ? 'error' : 'warning'} />
              <Typography 
                variant="caption" 
                color={isExpired ? 'error.main' : 'warning.main'}
                sx={{ fontWeight: 600 }}
              >
                {TicketTransferService.formatTimeRemaining(transfer.expiresAt)}
              </Typography>
            </Box>
          )}

          {transfer.completedAt && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle fontSize="small" color="success" />
              <Typography variant="caption" color="text.secondary">
                Hoàn thành: {TicketTransferService.formatDate(transfer.completedAt)}
              </Typography>
            </Box>
          )}

          {/* Actions */}
          {canRespond && !isExpired && (
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={loading ? <CircularProgress size={16} /> : <CheckCircle />}
                onClick={handleAccept}
                disabled={loading}
                fullWidth
              >
                Chấp nhận
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<Cancel />}
                onClick={() => setShowRejectDialog(true)}
                disabled={loading}
                fullWidth
              >
                Từ chối
              </Button>
            </Stack>
          )}

          {isExpired && transfer.transferStatus === 'Pending' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Yêu cầu chuyển nhượng đã hết hạn
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onClose={() => !loading && setShowRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Từ chối chuyển nhượng vé</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Bạn có thể để lại lý do từ chối (không bắt buộc):
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Ví dụ: Tôi đã có vé rồi, cảm ơn bạn!"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            disabled={loading}
            inputProps={{ maxLength: 500 }}
            helperText={`${rejectionReason.length}/500 ký tự`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRejectDialog(false)} disabled={loading}>
            Hủy
          </Button>
          <Button 
            onClick={handleReject} 
            color="error" 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Cancel />}
          >
            {loading ? 'Đang xử lý...' : 'Từ chối'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TransferRequestCard;
