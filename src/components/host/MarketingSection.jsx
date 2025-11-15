import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Grid,
  Avatar,
  Button,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Tooltip,
  IconButton,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  Email,
  Share,
  Visibility,
  AccessTime,
  Facebook,
  Twitter,
  LinkedIn,
  ContentCopy,
  Refresh,
  CheckCircle,
  ConfirmationNumber,
  AttachMoney,
  People,
  Favorite,
  Receipt,
  TrendingUp,
  Campaign,
  Analytics
} from '@mui/icons-material';
import { hostMarketingAPI } from '../../services/apiClient';

const formatCurrency = (amount) => {
  const value = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(value);
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDateTimeLocalInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
};

const normalizeEventSummary = (item) => ({
  eventId: item?.eventId ?? item?.EventId ?? 0,
  eventName: item?.eventName ?? item?.EventName ?? item?.title ?? item?.Title ?? 'Sự kiện',
  startTime: item?.startTime ?? item?.StartTime ?? null,
  endTime: item?.endTime ?? item?.EndTime ?? null,
  status: item?.status ?? item?.Status ?? 'Draft',
  ticketsSold: item?.ticketsSold ?? item?.TicketsSold ?? 0,
  totalRevenue: item?.totalRevenue ?? item?.TotalRevenue ?? 0,
  uniqueCustomers: item?.uniqueCustomers ?? item?.UniqueCustomers ?? 0,
  wishlistCount: item?.wishlistCount ?? item?.WishlistCount ?? 0,
  lastOrderAt: item?.lastOrderAt ?? item?.LastOrderAt ?? null
});

const normalizeAnalytics = (payload, fallbackId) => ({
  eventId: payload?.eventId ?? payload?.EventId ?? fallbackId,
  eventName: payload?.eventName ?? payload?.EventName ?? '',
  startTime: payload?.startTime ?? payload?.StartTime ?? null,
  endTime: payload?.endTime ?? payload?.EndTime ?? null,
  status: payload?.status ?? payload?.Status ?? 'Draft',
  ticketsSold: payload?.ticketsSold ?? payload?.TicketsSold ?? 0,
  totalRevenue: payload?.totalRevenue ?? payload?.TotalRevenue ?? 0,
  uniqueCustomers: payload?.uniqueCustomers ?? payload?.UniqueCustomers ?? 0,
  wishlistCount: payload?.wishlistCount ?? payload?.WishlistCount ?? 0,
  ordersLast7Days: payload?.ordersLast7Days ?? payload?.OrdersLast7Days ?? 0,
  ticketsLast7Days: payload?.ticketsLast7Days ?? payload?.TicketsLast7Days ?? 0,
  revenueLast7Days: payload?.revenueLast7Days ?? payload?.RevenueLast7Days ?? 0,
  lastOrderAt: payload?.lastOrderAt ?? payload?.LastOrderAt ?? null
});

const normalizeAudiencePreview = (payload, fallbackId) => ({
  eventId: payload?.eventId ?? payload?.EventId ?? fallbackId,
  eventName: payload?.eventName ?? payload?.EventName ?? '',
  totalRecipients: payload?.totalRecipients ?? payload?.TotalRecipients ?? 0,
  previewEmails: payload?.previewEmails ?? payload?.PreviewEmails ?? []
});

