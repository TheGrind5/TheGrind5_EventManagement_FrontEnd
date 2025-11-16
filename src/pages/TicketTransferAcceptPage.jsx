import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Paper,
  Chip
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  AccessTime,
  Event,
  ConfirmationNumber,
  Person,
  Mail,
  Warning
} from '@mui/icons-material';
import TicketTransferService from '../services/ticketTransferService';

const TicketTransferAcceptPage = () => {
  const { transferCode } = useParams();
  const navigate = useNavigate();
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);

    // Fetch transfer details
    fetchTransferDetails();
  }, [transferCode]);

  const fetchTransferDetails = async () => {
    try {
      setLoading(true);
      const response = await TicketTransferService.getTransferDetails(transferCode);
      setTransfer(response.transfer);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải thông tin chuyển nhượng');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để chấp nhận chuyển nhượng');
      navigate('/login', { state: { from: `/ticket-transfer/accept/${transferCode}` } });
      return;
    }

    if (!window.confirm('Bạn có chắc muốn chấp nhận vé này?')) return;

    setProcessing(true);
    try {
      await TicketTransferService.acceptTransfer(transferCode);
      alert('Chấp nhận chuyển nhượng thành công! Vé đã được thêm vào tài khoản của bạn.');
      navigate('/my-tickets');
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi chấp nhận chuyển nhượng');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để từ chối chuyển nhượng');
      navigate('/login', { state: { from: `/ticket-transfer/accept/${transferCode}` } });
      return;
    }

    const reason = prompt('Lý do từ chối (không bắt buộc):');
    if (reason === null) return; // User cancelled

    setProcessing(true);
    try {
      await TicketTransferService.rejectTransfer(transferCode, reason);
      alert('Đã từ chối chuyển nhượng');
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi từ chối chuyển nhượng');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Đang tải thông tin chuyển nhượng...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/')}>
          Về trang chủ
        </Button>
      </Container>
    );
  }

  if (!transfer) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="warning">
          Không tìm thấy thông tin chuyển nhượng
        </Alert>
      </Container>
    );
  }

  const isExpired = TicketTransferService.isExpired(transfer.expiresAt);
  const isPending = transfer.transferStatus === 'Pending';
  const canRespond = isPending && !isExpired;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          🎫 Chuyển nhượng vé
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bạn nhận được một vé từ người khác
        </Typography>
      </Box>

      {/* Status Alert */}
      {!canRespond && (
        <Alert 
          severity={
            transfer.transferStatus === 'Accepted' ? 'success' :
            transfer.transferStatus === 'Rejected' ? 'info' :
            isExpired ? 'error' : 'warning'
          }
          sx={{ mb: 3 }}
        >
          {transfer.transferStatus === 'Accepted' && 'Chuyển nhượng đã được chấp nhận'}
          {transfer.transferStatus === 'Rejected' && 'Chuyển nhượng đã bị từ chối'}
          {transfer.transferStatus === 'Cancelled' && 'Chuyển nhượng đã bị hủy bởi người gửi'}
          {isExpired && isPending && 'Yêu cầu chuyển nhượng đã hết hạn'}
        </Alert>
      )}

      {/* Transfer Info Card */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          {/* Status */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Chi tiết chuyển nhượng
            </Typography>
            <Chip 
              label={TicketTransferService.formatStatus(transfer.transferStatus)}
              color={TicketTransferService.getStatusColor(transfer.transferStatus)}
              sx={{ fontWeight: 600 }}
            />
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Sender Info */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Người gửi
            </Typography>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person fontSize="small" color="action" />
                <Typography variant="body1">
                  {transfer.fromUser?.fullName || 'Unknown'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Mail fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {transfer.fromUser?.email}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Ticket Info */}
          {transfer.ticket && (
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.lighter', borderRadius: 2, mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Thông tin vé
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Event color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {transfer.ticket.event?.title}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {transfer.ticket.ticketType?.typeName}
              </Typography>
              <Typography variant="h5" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                {transfer.ticket.ticketType?.price?.toLocaleString('vi-VN')}₫
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ConfirmationNumber fontSize="small" sx={{ color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  Mã vé: {transfer.ticket.serialNumber}
                </Typography>
              </Box>
              {transfer.ticket.event && (
                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary">
                    📅 {new Date(transfer.ticket.event.startTime).toLocaleString('vi-VN')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    📍 {transfer.ticket.event.location}
                  </Typography>
                </Box>
              )}
            </Paper>
          )}

          {/* Message */}
          {transfer.message && (
            <Alert severity="info" icon={<Mail />} sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Tin nhắn từ người gửi:</strong>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                "{transfer.message}"
              </Typography>
            </Alert>
          )}

          {/* Time Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AccessTime fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Yêu cầu lúc: {TicketTransferService.formatDate(transfer.requestedAt)}
            </Typography>
          </Box>

          {canRespond && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Warning fontSize="small" color="warning" />
              <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
                {TicketTransferService.formatTimeRemaining(transfer.expiresAt)}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {canRespond && (
        <>
          {!isAuthenticated && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Bạn cần đăng nhập để chấp nhận hoặc từ chối chuyển nhượng vé
            </Alert>
          )}
          
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="success"
              size="large"
              startIcon={processing ? <CircularProgress size={20} /> : <CheckCircle />}
              onClick={handleAccept}
              disabled={processing}
              fullWidth
            >
              {processing ? 'Đang xử lý...' : 'Chấp nhận vé'}
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="large"
              startIcon={<Cancel />}
              onClick={handleReject}
              disabled={processing}
              fullWidth
            >
              Từ chối
            </Button>
          </Stack>

          {!isAuthenticated && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button 
                variant="text" 
                onClick={() => navigate('/login', { state: { from: `/ticket-transfer/accept/${transferCode}` } })}
              >
                Đăng nhập ngay
              </Button>
            </Box>
          )}
        </>
      )}

      {!canRespond && (
        <Box sx={{ textAlign: 'center' }}>
          <Button variant="contained" onClick={() => navigate('/')}>
            Về trang chủ
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default TicketTransferAcceptPage;
