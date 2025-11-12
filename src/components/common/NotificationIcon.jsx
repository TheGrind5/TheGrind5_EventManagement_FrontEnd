import React, { useState, useEffect } from 'react';
import { 
  IconButton, 
  Badge, 
  Tooltip, 
  Popover, 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Button,
  CircularProgress,
  Divider
} from '@mui/material';
import { 
  Notifications as NotificationsIcon, 
  NotificationsNone as NotificationsNoneIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { notificationAPI } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const NotificationIcon = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Refresh notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications(1, 5);
      const data = response.data || {};
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (event) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      // Update local state
      setNotifications(notifications.map(n => 
        n.notificationId === notificationId 
          ? { ...n, isRead: true, readAt: new Date().toISOString() } 
          : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'EventReminder': return '📅';
      case 'EventUpdate': return '📢';
      case 'EventCancelled': 
      case 'EventRejected':
        return '❌';
      case 'OrderConfirmation': 
      case 'EventApproved':
        return '✅';
      case 'PaymentSuccess': return '💰';
      case 'Refund': return '💸';
      case 'EventReport': return '🚩';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'EventReminder': return '#28a745';
      case 'EventUpdate': return '#ffc107';
      case 'EventCancelled': 
      case 'EventRejected':
        return '#dc3545';
      case 'OrderConfirmation': 
      case 'EventApproved':
        return '#17a2b8';
      case 'PaymentSuccess': return '#28a745';
      case 'Refund': return '#6f42c1';
      case 'EventReport': return '#f44336';
      default: return '#007bff';
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="Thông báo">
        <span>
          <IconButton 
            color="inherit" 
            onClick={handleClick}
            disabled={!user}
            sx={{
              width: 40,
              height: 40
            }}
          >
            <Badge 
              badgeContent={unreadCount} 
              color="error"
              max={99}
            >
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </span>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 380,
            maxHeight: 400,
            borderRadius: 2,
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" fontWeight={700}>
              Thông báo
            </Typography>
            {unreadCount > 0 && (
              <Button 
                size="small" 
                onClick={handleMarkAllAsRead}
                sx={{ fontSize: '0.75rem' }}
              >
                Đánh dấu tất cả đã đọc
              </Button>
            )}
          </Box>
        </Box>

        <Divider />

        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <NotificationsNoneIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Không có thông báo
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.notificationId}>
                  <ListItem
                    sx={{
                      bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.selected'
                      }
                    }}
                    onClick={() => {
                      if (!notification.isRead) {
                        handleMarkAsRead(notification.notificationId);
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        sx={{ 
                          bgcolor: getNotificationColor(notification.type),
                          width: 40,
                          height: 40
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography 
                            variant="subtitle2" 
                            fontWeight={notification.isRead ? 400 : 600}
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
                        </Box>
                      }
                      secondary={
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {notification.content || 'Không có nội dung'}
                        </Typography>
                      }
                    />
                    {notification.isRead && (
                      <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    )}
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {notifications.length > 0 && (
          <>
            <Divider />
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Button 
                size="small" 
                variant="text"
                onClick={() => {
                  handleClose();
                  navigate('/notifications');
                }}
              >
                Xem tất cả thông báo
              </Button>
            </Box>
          </>
        )}
      </Popover>
    </>
  );
};

export default NotificationIcon;