const MarketingSection = () => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [audiencePreview, setAudiencePreview] = useState(null);
  const [audienceLoading, setAudienceLoading] = useState(false);

  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const [broadcastSubmitting, setBroadcastSubmitting] = useState(false);
  const [reminderSubmitting, setReminderSubmitting] = useState(false);

  const [broadcastForm, setBroadcastForm] = useState({
    subject: '',
    message: '',
    callToActionUrl: '',
    includePendingOrders: false
  });

  const [reminderForm, setReminderForm] = useState({
    additionalMessage: '',
    customStartTime: ''
  });

  const [copySuccess, setCopySuccess] = useState(false);

  const fetchAnalytics = useCallback(async (eventId) => {
    if (!eventId) {
      setAnalytics(null);
      return;
    }

    try {
      setAnalyticsLoading(true);
      setError(null);
      const response = await hostMarketingAPI.getEventAnalytics(eventId);
      setAnalytics(normalizeAnalytics(response?.data, eventId));
    } catch (err) {
      console.error('Fetch analytics failed', err);
      setError(err.message || 'Không thể tải dữ liệu analytics.');
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      setEventsLoading(true);
      setError(null);
      const response = await hostMarketingAPI.getEvents();
      const list = Array.isArray(response?.data) ? response.data : [];
      const normalized = list.map(normalizeEventSummary);
      setEvents(normalized);

      if (normalized.length > 0) {
        const defaultId = normalized[0].eventId;
        setSelectedEventId(defaultId);
        await fetchAnalytics(defaultId);
      } else {
        setSelectedEventId(null);
        setAnalytics(null);
      }
    } catch (err) {
      console.error('Fetch marketing events failed', err);
      const errorMessage = err.response?.data?.message || err.message || err.originalError?.message || 'Không thể tải dữ liệu marketing.';
      setError(errorMessage);
      
      // Log chi tiết để debug
      if (err.response) {
        console.error('API Error Response:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
          url: err.config?.url
        });
      }
    } finally {
      setEventsLoading(false);
    }
  }, [fetchAnalytics]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const fetchAudience = useCallback(async (eventId, includePending = false) => {
    if (!eventId) {
      setAudiencePreview(null);
      return;
    }

    try {
      setAudienceLoading(true);
      const response = await hostMarketingAPI.getAudiencePreview(eventId, includePending);
      setAudiencePreview(normalizeAudiencePreview(response?.data, eventId));
    } catch (err) {
      console.error('Fetch audience preview failed', err);
      setAudiencePreview(null);
    } finally {
      setAudienceLoading(false);
    }
  }, []);

  const handleSelectEvent = async (eventId) => {
    const normalizedId = Number(eventId);
    setSelectedEventId(normalizedId);
    await fetchAnalytics(normalizedId);
  };

  const handleOpenBroadcastDialog = async () => {
    if (!selectedEventId || !analytics) return;
    setBroadcastForm({
      subject: `Cập nhật sự kiện: ${analytics.eventName}`,
      message: '',
      callToActionUrl: '',
      includePendingOrders: false
    });
    setBroadcastDialogOpen(true);
    await fetchAudience(selectedEventId, false);
  };

  const handleBroadcastSubmit = async () => {
    if (!selectedEventId) return;

    if (!broadcastForm.subject.trim() || !broadcastForm.message.trim()) {
      alert('Vui lòng nhập tiêu đề và nội dung email.');
      return;
    }

    try {
      setBroadcastSubmitting(true);
      const payload = {
        eventId: selectedEventId,
        subject: broadcastForm.subject.trim(),
        message: broadcastForm.message.trim(),
        includePendingOrders: broadcastForm.includePendingOrders
      };

      if (broadcastForm.callToActionUrl.trim()) {
        payload.callToActionUrl = broadcastForm.callToActionUrl.trim();
      }

      const response = await hostMarketingAPI.sendBroadcast(payload);
      const result = response?.data;
      alert(result ? `Đã gửi ${result.successful ?? 0}/${result.totalRecipients ?? 0} email thành công.` : 'Đã gửi email.');
      setBroadcastDialogOpen(false);
      setBroadcastForm({
        subject: '',
        message: '',
        callToActionUrl: '',
        includePendingOrders: false
      });
    } catch (err) {
      console.error('Send broadcast email failed', err);
      alert(err.message || 'Không thể gửi email thông báo.');
    } finally {
      setBroadcastSubmitting(false);
    }
  };

  const handleOpenReminderDialog = async () => {
    if (!selectedEventId || !analytics) return;
    setReminderForm({
      additionalMessage: '',
      customStartTime: formatDateTimeLocalInput(analytics.startTime)
    });
    setReminderDialogOpen(true);
    await fetchAudience(selectedEventId, false);
  };

  const handleReminderSubmit = async () => {
    if (!selectedEventId) return;

    try {
      setReminderSubmitting(true);
      const payload = {
        eventId: selectedEventId,
        additionalMessage: reminderForm.additionalMessage.trim() ? reminderForm.additionalMessage.trim() : null,
        customStartTime: reminderForm.customStartTime ? new Date(reminderForm.customStartTime).toISOString() : null
      };

      const response = await hostMarketingAPI.sendReminder(payload);
      const result = response?.data;
      alert(result ? `Đã gửi nhắc nhở tới ${result.successful ?? 0}/${result.totalRecipients ?? 0} người nhận.` : 'Đã gửi nhắc nhở.');
      setReminderDialogOpen(false);
      setReminderForm({
        additionalMessage: '',
        customStartTime: ''
      });
    } catch (err) {
      console.error('Send reminder email failed', err);
      alert(err.message || 'Không thể gửi email nhắc nhở.');
    } finally {
      setReminderSubmitting(false);
    }
  };

  const handleOpenShareDialog = () => {
    if (!selectedEventId) return;
    setCopySuccess(false);
    setShareDialogOpen(true);
  };

  const handleCopyLink = async (link) => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Copy share link failed', err);
      setCopySuccess(false);
    }
  };

  const openShareLink = (url) => {
    if (!url) return;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener');
    }
  };

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return events.find(evt => evt.eventId === selectedEventId) || null;
  }, [events, selectedEventId]);

  const eventPublicUrl = useMemo(() => {
    if (!analytics) return '';
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    return `${base}/event/${analytics.eventId}`;
  }, [analytics]);

  const shareLinks = useMemo(() => {
    if (!eventPublicUrl) return {};
    const text = analytics?.eventName ?? 'Check out this event on FUTicket!';
    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventPublicUrl)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(eventPublicUrl)}&text=${encodeURIComponent(text)}`,
      linkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventPublicUrl)}`
    };
  }, [eventPublicUrl, analytics]);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header Section with Gradient */}
      <Box
        sx={{
          mb: 4,
          pb: 3,
          borderBottom: '2px solid',
          borderColor: 'divider',
          background: 'linear-gradient(135deg, rgba(255, 122, 0, 0.05) 0%, rgba(255, 122, 0, 0.02) 100%)',
          borderRadius: '12px 12px 0 0',
          p: 3,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #FF7A00 0%, #FF8A00 50%, #FF7A00 100%)',
          }
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 48,
              height: 48,
              background: 'linear-gradient(135deg, #FF7A00 0%, #FF8A00 100%)',
              boxShadow: '0 4px 12px rgba(255, 122, 0, 0.3)'
            }}
          >
            <Campaign />
          </Avatar>
          <Box>
            <Typography
              variant="h5"
              fontWeight={700}
              sx={{
                background: 'linear-gradient(135deg, #FF7A00 0%, #FF8A00 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.5px'
              }}
            >
              Marketing & Engagement
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Quản lý và tối ưu hóa chiến dịch marketing của bạn
            </Typography>
          </Box>
        </Stack>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'error.main',
            bgcolor: 'error.dark',
            '& .MuiAlert-icon': {
              color: 'error.light'
            }
          }} 
          onClose={() => setError(null)}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => fetchEvents()}
              sx={{ textTransform: 'none' }}
            >
              Thử lại
            </Button>
          }
        >
          <Typography variant="body2" fontWeight={600} gutterBottom>
            {error === 'Resource not found' 
              ? 'API endpoint không tìm thấy. Vui lòng kiểm tra:' 
              : 'Lỗi khi tải dữ liệu marketing:'}
          </Typography>
          <Typography variant="body2">
            {error === 'Resource not found' 
              ? '1. Backend đã được build và restart chưa?\n2. Controller HostMarketing đã được đăng ký đúng chưa?\n3. Kiểm tra console để xem chi tiết lỗi.'
              : error}
          </Typography>
        </Alert>
      )}

      {eventsLoading ? (
        <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={48} sx={{ color: 'primary.main', mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Đang tải dữ liệu marketing...
          </Typography>
        </Box>
      ) : events.length === 0 ? (
        <Paper 
          sx={{ 
            p: 6, 
            border: '2px dashed', 
            borderColor: 'divider', 
            borderRadius: 3,
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(255, 122, 0, 0.02) 0%, transparent 100%)'
          }}
        >
          <Analytics sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Chưa có dữ liệu marketing
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
            Bạn cần tạo ít nhất một sự kiện và có người mua vé để sử dụng các công cụ marketing.
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Event Selection & Stats Section */}
          <Paper 
            sx={{ 
              p: 4, 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: 3, 
              mb: 4,
              background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.8) 0%, rgba(18, 18, 18, 0.9) 100%)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={7}>
                <TextField
                  select
                  label="Chọn sự kiện"
                  value={selectedEventId ?? ''}
                  onChange={(event) => handleSelectEvent(event.target.value)}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                        borderWidth: 2,
                      }
                    }
                  }}
                >
                  {events.map(evt => (
                    <MenuItem key={evt.eventId} value={evt.eventId}>
                      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                        <Typography variant="body1" fontWeight={500}>{evt.eventName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(evt.startTime)}
                        </Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={5}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent={{ md: 'flex-end' }} alignItems={{ xs: 'stretch', sm: 'center' }}>
                  <Button 
                    variant="outlined" 
                    startIcon={<Refresh />} 
                    onClick={fetchEvents}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      borderColor: 'divider',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'rgba(255, 122, 0, 0.1)'
                      }
                    }}
                  >
                    Làm mới danh sách
                  </Button>
                  {selectedEvent && (
                    <Chip
                      label={selectedEvent.status}
                      color={selectedEvent.status === 'Open' ? 'success' : selectedEvent.status === 'Cancelled' ? 'error' : 'default'}
                      variant="outlined"
                      sx={{ 
                        fontWeight: 600,
                        borderWidth: 2,
                        height: 36
                      }}
                    />
                  )}
                </Stack>
              </Grid>
            </Grid>

            {analyticsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, py: 4 }}>
                <CircularProgress size={32} sx={{ color: 'primary.main' }} />
              </Box>
            ) : analytics ? (
              <>
                <Divider sx={{ my: 4, borderColor: 'divider' }} />
                <Typography variant="h6" fontWeight={600} mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Analytics sx={{ fontSize: 24, color: 'primary.main' }} />
                  Thống kê sự kiện
                </Typography>
                <Grid container spacing={2.5}>
                  {/* Main Stats */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper 
                      sx={{ 
                        p: 3, 
                        borderRadius: 2.5, 
                        border: '1px solid', 
                        borderColor: 'divider',
                        background: 'linear-gradient(135deg, rgba(255, 122, 0, 0.08) 0%, rgba(255, 122, 0, 0.02) 100%)',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '3px',
                          background: 'linear-gradient(90deg, #FF7A00 0%, #FF8A00 100%)',
                        },
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 24px rgba(255, 122, 0, 0.2)',
                          borderColor: 'primary.main'
                        }
                      }} 
                      elevation={0}
                    >
                      <Stack direction="row" alignItems="center" spacing={2} mb={1.5}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, opacity: 0.9 }}>
                          <ConfirmationNumber sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          Vé đã bán
                        </Typography>
                      </Stack>
                      <Typography variant="h4" fontWeight={700} sx={{ color: 'primary.main' }}>
                        {analytics.ticketsSold}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper 
                      sx={{ 
                        p: 3, 
                        borderRadius: 2.5, 
                        border: '1px solid', 
                        borderColor: 'divider',
                        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(76, 175, 80, 0.02) 100%)',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '3px',
                          background: 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%)',
                        },
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 24px rgba(76, 175, 80, 0.2)',
                          borderColor: 'success.main'
                        }
                      }} 
                      elevation={0}
                    >
                      <Stack direction="row" alignItems="center" spacing={2} mb={1.5}>
                        <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40, opacity: 0.9 }}>
                          <AttachMoney sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          Doanh thu
                        </Typography>
                      </Stack>
                      <Typography variant="h4" fontWeight={700} sx={{ color: 'success.main' }}>
                        {formatCurrency(analytics.totalRevenue)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper 
                      sx={{ 
                        p: 3, 
                        borderRadius: 2.5, 
                        border: '1px solid', 
                        borderColor: 'divider',
                        background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(33, 150, 243, 0.02) 100%)',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '3px',
                          background: 'linear-gradient(90deg, #2196F3 0%, #42A5F5 100%)',
                        },
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 24px rgba(33, 150, 243, 0.2)',
                          borderColor: 'info.main'
                        }
                      }} 
                      elevation={0}
                    >
                      <Stack direction="row" alignItems="center" spacing={2} mb={1.5}>
                        <Avatar sx={{ bgcolor: 'info.main', width: 40, height: 40, opacity: 0.9 }}>
                          <People sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          Khách hàng duy nhất
                        </Typography>
                      </Stack>
                      <Typography variant="h4" fontWeight={700} sx={{ color: 'info.main' }}>
                        {analytics.uniqueCustomers}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper 
                      sx={{ 
                        p: 3, 
                        borderRadius: 2.5, 
                        border: '1px solid', 
                        borderColor: 'divider',
                        background: 'linear-gradient(135deg, rgba(233, 30, 99, 0.08) 0%, rgba(233, 30, 99, 0.02) 100%)',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '3px',
                          background: 'linear-gradient(90deg, #E91E63 0%, #F06292 100%)',
                        },
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 24px rgba(233, 30, 99, 0.2)',
                          borderColor: 'secondary.main'
                        }
                      }} 
                      elevation={0}
                    >
                      <Stack direction="row" alignItems="center" spacing={2} mb={1.5}>
                        <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40, opacity: 0.9 }}>
                          <Favorite sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          Wishlist
                        </Typography>
                      </Stack>
                      <Typography variant="h4" fontWeight={700} sx={{ color: 'secondary.main' }}>
                        {analytics.wishlistCount}
                      </Typography>
                    </Paper>
                  </Grid>
                  {/* 7 Days Stats */}
                  <Grid item xs={12} md={4}>
                    <Paper 
                      sx={{ 
                        p: 3, 
                        borderRadius: 2.5, 
                        border: '1px solid', 
                        borderColor: 'divider',
                        background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.08) 0%, rgba(156, 39, 176, 0.02) 100%)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 16px rgba(156, 39, 176, 0.15)',
                        }
                      }} 
                      elevation={0}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
                        <Receipt sx={{ fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          Đơn hàng 7 ngày qua
                        </Typography>
                      </Stack>
                      <Typography variant="h5" fontWeight={700}>
                        {analytics.ordersLast7Days}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper 
                      sx={{ 
                        p: 3, 
                        borderRadius: 2.5, 
                        border: '1px solid', 
                        borderColor: 'divider',
                        background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.08) 0%, rgba(255, 152, 0, 0.02) 100%)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 16px rgba(255, 152, 0, 0.15)',
                        }
                      }} 
                      elevation={0}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
                        <TrendingUp sx={{ fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          Vé bán 7 ngày qua
                        </Typography>
                      </Stack>
                      <Typography variant="h5" fontWeight={700}>
                        {analytics.ticketsLast7Days}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper 
                      sx={{ 
                        p: 3, 
                        borderRadius: 2.5, 
                        border: '1px solid', 
                        borderColor: 'divider',
                        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(76, 175, 80, 0.02) 100%)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 16px rgba(76, 175, 80, 0.15)',
                        }
                      }} 
                      elevation={0}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
                        <AttachMoney sx={{ fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          Doanh thu 7 ngày qua
                        </Typography>
                      </Stack>
                      <Typography variant="h5" fontWeight={700} sx={{ color: 'success.main' }}>
                        {formatCurrency(analytics.revenueLast7Days)}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </>
            ) : null}
          </Paper>

          {/* Action Cards Section */}
          <Typography variant="h6" fontWeight={600} mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Campaign sx={{ fontSize: 24, color: 'primary.main' }} />
            Công cụ Marketing
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card 
                elevation={0} 
                sx={{ 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(18, 18, 18, 0.95) 100%)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #FF7A00 0%, #FF8A00 100%)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                  },
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(255, 122, 0, 0.25)',
                    borderColor: 'primary.main',
                    '&::before': {
                      opacity: 1
                    }
                  }
                }}
              >
                <CardContent sx={{ p: 3.5 }}>
                  <Stack direction="row" alignItems="center" spacing={2} mb={2.5}>
                    <Avatar 
                      sx={{ 
                        bgcolor: 'primary.main', 
                        width: 56, 
                        height: 56,
                        background: 'linear-gradient(135deg, #FF7A00 0%, #FF8A00 100%)',
                        boxShadow: '0 4px 16px rgba(255, 122, 0, 0.4)'
                      }}
                    >
                      <Email sx={{ fontSize: 28 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Gửi email thông báo
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Gửi thông báo tùy chỉnh đến tất cả người mua vé sự kiện.
                      </Typography>
                    </Box>
                  </Stack>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleOpenBroadcastDialog}
                    disabled={!selectedEventId}
                    sx={{
                      mt: 2,
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #FF7A00 0%, #FF8A00 100%)',
                      boxShadow: '0 4px 12px rgba(255, 122, 0, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #FF8A00 0%, #FF9A20 100%)',
                        boxShadow: '0 6px 20px rgba(255, 122, 0, 0.4)',
                        transform: 'translateY(-2px)'
                      },
                      '&:disabled': {
                        background: 'rgba(255, 122, 0, 0.3)',
                        color: 'text.secondary'
                      }
                    }}
                  >
                    Gửi ngay
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card 
                elevation={0} 
                sx={{ 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(18, 18, 18, 0.95) 100%)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #FF9800 0%, #FFB74D 100%)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                  },
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(255, 152, 0, 0.25)',
                    borderColor: 'warning.main',
                    '&::before': {
                      opacity: 1
                    }
                  }
                }}
              >
                <CardContent sx={{ p: 3.5 }}>
                  <Stack direction="row" alignItems="center" spacing={2} mb={2.5}>
                    <Avatar 
                      sx={{ 
                        bgcolor: 'warning.main', 
                        width: 56, 
                        height: 56,
                        background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
                        boxShadow: '0 4px 16px rgba(255, 152, 0, 0.4)'
                      }}
                    >
                      <AccessTime sx={{ fontSize: 28 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Gửi reminder trước sự kiện
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tự động nhắc người tham dự về thời gian diễn ra sự kiện.
                      </Typography>
                    </Box>
                  </Stack>
                  <Button
                    variant="contained"
                    color="warning"
                    fullWidth
                    onClick={handleOpenReminderDialog}
                    disabled={!selectedEventId}
                    sx={{
                      mt: 2,
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
                      boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #FFB74D 0%, #FFCC80 100%)',
                        boxShadow: '0 6px 20px rgba(255, 152, 0, 0.4)',
                        transform: 'translateY(-2px)'
                      },
                      '&:disabled': {
                        background: 'rgba(255, 152, 0, 0.3)',
                        color: 'text.secondary'
                      }
                    }}
                  >
                    Gửi reminder
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card 
                elevation={0} 
                sx={{ 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(18, 18, 18, 0.95) 100%)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #2196F3 0%, #42A5F5 100%)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                  },
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(33, 150, 243, 0.25)',
                    borderColor: 'info.main',
                    '&::before': {
                      opacity: 1
                    }
                  }
                }}
              >
                <CardContent sx={{ p: 3.5 }}>
                  <Stack direction="row" alignItems="center" spacing={2} mb={2.5}>
                    <Avatar 
                      sx={{ 
                        bgcolor: 'info.main', 
                        width: 56, 
                        height: 56,
                        background: 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)',
                        boxShadow: '0 4px 16px rgba(33, 150, 243, 0.4)'
                      }}
                    >
                      <Share sx={{ fontSize: 28 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Chia sẻ mạng xã hội
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tạo link chia sẻ nhanh lên Facebook, Twitter, LinkedIn.
                      </Typography>
                    </Box>
                  </Stack>
                  <Button
                    variant="contained"
                    color="info"
                    fullWidth
                    onClick={handleOpenShareDialog}
                    disabled={!selectedEventId}
                    sx={{
                      mt: 2,
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)',
                      boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #42A5F5 0%, #64B5F6 100%)',
                        boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)',
                        transform: 'translateY(-2px)'
                      },
                      '&:disabled': {
                        background: 'rgba(33, 150, 243, 0.3)',
                        color: 'text.secondary'
                      }
                    }}
                  >
                    Chia sẻ
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card 
                elevation={0} 
                sx={{ 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(18, 18, 18, 0.95) 100%)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                  },
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(76, 175, 80, 0.25)',
                    borderColor: 'success.main',
                    '&::before': {
                      opacity: 1
                    }
                  }
                }}
              >
                <CardContent sx={{ p: 3.5 }}>
                  <Stack direction="row" alignItems="center" spacing={2} mb={2.5}>
                    <Avatar 
                      sx={{ 
                        bgcolor: 'success.main', 
                        width: 56, 
                        height: 56,
                        background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                        boxShadow: '0 4px 16px rgba(76, 175, 80, 0.4)'
                      }}
                    >
                      <Visibility sx={{ fontSize: 28 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Theo dõi lượt xem & doanh thu
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Nắm bắt nhanh các chỉ số quan trọng trong 7 ngày gần nhất.
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack spacing={1.5} sx={{ mb: 2.5, mt: 2 }}>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      bgcolor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                        Đơn hàng gần nhất
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {analytics?.lastOrderAt ? formatDateTime(analytics.lastOrderAt) : 'Chưa có dữ liệu'}
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      bgcolor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                        Tổng doanh thu
                      </Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ color: 'success.main' }}>
                        {formatCurrency(analytics?.totalRevenue ?? 0)}
                      </Typography>
                    </Box>
                  </Stack>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => selectedEventId && fetchAnalytics(selectedEventId)}
                    disabled={!selectedEventId || analyticsLoading}
                    startIcon={<Refresh />}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      borderColor: 'divider',
                      '&:hover': {
                        borderColor: 'success.main',
                        bgcolor: 'rgba(76, 175, 80, 0.1)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    Làm mới dữ liệu
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* Broadcast Email Dialog */}
      <Dialog 
        open={broadcastDialogOpen} 
        onClose={() => setBroadcastDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(18, 18, 18, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5)'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(135deg, rgba(255, 122, 0, 0.1) 0%, transparent 100%)'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
              <Email />
            </Avatar>
            <Typography variant="h6" fontWeight={600}>
              Gửi email thông báo
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          {audienceLoading ? (
            <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={32} sx={{ color: 'primary.main', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Đang tải danh sách người nhận...
              </Typography>
            </Box>
          ) : (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Alert 
                severity="info"
                sx={{
                  borderRadius: 2,
                  bgcolor: 'rgba(33, 150, 243, 0.1)',
                  border: '1px solid',
                  borderColor: 'info.main',
                  '& .MuiAlert-icon': {
                    color: 'info.main'
                  }
                }}
              >
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Email sẽ gửi tới {audiencePreview?.totalRecipients ?? 0} người nhận.
                </Typography>
                {audiencePreview?.previewEmails?.length ? (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Ví dụ: {audiencePreview.previewEmails.slice(0, 3).join(', ')}
                      {audiencePreview.previewEmails.length > 3 && '...'}
                    </Typography>
                  </Box>
                ) : null}
              </Alert>
              <TextField
                label="Tiêu đề email"
                value={broadcastForm.subject}
                onChange={(event) => setBroadcastForm(prev => ({ ...prev, subject: event.target.value }))}
                fullWidth
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                      borderWidth: 2,
                    }
                  }
                }}
              />
              <TextField
                label="Nội dung email"
                value={broadcastForm.message}
                onChange={(event) => setBroadcastForm(prev => ({ ...prev, message: event.target.value }))}
                multiline
                minRows={5}
                fullWidth
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                      borderWidth: 2,
                    }
                  }
                }}
              />
              <TextField
                label="Link kêu gọi hành động (tùy chọn)"
                value={broadcastForm.callToActionUrl}
                onChange={(event) => setBroadcastForm(prev => ({ ...prev, callToActionUrl: event.target.value }))}
                fullWidth
                placeholder="https://example.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                      borderWidth: 2,
                    }
                  }
                }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={broadcastForm.includePendingOrders}
                    onChange={(event) => {
                      const includePending = event.target.checked;
                      setBroadcastForm(prev => ({ ...prev, includePendingOrders: includePending }));
                      if (selectedEventId) {
                        fetchAudience(selectedEventId, includePending);
                      }
                    }}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: 'primary.main',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: 'primary.main',
                      }
                    }}
                  />
                }
                label="Bao gồm cả đơn hàng đang chờ thanh toán"
                sx={{ mt: 1 }}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={() => setBroadcastDialogOpen(false)}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleBroadcastSubmit}
            disabled={broadcastSubmitting || audienceLoading || !broadcastForm.subject.trim() || !broadcastForm.message.trim()}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              background: 'linear-gradient(135deg, #FF7A00 0%, #FF8A00 100%)',
              boxShadow: '0 4px 12px rgba(255, 122, 0, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #FF8A00 0%, #FF9A20 100%)',
                boxShadow: '0 6px 20px rgba(255, 122, 0, 0.4)',
              },
              '&:disabled': {
                background: 'rgba(255, 122, 0, 0.3)',
                color: 'text.secondary'
              }
            }}
          >
            {broadcastSubmitting ? 'Đang gửi...' : 'Gửi email'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reminder Email Dialog */}
      <Dialog 
        open={reminderDialogOpen} 
        onClose={() => setReminderDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(18, 18, 18, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5)'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, transparent 100%)'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'warning.main', width: 40, height: 40 }}>
              <AccessTime />
            </Avatar>
            <Typography variant="h6" fontWeight={600}>
              Gửi email nhắc nhở
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          {audienceLoading ? (
            <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={32} sx={{ color: 'warning.main', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Đang tải danh sách người nhận...
              </Typography>
            </Box>
          ) : (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Alert 
                severity="info"
                sx={{
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 152, 0, 0.1)',
                  border: '1px solid',
                  borderColor: 'warning.main',
                  '& .MuiAlert-icon': {
                    color: 'warning.main'
                  }
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  Email nhắc nhở sẽ được gửi tới {audiencePreview?.totalRecipients ?? 0} người nhận.
                </Typography>
              </Alert>
              <TextField
                label="Thời gian sự kiện"
                type="datetime-local"
                value={reminderForm.customStartTime}
                onChange={(event) => setReminderForm(prev => ({ ...prev, customStartTime: event.target.value }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'warning.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'warning.main',
                      borderWidth: 2,
                    }
                  }
                }}
              />
              <TextField
                label="Thông điệp bổ sung (tùy chọn)"
                value={reminderForm.additionalMessage}
                onChange={(event) => setReminderForm(prev => ({ ...prev, additionalMessage: event.target.value }))}
                multiline
                minRows={4}
                fullWidth
                placeholder="Nhập thông điệp bổ sung cho email nhắc nhở..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'warning.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'warning.main',
                      borderWidth: 2,
                    }
                  }
                }}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={() => setReminderDialogOpen(false)}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleReminderSubmit}
            disabled={reminderSubmitting || audienceLoading}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
              boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #FFB74D 0%, #FFCC80 100%)',
                boxShadow: '0 6px 20px rgba(255, 152, 0, 0.4)',
              },
              '&:disabled': {
                background: 'rgba(255, 152, 0, 0.3)',
                color: 'text.secondary'
              }
            }}
          >
            {reminderSubmitting ? 'Đang gửi...' : 'Gửi reminder'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog 
        open={shareDialogOpen} 
        onClose={() => setShareDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(18, 18, 18, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5)'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, transparent 100%)'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'info.main', width: 40, height: 40 }}>
              <Share />
            </Avatar>
            <Typography variant="h6" fontWeight={600}>
              Chia sẻ sự kiện
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Link sự kiện"
              value={eventPublicUrl}
              fullWidth
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Sao chép link">
                      <IconButton 
                        onClick={() => handleCopyLink(eventPublicUrl)} 
                        edge="end" 
                        color={copySuccess ? 'success' : 'default'}
                        sx={{
                          '&:hover': {
                            bgcolor: copySuccess ? 'success.dark' : 'action.hover'
                          }
                        }}
                      >
                        {copySuccess ? <CheckCircle /> : <ContentCopy />}
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: 'info.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'info.main',
                    borderWidth: 2,
                  }
                }
              }}
            />
            {copySuccess && (
              <Alert 
                severity="success" 
                icon={<CheckCircle />}
                sx={{
                  borderRadius: 2,
                  bgcolor: 'rgba(76, 175, 80, 0.1)',
                  border: '1px solid',
                  borderColor: 'success.main'
                }}
              >
                Đã sao chép link vào clipboard.
              </Alert>
            )}
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 1 }}>
              Chia sẻ nhanh trên các nền tảng sau:
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
              <Button 
                variant="outlined" 
                startIcon={<Facebook />} 
                onClick={() => openShareLink(shareLinks.facebook)}
                sx={{ 
                  mb: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                  borderColor: '#1877F2',
                  color: '#1877F2',
                  '&:hover': {
                    borderColor: '#1877F2',
                    bgcolor: 'rgba(24, 119, 242, 0.1)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Facebook
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<Twitter />} 
                onClick={() => openShareLink(shareLinks.twitter)}
                sx={{ 
                  mb: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                  borderColor: '#1DA1F2',
                  color: '#1DA1F2',
                  '&:hover': {
                    borderColor: '#1DA1F2',
                    bgcolor: 'rgba(29, 161, 242, 0.1)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Twitter
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<LinkedIn />} 
                onClick={() => openShareLink(shareLinks.linkedIn)}
                sx={{ 
                  mb: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                  borderColor: '#0077B5',
                  color: '#0077B5',
                  '&:hover': {
                    borderColor: '#0077B5',
                    bgcolor: 'rgba(0, 119, 181, 0.1)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                LinkedIn
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={() => setShareDialogOpen(false)}
            variant="contained"
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              background: 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)',
              boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #42A5F5 0%, #64B5F6 100%)',
                boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)',
              }
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MarketingSection;

