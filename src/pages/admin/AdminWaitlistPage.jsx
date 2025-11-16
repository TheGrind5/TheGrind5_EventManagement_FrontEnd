import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  CheckCircle as FulfillIcon,
  Refresh as RefreshIcon,
  Queue as QueueIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { adminWaitlistAPI, waitlistAPI, eventsAPI } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { formatVietnamDateTimeShort } from '../../utils/dateTimeUtils';

const AdminWaitlistPage = () => {
  const { user } = useAuth();
  const [waitlists, setWaitlists] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedWaitlist, setSelectedWaitlist] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fulfillDialogOpen, setFulfillDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'Admin') {
      return;
    }
    fetchEvents();
  }, [user]);

  useEffect(() => {
    if (selectedEventId) {
      fetchWaitlists();
    } else {
      setWaitlists([]);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const response = await eventsAPI.getAll(1, 100);
      const eventsData = response.data?.events || response.data || [];
      setEvents(eventsData);
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const fetchWaitlists = async () => {
    if (!selectedEventId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await adminWaitlistAPI.getByEvent(parseInt(selectedEventId));
      const data = response.data || response;
      setWaitlists(data.waitlists || data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi tải danh sách chờ');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedWaitlist) return;

    try {
      setActionLoading(true);
      await adminWaitlistAPI.delete(selectedWaitlist.waitlistId);
      setDeleteDialogOpen(false);
      setSelectedWaitlist(null);
      fetchWaitlists();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi xóa');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFulfill = async () => {
    if (!selectedWaitlist) return;

    try {
      setActionLoading(true);
      await adminWaitlistAPI.fulfill(selectedWaitlist.waitlistId);
      setFulfillDialogOpen(false);
      setSelectedWaitlist(null);
      fetchWaitlists();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi đánh dấu phân phối');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckAvailability = async (ticketTypeId) => {
    if (!ticketTypeId) return;

    try {
      setActionLoading(true);
      await waitlistAPI.checkAvailability(ticketTypeId);
      fetchWaitlists();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Notified':
        return 'success';
      case 'Fulfilled':
        return 'info';
      case 'Cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'Pending':
        return 'Đang chờ';
      case 'Notified':
        return 'Đã được thông báo';
      case 'Fulfilled':
        return 'Đã nhận vé';
      case 'Cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  if (!user || user.role !== 'Admin') {
    return (
      <Container>
        <Alert severity="error">Bạn không có quyền truy cập trang này</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <QueueIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Quản lý danh sách chờ
          </Typography>
        </Stack>

        <FormControl fullWidth sx={{ mb: 3, maxWidth: 400 }}>
          <InputLabel>Chọn sự kiện</InputLabel>
          <Select
            value={selectedEventId}
            label="Chọn sự kiện"
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            <MenuItem value="">
              <em>Tất cả sự kiện</em>
            </MenuItem>
            {events.map((event) => (
              <MenuItem key={event.eventId} value={event.eventId}>
                {event.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedEventId && (
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchWaitlists}
            disabled={loading}
            sx={{ mb: 2 }}
          >
            Làm mới
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : !selectedEventId ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <EventIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" color="text.secondary">
            Vui lòng chọn sự kiện để xem danh sách chờ
          </Typography>
        </Card>
      ) : waitlists.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <QueueIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" color="text.secondary">
            Không có danh sách chờ nào cho sự kiện này
          </Typography>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Vị trí</strong></TableCell>
                <TableCell><strong>Người dùng</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Loại vé</strong></TableCell>
                <TableCell><strong>Số lượng</strong></TableCell>
                <TableCell><strong>Số vé còn lại</strong></TableCell>
                <TableCell><strong>Trạng thái</strong></TableCell>
                <TableCell><strong>Ngày đăng ký</strong></TableCell>
                <TableCell><strong>Thao tác</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {waitlists.map((waitlist) => (
                <TableRow key={waitlist.waitlistId} hover>
                  <TableCell>#{waitlist.priority}</TableCell>
                  <TableCell>{waitlist.userName}</TableCell>
                  <TableCell>{waitlist.userEmail}</TableCell>
                  <TableCell>{waitlist.ticketTypeName || 'N/A'}</TableCell>
                  <TableCell>{waitlist.quantity}</TableCell>
                  <TableCell>
                    {waitlist.availableQuantity !== null && waitlist.availableQuantity !== undefined ? (
                      <Chip
                        label={waitlist.availableQuantity > 0 ? `Còn ${waitlist.availableQuantity}` : 'Hết vé'}
                        color={waitlist.availableQuantity > 0 ? 'success' : 'default'}
                        size="small"
                        variant={waitlist.availableQuantity > 0 ? 'filled' : 'outlined'}
                      />
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(waitlist.status)}
                      color={getStatusColor(waitlist.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {formatVietnamDateTimeShort(waitlist.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      {waitlist.status === 'Notified' && (
                        <Tooltip title="Đánh dấu đã phân phối">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => {
                              setSelectedWaitlist(waitlist);
                              setFulfillDialogOpen(true);
                            }}
                            disabled={actionLoading}
                          >
                            <FulfillIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {(waitlist.status === 'Pending' || waitlist.status === 'Notified') && (
                        <Tooltip title="Xóa">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setSelectedWaitlist(waitlist);
                              setDeleteDialogOpen(true);
                            }}
                            disabled={actionLoading}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {waitlist.ticketTypeId && (
                        <Tooltip title="Kiểm tra và thông báo">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleCheckAvailability(waitlist.ticketTypeId)}
                            disabled={actionLoading}
                          >
                            <RefreshIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa đăng ký danh sách chờ của <strong>{selectedWaitlist?.userName}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={actionLoading}>
            {actionLoading ? 'Đang xử lý...' : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fulfill Dialog */}
      <Dialog open={fulfillDialogOpen} onClose={() => setFulfillDialogOpen(false)}>
        <DialogTitle>Xác nhận phân phối</DialogTitle>
        <DialogContent>
          <Typography>
            Đánh dấu đã phân phối vé cho <strong>{selectedWaitlist?.userName}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFulfillDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleFulfill} color="success" variant="contained" disabled={actionLoading}>
            {actionLoading ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminWaitlistPage;

