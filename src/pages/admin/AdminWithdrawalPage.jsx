import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Stack
} from '@mui/material';
import {
  Visibility,
  CheckCircle,
  Cancel,
  QrCode2,
  MoneyOff,
  Refresh
} from '@mui/icons-material';
import adminService from '../../services/adminService';
import WalletService from '../../services/walletService';

const AdminWithdrawalPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  // Filter
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showConfirmCompleteModal, setShowConfirmCompleteModal] = useState(false);
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchWithdrawalRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        pageNumber: currentPage,
        pageSize: pageSize
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await adminService.getAllWithdrawalRequests(params);
      
      if (response.data && response.data.requests) {
        setRequests(response.data.requests);
        setTotalPages(response.data.totalPages || 1);
        setTotalCount(response.data.totalCount || 0);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error('Error fetching withdrawal requests:', err);
      setError('Không thể tải danh sách yêu cầu rút tiền');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, statusFilter]);

  useEffect(() => {
    fetchWithdrawalRequests();
  }, [fetchWithdrawalRequests]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setCurrentPage(1);
    
    const statusMap = ['', 'Pending', 'Approved', 'Completed', 'Rejected'];
    setStatusFilter(statusMap[newValue]);
  };

  const handleViewDetail = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleApprove = async (request) => {
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await adminService.approveWithdrawalRequest(request.withdrawalRequestId);
      
      if (response.data) {
        setSuccess('Đã duyệt yêu cầu rút tiền thành công!');
        setSelectedRequest({
          ...request,
          status: 'Approved',
          qrCodeUrl: response.data.qrCodeUrl
        });
        setShowQRModal(true);
        fetchWithdrawalRequests();
      }
    } catch (err) {
      console.error('Error approving request:', err);
      setError(err.response?.data?.message || 'Không thể duyệt yêu cầu');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('Vui lòng nhập lý do từ chối');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      await adminService.rejectWithdrawalRequest(selectedRequest.withdrawalRequestId, rejectReason);
      setSuccess('Đã từ chối yêu cầu rút tiền!');
      setShowRejectModal(false);
      setRejectReason('');
      fetchWithdrawalRequests();
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError(err.response?.data?.message || 'Không thể từ chối yêu cầu');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      await adminService.completeWithdrawalRequest(selectedRequest.withdrawalRequestId);
      setSuccess('Đã xác nhận hoàn thành chuyển tiền!');
      setShowConfirmCompleteModal(false);
      setShowQRModal(false);
      fetchWithdrawalRequests();
    } catch (err) {
      console.error('Error completing request:', err);
      setError(err.response?.data?.message || 'Không thể hoàn thành yêu cầu');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusChip = (status) => {
    const colorMap = {
      'Pending': 'warning',
      'Approved': 'info',
      'Rejected': 'error',
      'Completed': 'success',
      'Cancelled': 'default'
    };
    return (
      <Chip 
        label={WalletService.formatStatus(status)} 
        color={colorMap[status] || 'default'}
        size="small"
      />
    );
  };

  const renderActionButtons = (request) => {
    if (request.status === 'Pending') {
      return (
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="success"
            size="small"
            onClick={() => handleApprove(request)}
            disabled={actionLoading}
            startIcon={<CheckCircle />}
          >
            Duyệt
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => {
              setSelectedRequest(request);
              setShowRejectModal(true);
            }}
            disabled={actionLoading}
            startIcon={<Cancel />}
          >
            Từ chối
          </Button>
        </Stack>
      );
    } else if (request.status === 'Approved') {
      return (
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setSelectedRequest(request);
              setShowQRModal(true);
            }}
            startIcon={<QrCode2 />}
          >
            Xem QR
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => {
              setSelectedRequest(request);
              setShowConfirmCompleteModal(true);
            }}
            disabled={actionLoading}
            startIcon={<CheckCircle />}
          >
            Xác nhận
          </Button>
        </Stack>
      );
    }
    return null;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MoneyOff /> Quản lý yêu cầu rút tiền
        </Typography>
        <IconButton onClick={fetchWithdrawalRequests} color="primary">
          <Refresh />
        </IconButton>
      </Box>

      {/* Alerts */}
      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

      {/* Tabs and Table */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label="Tất cả" />
          <Tab label={`Chờ duyệt ${statusFilter === 'Pending' ? `(${totalCount})` : ''}`} />
          <Tab label="Đã duyệt" />
          <Tab label="Hoàn thành" />
          <Tab label="Đã từ chối" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={5}>
              <CircularProgress />
            </Box>
          ) : requests.length === 0 ? (
            <Box textAlign="center" py={5}>
              <Typography color="text.secondary">Không có yêu cầu rút tiền nào</Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Mã YC</TableCell>
                      <TableCell>Người yêu cầu</TableCell>
                      <TableCell align="right">Số tiền</TableCell>
                      <TableCell>Ngân hàng</TableCell>
                      <TableCell>Số TK</TableCell>
                      <TableCell>Trạng thái</TableCell>
                      <TableCell>Ngày tạo</TableCell>
                      <TableCell align="center">Hành động</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.withdrawalRequestId} hover>
                        <TableCell>#{request.withdrawalRequestId}</TableCell>
                        <TableCell>{request.userName}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            {request.amount.toLocaleString('vi-VN')} VND
                          </Typography>
                        </TableCell>
                        <TableCell>{request.bankName}</TableCell>
                        <TableCell>{request.bankAccountNumber}</TableCell>
                        <TableCell>{getStatusChip(request.status)}</TableCell>
                        <TableCell>{new Date(request.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewDetail(request)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                            {renderActionButtons(request)}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                  <Typography variant="body2">
                    Hiển thị {requests.length} / {totalCount} yêu cầu
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Button
                      size="small"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Trước
                    </Button>
                    <Typography variant="body2">
                      Trang {currentPage} / {totalPages}
                    </Typography>
                    <Button
                      size="small"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Sau
                    </Button>
                  </Stack>
                </Box>
              )}
            </>
          )}
        </Box>
      </Paper>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onHide={() => setShowDetailModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết yêu cầu rút tiền</DialogTitle>
        <DialogContent dividers>
          {selectedRequest && (
            <Box>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Mã yêu cầu</Typography>
                  <Typography variant="body1">#{selectedRequest.withdrawalRequestId}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Trạng thái</Typography>
                  {getStatusChip(selectedRequest.status)}
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Người yêu cầu</Typography>
                  <Typography variant="body1">{selectedRequest.userName}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Số tiền</Typography>
                  <Typography variant="h6">{selectedRequest.amount.toLocaleString('vi-VN')} VND</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Thông tin ngân hàng</Typography>
                  <Typography variant="body1">Ngân hàng: {selectedRequest.bankName}</Typography>
                  <Typography variant="body1">Số TK: {selectedRequest.bankAccountNumber}</Typography>
                  <Typography variant="body1">Tên chủ TK: {selectedRequest.bankAccountName}</Typography>
                  <Typography variant="body1">Mã NH: {selectedRequest.bankCode}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Ngày tạo</Typography>
                  <Typography variant="body1">{new Date(selectedRequest.createdAt).toLocaleString('vi-VN')}</Typography>
                </Box>
                {selectedRequest.rejectionReason && (
                  <Alert severity="error">
                    <strong>Lý do từ chối:</strong> {selectedRequest.rejectionReason}
                  </Alert>
                )}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailModal(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onClose={() => setShowQRModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mã QR chuyển tiền</DialogTitle>
        <DialogContent>
          {selectedRequest && selectedRequest.qrCodeUrl && (
            <Box textAlign="center">
              <Typography variant="body1" mb={2}>Quét mã QR bên dưới để chuyển tiền:</Typography>
              <Box component="img" src={selectedRequest.qrCodeUrl} alt="QR Code" sx={{ width: '100%', maxWidth: 400, mb: 2 }} />
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography><strong>Số tiền:</strong> {selectedRequest.amount.toLocaleString('vi-VN')} VND</Typography>
                <Typography><strong>Người nhận:</strong> {selectedRequest.bankAccountName}</Typography>
                <Typography><strong>STK:</strong> {selectedRequest.bankAccountNumber}</Typography>
                <Typography><strong>Ngân hàng:</strong> {selectedRequest.bankName}</Typography>
              </Paper>
              <Alert severity="info" sx={{ mt: 2 }}>
                Sau khi quét QR và chuyển tiền thành công, vui lòng nhấn "Xác nhận đã chuyển" bên dưới.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowQRModal(false)}>Đóng</Button>
          <Button 
            variant="contained"
            color="success"
            onClick={() => {
              setShowQRModal(false);
              setShowConfirmCompleteModal(true);
            }}
            disabled={actionLoading}
            startIcon={<CheckCircle />}
          >
            Xác nhận đã chuyển
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onClose={() => setShowRejectModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Từ chối yêu cầu rút tiền</DialogTitle>
        <DialogContent>
          <TextField
            label="Lý do từ chối"
            multiline
            rows={4}
            fullWidth
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Nhập lý do từ chối..."
            helperText={`${rejectReason.length}/500 ký tự`}
            inputProps={{ maxLength: 500 }}
            required
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRejectModal(false)}>Hủy</Button>
          <Button 
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={actionLoading || !rejectReason.trim()}
            startIcon={actionLoading ? <CircularProgress size={16} /> : <Cancel />}
          >
            Từ chối
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Complete Modal */}
      <Dialog open={showConfirmCompleteModal} onClose={() => setShowConfirmCompleteModal(false)} maxWidth="sm">
        <DialogTitle>Xác nhận đã chuyển tiền</DialogTitle>
        <DialogContent>
          <Typography mb={2}>Bạn xác nhận đã chuyển tiền thành công cho yêu cầu này?</Typography>
          {selectedRequest && (
            <Alert severity="warning">
              <strong>Số tiền:</strong> {selectedRequest.amount.toLocaleString('vi-VN')} VND<br/>
              <strong>Người nhận:</strong> {selectedRequest.userName}<br/>
              <strong>STK:</strong> {selectedRequest.bankAccountNumber}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmCompleteModal(false)}>Hủy</Button>
          <Button 
            variant="contained"
            color="success"
            onClick={handleComplete}
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={16} /> : <CheckCircle />}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminWithdrawalPage;
