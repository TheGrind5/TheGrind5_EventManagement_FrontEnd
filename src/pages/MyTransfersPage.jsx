import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Button,
  Paper,
  Chip,
  Stack
} from '@mui/material';
import {
  Send,
  CallReceived,
  Refresh,
  ArrowBack
} from '@mui/icons-material';
import Header from '../components/layout/Header';
import TransferRequestCard from '../components/tickets/TransferRequestCard';
import TicketTransferService from '../services/ticketTransferService';
import { useAuth } from '../contexts/AuthContext';

const MyTransfersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0); // 0: Sent, 1: Received
  const [transfers, setTransfers] = useState({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await TicketTransferService.getMyTransfers();
      setTransfers({
        sent: response.sentTransfers || [],
        received: response.receivedTransfers || []
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải danh sách chuyển nhượng');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleUpdate = () => {
    fetchTransfers();
  };

  const getFilteredTransfers = () => {
    const currentTransfers = activeTab === 0 ? transfers.sent : transfers.received;
    return currentTransfers;
  };

  const filteredTransfers = getFilteredTransfers();

  const getStatusCounts = (transferList) => {
    return {
      pending: transferList.filter(t => t.transferStatus === 'Pending').length,
      accepted: transferList.filter(t => t.transferStatus === 'Accepted').length,
      rejected: transferList.filter(t => t.transferStatus === 'Rejected').length,
      cancelled: transferList.filter(t => t.transferStatus === 'Cancelled').length,
      expired: transferList.filter(t => t.transferStatus === 'Expired').length
    };
  };

  const sentCounts = getStatusCounts(transfers.sent);
  const receivedCounts = getStatusCounts(transfers.received);

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/my-tickets')}
            sx={{ mb: 2 }}
          >
            Quay lại Vé của tôi
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                🔄 Chuyển nhượng vé
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Quản lý các yêu cầu chuyển nhượng vé của bạn
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchTransfers}
              disabled={loading}
            >
              Làm mới
            </Button>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<Send />}
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Đã gửi
                  <Chip 
                    label={transfers.sent.length} 
                    size="small" 
                    color="primary"
                  />
                </Box>
              }
            />
            <Tab 
              icon={<CallReceived />}
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Đã nhận
                  <Chip 
                    label={transfers.received.length} 
                    size="small" 
                    color="success"
                  />
                </Box>
              }
            />
          </Tabs>
        </Paper>

        {/* Status Summary */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Trạng thái
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip 
              label={`Chờ xử lý: ${activeTab === 0 ? sentCounts.pending : receivedCounts.pending}`}
              color="warning"
              variant="outlined"
              size="small"
            />
            <Chip 
              label={`Đã chấp nhận: ${activeTab === 0 ? sentCounts.accepted : receivedCounts.accepted}`}
              color="success"
              variant="outlined"
              size="small"
            />
            <Chip 
              label={`Đã từ chối: ${activeTab === 0 ? sentCounts.rejected : receivedCounts.rejected}`}
              color="error"
              variant="outlined"
              size="small"
            />
            <Chip 
              label={`Đã hủy: ${activeTab === 0 ? sentCounts.cancelled : receivedCounts.cancelled}`}
              color="default"
              variant="outlined"
              size="small"
            />
            <Chip 
              label={`Hết hạn: ${activeTab === 0 ? sentCounts.expired : receivedCounts.expired}`}
              color="default"
              variant="outlined"
              size="small"
            />
          </Stack>
        </Paper>

        {/* Content */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress size={60} />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Đang tải danh sách chuyển nhượng...
            </Typography>
          </Box>
        ) : filteredTransfers.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {activeTab === 0 ? '📤 Chưa có chuyển nhượng đã gửi' : '📥 Chưa có chuyển nhượng đã nhận'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {activeTab === 0 
                ? 'Bạn chưa gửi yêu cầu chuyển nhượng vé nào. Truy cập "Vé của tôi" để chuyển nhượng vé.'
                : 'Bạn chưa nhận được yêu cầu chuyển nhượng vé nào từ người khác.'
              }
            </Typography>
            {activeTab === 0 && (
              <Button
                variant="contained"
                onClick={() => navigate('/my-tickets')}
              >
                Xem vé của tôi
              </Button>
            )}
          </Paper>
        ) : (
          <Box>
            {filteredTransfers.map((transfer) => (
              <TransferRequestCard
                key={transfer.transferId}
                transfer={transfer}
                currentUserEmail={user?.email}
                onUpdate={handleUpdate}
              />
            ))}
          </Box>
        )}

        {/* Info Box */}
        {!loading && filteredTransfers.length > 0 && (
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>💡 Lưu ý:</strong>
            </Typography>
            <Typography variant="caption" component="div">
              • Yêu cầu chuyển nhượng có hiệu lực trong 48 giờ
            </Typography>
            <Typography variant="caption" component="div">
              • Bạn có thể hủy yêu cầu chuyển nhượng nếu người nhận chưa chấp nhận
            </Typography>
            <Typography variant="caption" component="div">
              • Sau khi chấp nhận, vé sẽ chuyển ngay sang người nhận
            </Typography>
          </Alert>
        )}
      </Container>
    </>
  );
};

export default MyTransfersPage;
