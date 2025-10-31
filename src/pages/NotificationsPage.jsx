import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Button,
  CircularProgress,
  Pagination,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  NotificationsNone as NotificationsNoneIcon
} from '@mui/icons-material';
import { notificationAPI } from '../services/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const NotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ totalNotifications: 0, unreadNotifications: 0 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchNotifications();
    fetchStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
      fetchStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user, page]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications(page, pageSize);
      const data = response.data || {};
      setNotifications(data.notifications || []);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await notificationAPI.getStats();
      setStats(response.data || { totalNotifications: 0, unreadNotifications: 0 });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(notifications.map(n => 
        n.notificationId === notificationId 
          ? { ...n, isRead: true, readAt: new Date().toISOString() } 
          : n
      ));
      fetchStats();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      fetchStats();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteClick = (notification) => {
    setNotificationToDelete(notification);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!notificationToDelete) return;
    
    try {
      await notificationAPI.deleteNotification(notificationToDelete.notificationId);
      setNotifications(notifications.filter(n => n.notificationId !== notificationToDelete.notificationId));
      fetchStats();
      setDeleteDialogOpen(false);
      setNotificationToDelete(null);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'EventReminder': return '📅';
      case 'EventUpdate': return '📢';
      case 'EventCancelled': return '❌';
      case 'OrderConfirmation': return '✓';
      case 'PaymentSuccess': return '💰';
      case 'Refund': return '💸';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'EventReminder': return '#28a745';
      case 'EventUpdate': return '#ffc107';
      case 'EventCancelled': return '#dc3545';
      case 'OrderConfirmation': return '#17a2b8';
      case 'PaymentSuccess': return '#28a745';
      case 'Refund': return '#6f42c1';
      default: return '#007bff';
    }
  };

  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case 'EventReminder': return 'Nhắc nhở sự kiện';
      case 'EventUpdate': return 'Cập nhật sự kiện';
      case 'EventCancelled': return 'Sự kiện bị hủy';
      case 'OrderConfirmation': return 'Xác nhận đơn hàng';
      case 'PaymentSuccess': return 'Thanh toán thành công';
      case 'Refund': return 'Hoàn tiền';
      default: return 'Thông báo';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } else if (days > 0) {
      return `${days} ngày trước`;
    } else if (hours > 0) {
      return `${hours} giờ trước`;
    } else if (minutes > 0) {
      return `${minutes} phút trước`;
    } else {
      return 'Vừa xong';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Thông báo của tôi
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Chip 
            label={`Tổng: ${stats.totalNotifications}`} 
            color="default"
            variant="outlined"
          />
          <Chip 
            label={`Chưa đọc: ${stats.unreadNotifications}`} 
            color="error"
            variant="outlined"
          />
          {stats.unreadNotifications > 0 && (
            <Button 
              variant="outlined" 
              onClick={handleMarkAllAsRead}
              sx={{ ml: 'auto' }}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </Box>
      </Box>

      {/* Notifications List */}
      <Card sx={{ overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 8 }}>
            <NotificationsNoneIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Không có thông báo
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bạn sẽ nhận được thông báo về các sự kiện, đơn hàng và thanh toán ở đây
            </Typography>
          </Box>
        ) : (
          <>
            <List sx={{ p: 0 }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.notificationId}>
                  <ListItem
                    sx={{
                      bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                      '&:hover': {
                        bgcolor: 'action.selected'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        sx={{ 
                          bgcolor: getNotificationColor(notification.type),
                          width: 56,
                          height: 56,
                          fontSize: '1.5rem'
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography 
                            variant="subtitle1" 
                            fontWeight={notification.isRead ? 500 : 700}
                          >
                            {notification.title}
                          </Typography>
                          {!notification.isRead && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: 'primary.main'
                              }}
                            />
                          )}
                          <Chip 
                            label={getNotificationTypeLabel(notification.type)}
                            size="small"
                            sx={{ ml: 'auto' }}
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ mb: 1 }}
                          >
                            {notification.content || 'Không có nội dung'}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                          >
                            {formatDate(notification.createdAt)}
                          </Typography>
                        </>
                      }
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {!notification.isRead && (
                        <IconButton
                          size="small"
                          onClick={() => handleMarkAsRead(notification.notificationId)}
                          title="Đánh dấu đã đọc"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(notification)}
                        title="Xóa thông báo"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(event, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Xóa thông báo</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa thông báo này? Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default NotificationsPage;

