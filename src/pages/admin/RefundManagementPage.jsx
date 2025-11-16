import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Snackbar
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
  MoneyOff,
  Refresh,
  FilterList
} from '@mui/icons-material';
import refundService from '../../services/refundService';

const RefundManagementPage = () => {
  const [refundRequests, setRefundRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState(0);

  // Review modal states
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewAction, setReviewAction] = useState('');
  const [adminResponse, setAdminResponse] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Detail modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState(null);

  // Snackbar state (thay thế alert browser)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' // 'success', 'error', 'warning', 'info'
  });

  // Helper to show snackbar
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Close snackbar
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  useEffect(() => {
    fetchRefundRequests();
  }, [statusFilter]);

  const fetchRefundRequests = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await refundService.getAllRefundRequests(params);
      const requests = response?.data || [];
      setRefundRequests(requests);
      setError(null);
    } catch (err) {
      console.error('Error fetching refund requests:', err);
      setError(err.message || 'Không thể tải danh sách yêu cầu hoàn tiền');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (request, action) => {
    setSelectedRequest(request);
    setReviewAction(action);
    setAdminResponse('');
    setReviewModalOpen(true);
  };

  const handleCloseReview = () => {
    setReviewModalOpen(false);
    setSelectedRequest(null);
    setReviewAction('');
    setAdminResponse('');
  };

  const handleSubmitReview = async () => {
    if (!selectedRequest) return;

    try {
      setReviewLoading(true);
      const reviewData = {
        action: reviewAction,
        adminResponse: adminResponse.trim() || undefined
      };

      await refundService.reviewRefundRequest(selectedRequest.refundRequestId, reviewData);
      
      // Success - close modal first to prevent double clicks
      handleCloseReview();
      
      // Then show success message with snackbar
      if (reviewAction === 'Approve') {
        showSnackbar(
          '✅ Yêu cầu hoàn tiền đã được duyệt thành công! Hệ thống đang tự động hoàn tiền về ví, hủy vé, tăng số lượng vé available và thông báo waitlist.',
          'success'
        );
      } else {
        showSnackbar(
          '❌ Yêu cầu hoàn tiền đã được từ chối thành công!',
          'info'
        );
      }
      
      // Refresh list
      fetchRefundRequests();
    } catch (err) {
      console.error('Error reviewing refund request:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Không thể xử lý yêu cầu';
      showSnackbar(errorMessage, 'error');
      setReviewLoading(false); // Only set false on error, success will close modal
    }
  };

  const handleViewDetail = (request) => {
    setDetailRequest(request);
    setDetailModalOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Approved': return 'info';
      case 'Rejected': return 'error';
      case 'Processing': return 'info';
      case 'Completed': return 'success';
      case 'Failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Pending': return 'Chờ duyệt';
      case 'Approved': return 'Đã duyệt';
      case 'Rejected': return 'Từ chối';
      case 'Processing': return 'Đang xử lý';
      case 'Completed': return 'Hoàn thành';
      case 'Failed': return 'Thất bại';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  // Filter requests by tab
  const filteredByTab = refundRequests.filter(req => {
    if (activeTab === 0) return req.status === 'Pending';
    if (activeTab === 1) return req.status === 'Approved' || req.status === 'Processing';
    if (activeTab === 2) return req.status === 'Completed';
    if (activeTab === 3) return req.status === 'Rejected' || req.status === 'Failed';
    return true;
  });

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <MoneyOff sx={{ fontSize: 40 }} />
              Quản Lý Hoàn Tiền
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Xét duyệt và quản lý các yêu cầu hoàn tiền từ khách hàng
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchRefundRequests}
            disabled={loading}
          >
            Làm mới
          </Button>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Chờ duyệt" />
            <Tab label="Đã duyệt" />
            <Tab label="Hoàn thành" />
            <Tab label="Từ chối" />
          </Tabs>
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Loading */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredByTab.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <MoneyOff sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Không có yêu cầu hoàn tiền nào
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Mã YC</strong></TableCell>
                  <TableCell><strong>Khách hàng</strong></TableCell>
                  <TableCell><strong>Mã đơn</strong></TableCell>
                  <TableCell><strong>Số tiền</strong></TableCell>
                  <TableCell><strong>Lý do</strong></TableCell>
                  <TableCell><strong>Trạng thái</strong></TableCell>
                  <TableCell><strong>Ngày tạo</strong></TableCell>
                  <TableCell align="center"><strong>Hành động</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredByTab.map((request) => (
                  <TableRow key={request.refundRequestId} hover>
                    <TableCell>#{request.refundRequestId}</TableCell>
                    <TableCell>
                      {request.customerName || 'N/A'}
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        {request.customerEmail}
                      </Typography>
                    </TableCell>
                    <TableCell>#{request.orderId}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(request.refundAmount)}
                      </Typography>
                      {request.orderAmount !== request.refundAmount && (
                        <Typography variant="caption" color="text.secondary">
                          / {formatCurrency(request.orderAmount)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography variant="body2" noWrap>
                        {request.reason}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(request.status)}
                        color={getStatusColor(request.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(request.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Xem chi tiết">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetail(request)}
                            color="primary"
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {request.status === 'Pending' && (
                          <>
                            <Tooltip title="Duyệt">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenReview(request, 'Approve')}
                                color="success"
                              >
                                <CheckCircle />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Từ chối">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenReview(request, 'Reject')}
                                color="error"
                              >
                                <Cancel />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Review Modal */}
        <Dialog open={reviewModalOpen} onClose={handleCloseReview} maxWidth="sm" fullWidth>
          <DialogTitle>
            {reviewAction === 'Approve' ? '✅ Duyệt yêu cầu hoàn tiền' : '❌ Từ chối yêu cầu hoàn tiền'}
          </DialogTitle>
          <DialogContent>
            {selectedRequest && (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Mã yêu cầu:</Typography>
                  <Typography variant="body1" fontWeight={600}>#{selectedRequest.refundRequestId}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Khách hàng:</Typography>
                  <Typography variant="body1">{selectedRequest.customerName}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Số tiền hoàn:</Typography>
                  <Typography variant="body1" fontWeight={600}>{formatCurrency(selectedRequest.refundAmount)}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Lý do khách hàng:</Typography>
                  <Typography variant="body1">{selectedRequest.reason}</Typography>
                </Box>
                <TextField
                  label={reviewAction === 'Approve' ? 'Ghi chú (tùy chọn)' : 'Lý do từ chối'}
                  multiline
                  rows={3}
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder={reviewAction === 'Approve' ? 
                    'Nhập ghi chú nếu cần...' : 
                    'Nhập lý do từ chối...'}
                  fullWidth
                />
                {reviewAction === 'Approve' && (
                  <Alert severity="info">
                    Sau khi duyệt, tiền sẽ tự động được hoàn vào ví của khách hàng và vé sẽ bị hủy.
                  </Alert>
                )}
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseReview} disabled={reviewLoading}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmitReview}
              variant="contained"
              color={reviewAction === 'Approve' ? 'success' : 'error'}
              disabled={reviewLoading || (reviewAction === 'Reject' && !adminResponse.trim())}
            >
              {reviewLoading ? <CircularProgress size={24} /> : 
               reviewAction === 'Approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Detail Modal */}
        <Dialog open={detailModalOpen} onClose={() => setDetailModalOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Chi tiết yêu cầu hoàn tiền</DialogTitle>
          <DialogContent>
            {detailRequest && (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Mã yêu cầu:</Typography>
                  <Typography variant="body1" fontWeight={600}>#{detailRequest.refundRequestId}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Trạng thái:</Typography>
                  <Chip label={getStatusText(detailRequest.status)} color={getStatusColor(detailRequest.status)} size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Khách hàng:</Typography>
                  <Typography variant="body1">{detailRequest.customerName}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Email:</Typography>
                  <Typography variant="body1">{detailRequest.customerEmail}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Mã đơn hàng:</Typography>
                  <Typography variant="body1">#{detailRequest.orderId}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Số tiền đơn hàng:</Typography>
                  <Typography variant="body1" fontWeight={600}>{formatCurrency(detailRequest.orderAmount)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Số tiền hoàn:</Typography>
                  <Typography variant="body1" fontWeight={600} color="error">{formatCurrency(detailRequest.refundAmount)}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Lý do khách hàng:</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body1">{detailRequest.reason}</Typography>
                  </Paper>
                </Box>
                {detailRequest.adminResponse && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>Phản hồi Admin:</Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body1">{detailRequest.adminResponse}</Typography>
                    </Paper>
                  </Box>
                )}
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Ngày tạo:</Typography>
                  <Typography variant="body1">{formatDate(detailRequest.createdAt)}</Typography>
                </Box>
                {detailRequest.reviewedAt && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Ngày xét duyệt:</Typography>
                    <Typography variant="body1">{formatDate(detailRequest.reviewedAt)}</Typography>
                  </Box>
                )}
                {detailRequest.processedAt && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Ngày xử lý:</Typography>
                    <Typography variant="body1">{formatDate(detailRequest.processedAt)}</Typography>
                  </Box>
                )}
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailModalOpen(false)}>Đóng</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications (thay thế alert browser) */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%', fontSize: '1rem', maxWidth: '600px' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
  );
};

export default RefundManagementPage;
