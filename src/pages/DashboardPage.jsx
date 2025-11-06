import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Stack,
  Alert,
  useTheme,
  useMediaQuery,
  Paper,
  Divider,
  Avatar,
  IconButton,
  Skeleton,
  Pagination,
  Tooltip,
  Fade,
  Zoom
} from '@mui/material';
import {
  Event as EventIcon,
  LocationOn as LocationIcon,
  AccessTime as AccessTimeIcon,
  Category as CategoryIcon,
  ArrowForward,
  ConfirmationNumber as TicketIcon,
  Receipt as OrderIcon,
  AccountBalanceWallet as WalletIcon,
  Notifications as NotificationIcon,
  TrendingUp,
  Visibility,
  Star,
  Add,
  School as CampusIcon
} from '@mui/icons-material';
import Header from '../components/layout/Header';
import { useAuth } from '../contexts/AuthContext';
import { eventsAPI, ticketsAPI, ordersAPI, walletAPI, notificationAPI, announcementAPI } from '../services/apiClient';
import { decodeText } from '../utils/textDecoder';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    tickets: 0,
    orders: 0,
    walletBalance: 0,
    unreadNotifications: 0
  });
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch events with pagination
        const eventsResponse = await eventsAPI.getAll(page, pageSize);
        let eventArray = [];
        let total = 0;
        
        if (Array.isArray(eventsResponse.data)) {
          eventArray = eventsResponse.data;
        } else if (Array.isArray(eventsResponse.data?.data)) {
          eventArray = eventsResponse.data.data;
        } else if (eventsResponse.data?.data && Array.isArray(eventsResponse.data.data)) {
          eventArray = eventsResponse.data.data;
        }
        
        // Get total count for pagination
        if (eventsResponse.data?.totalCount !== undefined) {
          total = eventsResponse.data.totalCount;
        } else if (eventsResponse.data?.total !== undefined) {
          total = eventsResponse.data.total;
        } else {
          total = eventArray.length;
        }
        
        setEvents(eventArray);
        setTotalCount(total);
        
        // Fetch statistics in parallel
        const [ticketsRes, ordersRes, walletRes, notificationsRes, announcementsRes] = await Promise.allSettled([
          ticketsAPI.getMyTickets().catch(() => ({ data: [] })),
          ordersAPI.getMyOrders().catch(() => ({ data: [] })),
          walletAPI.getBalance().catch(() => ({ data: { balance: 0 } })),
          notificationAPI.getNotifications(1, 1).catch(() => ({ data: { notifications: [], unreadCount: 0 } })),
          announcementAPI.getActive().catch(() => ({ data: [] }))
        ]);
        
        // Xử lý tickets - kiểm tra nhiều cấu trúc dữ liệu
        let tickets = [];
        if (ticketsRes.status === 'fulfilled' && ticketsRes.value?.data) {
          const data = ticketsRes.value.data;
          if (Array.isArray(data)) {
            tickets = data;
          } else if (Array.isArray(data?.tickets)) {
            tickets = data.tickets;
          } else if (Array.isArray(data?.data)) {
            tickets = data.data;
          }
        }
        
        // Xử lý orders - kiểm tra nhiều cấu trúc dữ liệu
        let orders = [];
        if (ordersRes.status === 'fulfilled' && ordersRes.value?.data) {
          const data = ordersRes.value.data;
          if (Array.isArray(data)) {
            orders = data;
          } else if (Array.isArray(data?.orders)) {
            orders = data.orders;
          } else if (Array.isArray(data?.data)) {
            orders = data.data;
          }
        }
        
        // Xử lý wallet balance
        const walletBalance = walletRes.status === 'fulfilled'
          ? (walletRes.value?.data?.balance || walletRes.value?.data || walletRes.value?.balance || 0)
          : 0;
        
        // Xử lý notifications
        const notificationsData = notificationsRes.status === 'fulfilled'
          ? (notificationsRes.value?.data || {})
          : {};
        const unreadNotifications = notificationsData.unreadCount || 0;
        
        // Xử lý announcements
        let announcementsData = [];
        if (announcementsRes.status === 'fulfilled' && announcementsRes.value?.data) {
          const data = announcementsRes.value.data;
          if (Array.isArray(data)) {
            announcementsData = data;
          } else if (Array.isArray(data?.data)) {
            announcementsData = data.data;
          }
        }
        setAnnouncements(announcementsData);
        
        // Đếm số lượng vé và đơn hàng
        const ticketCount = Array.isArray(tickets) ? tickets.length : 0;
        const orderCount = Array.isArray(orders) ? orders.length : 0;
        
        setStats({
          tickets: ticketCount,
          orders: orderCount,
          walletBalance,
          unreadNotifications
        });
        
      } catch (err) {
        setError('Không thể tải dữ liệu dashboard');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAllData();
    }
  }, [user, page, pageSize]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Format short title for FPT Play style cards
  const getShortTitle = (fullTitle) => {
    if (!fullTitle) return '';
    
    // Remove common prefixes that make titles long
    const prefixes = ['Mơ Thay Em - ', 'Đêm Nhạc Thiện Nguyện Vì ', 'BẢN HÒA CA – ', 'Cùng Đồng Bào '];
    let shortTitle = fullTitle;
    
    for (const prefix of prefixes) {
      if (fullTitle.startsWith(prefix)) {
        shortTitle = fullTitle.replace(prefix, '');
        break;
      }
    }
    
    // If still too long, take first meaningful part
    const parts = shortTitle.split('–').map(p => p.trim());
    if (parts[0].length <= 30) {
      return parts[0];
    }
    
    // Truncate if still too long
    return shortTitle.length > 30 ? shortTitle.substring(0, 27) + '...' : shortTitle;
  };

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: 'background.default',
        width: '100%',
        maxWidth: '100vw',
        overflowX: 'hidden',
        position: 'relative'
      }}>
        <Header />
        <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, width: '100%', maxWidth: '100%' }}>
          <Stack spacing={4}>
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3 }} />
            <Grid container spacing={3}>
              {[1, 2, 3, 4].map(i => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
                </Grid>
              ))}
            </Grid>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
          </Stack>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      width: '100%',
      maxWidth: '100vw',
      overflowX: 'hidden',
      position: 'relative'
    }}>
      <Header />
      
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
        {/* Scrolling Announcements - Above Welcome Banner */}
        {announcements.length > 0 && (
          <Box
            sx={{
              mb: 2,
              overflow: 'hidden',
              position: 'relative',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 152, 0, 0.15)',
              borderRadius: 2,
              py: 1.5,
              border: `2px solid ${theme.palette.primary.main}`,
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '50px',
                background: 'linear-gradient(to right, rgba(255, 152, 0, 0.15), transparent)',
                zIndex: 1,
                pointerEvents: 'none'
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '50px',
                background: 'linear-gradient(to left, rgba(255, 152, 0, 0.15), transparent)',
                zIndex: 1,
                pointerEvents: 'none'
              }
            }}
          >
            <Box
              sx={{
                display: 'inline-flex',
                whiteSpace: 'nowrap',
                animation: 'scroll-left 40s linear infinite',
                '@keyframes scroll-left': {
                  '0%': {
                    transform: 'translateX(100%)'
                  },
                  '100%': {
                    transform: 'translateX(-100%)'
                  }
                }
              }}
            >
              {/* Duplicate announcements for seamless loop */}
              {[...announcements, ...announcements].map((announcement, index) => (
                <Typography
                  key={`${announcement.announcementId || announcement.AnnouncementId || index}-${Math.floor(index / announcements.length)}`}
                  variant="body1"
                  component="span"
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    px: 4,
                    display: 'inline-block',
                    flexShrink: 0
                  }}
                >
                  {announcement.content || announcement.Content} • 
                </Typography>
              ))}
            </Box>
          </Box>
        )}

        {/* Welcome Header with Gradient - Moved down slightly */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            mb: 4,
            mt: 3, // Di chuyển xuống một chút
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            color: 'white',
            borderRadius: 4,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -100,
              left: -100,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h3" component="h1" fontWeight={700} gutterBottom>
                  Chào mừng, {user?.fullName || 'Bạn'}! 👋
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.95, fontWeight: 400 }}>
                  Khám phá các sự kiện thú vị đang chờ bạn
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="large"
                startIcon={<Visibility />}
                onClick={() => navigate('/')}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                  },
                  px: 4,
                  py: 1.5,
                  borderRadius: 3
                }}
              >
                Xem tất cả sự kiện
              </Button>
            </Stack>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                transition: 'all 0.3s ease',
                background: `linear-gradient(135deg, ${theme.palette.primary.light}15 0%, ${theme.palette.primary.main}10 100%)`,
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 24px ${theme.palette.primary.main}25`,
                  borderColor: theme.palette.primary.main
                }
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Vé của tôi
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="primary.main">
                      {stats.tickets}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      width: 56,
                      height: 56
                    }}
                  >
                    <TicketIcon />
                  </Avatar>
                </Stack>
              </CardContent>
              <Box sx={{ px: 2, pb: 2 }}>
                <Button
                  component={Link}
                  to="/my-tickets"
                  size="small"
                  endIcon={<ArrowForward />}
                  sx={{ textTransform: 'none' }}
                >
                  Xem chi tiết
                </Button>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                transition: 'all 0.3s ease',
                background: `linear-gradient(135deg, ${theme.palette.success.light}15 0%, ${theme.palette.success.main}10 100%)`,
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 24px ${theme.palette.success.main}25`,
                  borderColor: theme.palette.success.main
                }
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Đơn hàng
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="success.main">
                      {stats.orders}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: 'success.main',
                      width: 56,
                      height: 56
                    }}
                  >
                    <OrderIcon />
                  </Avatar>
                </Stack>
              </CardContent>
              <Box sx={{ px: 2, pb: 2 }}>
                <Button
                  component={Link}
                  to="/dashboard"
                  size="small"
                  endIcon={<ArrowForward />}
                  sx={{ textTransform: 'none' }}
                >
                  Xem lịch sử
                </Button>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                transition: 'all 0.3s ease',
                background: `linear-gradient(135deg, ${theme.palette.warning.light}15 0%, ${theme.palette.warning.main}10 100%)`,
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 24px ${theme.palette.warning.main}25`,
                  borderColor: theme.palette.warning.main
                }
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Số dư ví
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="warning.main">
                      {formatCurrency(stats.walletBalance)}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: 'warning.main',
                      width: 56,
                      height: 56
                    }}
                  >
                    <WalletIcon />
                  </Avatar>
                </Stack>
              </CardContent>
              <Box sx={{ px: 2, pb: 2 }}>
                <Button
                  component={Link}
                  to="/wallet"
                  size="small"
                  endIcon={<ArrowForward />}
                  sx={{ textTransform: 'none' }}
                >
                  Nạp tiền
                </Button>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                transition: 'all 0.3s ease',
                background: `linear-gradient(135deg, ${theme.palette.error.light}15 0%, ${theme.palette.error.main}10 100%)`,
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 24px ${theme.palette.error.main}25`,
                  borderColor: theme.palette.error.main
                }
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Thông báo
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="error.main">
                      {stats.unreadNotifications}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: 'error.main',
                      width: 56,
                      height: 56,
                      position: 'relative'
                    }}
                  >
                    <NotificationIcon />
                    {stats.unreadNotifications > 0 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          bgcolor: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Typography variant="caption" fontWeight={700} color="error.main">
                          {stats.unreadNotifications}
                        </Typography>
                      </Box>
                    )}
                  </Avatar>
                </Stack>
              </CardContent>
              <Box sx={{ px: 2, pb: 2 }}>
                <Button
                  component={Link}
                  to="/notifications"
                  size="small"
                  endIcon={<ArrowForward />}
                  sx={{ textTransform: 'none' }}
                >
                  Xem tất cả
                </Button>
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Card elevation={0} sx={{ mb: 4, border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
              Thao tác nhanh
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4} md={2}>
                <Button
                  component={Link}
                  to="/my-tickets"
                  variant="outlined"
                  fullWidth
                  sx={{ py: 2, borderRadius: 2 }}
                  startIcon={<TicketIcon />}
                >
                  Vé của tôi
                </Button>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Button
                  component={Link}
                  to="/wallet"
                  variant="outlined"
                  fullWidth
                  sx={{ py: 2, borderRadius: 2 }}
                  startIcon={<WalletIcon />}
                >
                  Ví điện tử
                </Button>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Button
                  component={Link}
                  to="/notifications"
                  variant="outlined"
                  fullWidth
                  sx={{ py: 2, borderRadius: 2 }}
                  startIcon={<NotificationIcon />}
                >
                  Thông báo
                </Button>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Button
                  component={Link}
                  to="/wishlist"
                  variant="outlined"
                  fullWidth
                  sx={{ py: 2, borderRadius: 2 }}
                  startIcon={<Star />}
                >
                  Yêu thích
                </Button>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Button
                  component={Link}
                  to="/profile"
                  variant="outlined"
                  fullWidth
                  sx={{ py: 2, borderRadius: 2 }}
                  startIcon={<Add />}
                >
                  Hồ sơ
                </Button>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Button
                  component={Link}
                  to="/"
                  variant="outlined"
                  fullWidth
                  sx={{ py: 2, borderRadius: 2 }}
                  startIcon={<EventIcon />}
                >
                  Sự kiện
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* All Events Section */}
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Typography variant="h5" fontWeight={700}>
              Tất cả sự kiện
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {totalCount > 0 ? `Tổng cộng: ${totalCount} sự kiện` : 'Chưa có sự kiện nào'}
            </Typography>
          </Stack>
          
          {events.length === 0 && !loading ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Hiện chưa có sự kiện nào
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hãy quay lại sau để xem các sự kiện mới
              </Typography>
            </Paper>
          ) : (
            <>
              <Grid 
                container 
                spacing={2}
                justifyContent="center"
                sx={{ 
                  mb: 6,
                  '& > .MuiGrid-item': {
                    display: 'flex'
                  }
                }}
                alignItems="stretch"
              >
                {events.map((event) => {
                // Dashboard sử dụng eventImage (720x958) để hiển thị ban đầu
                const eventImage = event.eventImage || null;
                const imageUrl = eventImage ? 
                  (eventImage.startsWith('http') ? eventImage : `http://localhost:5000${eventImage.startsWith('/') ? '' : '/'}${eventImage}`) : 
                  null;
                
                // BackgroundImage (1280x720) để hiển thị trong hover popup
                const backgroundImage = event.backgroundImage || null;
                const hoverImageUrl = backgroundImage ? 
                  (backgroundImage.startsWith('http') ? backgroundImage : `http://localhost:5000${backgroundImage.startsWith('/') ? '' : '/'}${backgroundImage}`) : 
                  imageUrl;

                const shortTitle = getShortTitle(decodeText(event.title));

                return (
                  <Grid 
                    item 
                    xs={6}
                    sm={4}
                    md={2}
                    key={event.eventId}
                    sx={{
                      display: 'flex',
                      minWidth: 0,
                      position: 'relative'
                    }}
                  >
                    <Tooltip
                      title={
                        <Box sx={{ p: 2, maxWidth: 400 }}>
                          <Box 
                            sx={{ 
                              mb: 2,
                              height: 200,
                              borderRadius: 2,
                              overflow: 'hidden',
                              position: 'relative'
                            }}
                          >
                            {hoverImageUrl ? (
                              <CardMedia
                                component="img"
                                image={hoverImageUrl}
                                alt={decodeText(event.title)}
                                sx={{ 
                                  objectFit: 'cover',
                                  width: '100%',
                                  height: '100%'
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  height: '100%',
                                  width: '100%',
                                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <EventIcon sx={{ fontSize: 48, color: 'white', opacity: 0.8 }} />
                              </Box>
                            )}
                          </Box>
                          <Typography variant="h6" fontWeight={700} sx={{ color: 'white', mb: 1.5 }}>
                            {decodeText(event.title)}
                          </Typography>
                          <Stack spacing={1}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AccessTimeIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }} />
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                {formatDate(event.startTime)}
                              </Typography>
                            </Box>
                            {event.campus && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CampusIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }} />
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                  {event.campus}
                                </Typography>
                              </Box>
                            )}
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                              <LocationIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', mt: 0.25 }} />
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>
                                {decodeText(event.location)}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      }
                      placement="top"
                      arrow
                      TransitionComponent={Zoom}
                      PopperProps={{
                        sx: {
                          '& .MuiTooltip-tooltip': {
                            backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#2a2a2a',
                            borderRadius: 3,
                            maxWidth: 450,
                            border: `1px solid rgba(255, 122, 0, 0.3)`,
                            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)'
                          },
                          '& .MuiTooltip-arrow': {
                            color: theme.palette.mode === 'dark' ? '#1a1a1a' : '#2a2a2a'
                          }
                        }
                      }}
                    >
                      <Card
                        component={Link}
                        to={`/event/${event.eventId}`}
                        elevation={0}
                        sx={{
                          width: '100%',
                          height: '280px',
                          display: 'flex',
                          flexDirection: 'column',
                          cursor: 'pointer',
                          border: 'none',
                          borderRadius: 2,
                          overflow: 'hidden',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          '&:hover': {
                            transform: 'scale(1.05) translateY(-8px)',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                            '& .event-image': {
                              transform: 'scale(1.1)'
                            }
                          }
                        }}
                      >
                        {/* Image Section - FPT Play Style */}
                        <Box 
                          className="event-image"
                          sx={{ 
                            height: 240,
                            minHeight: 240,
                            maxHeight: 240,
                            flexShrink: 0, 
                            overflow: 'hidden', 
                            position: 'relative',
                            backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        >
                          {imageUrl ? (
                            <CardMedia
                              component="img"
                              image={imageUrl}
                              alt={shortTitle}
                              sx={{ 
                                objectFit: 'cover', 
                                width: '100%', 
                                height: '100%',
                                display: 'block'
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                height: '100%',
                                width: '100%',
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <EventIcon sx={{ fontSize: 64, color: 'white', opacity: 0.8 }} />
                            </Box>
                          )}
                        </Box>
                        
                        {/* Short Title at Bottom - FPT Play Style */}
                        <Box 
                          sx={{ 
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0.4) 80%, transparent 100%)',
                            p: 2.5,
                            pb: 3.5
                          }}
                        >
                          <Typography
                            variant="body1"
                            fontWeight={700}
                            sx={{
                              color: 'white',
                              fontSize: '0.95rem',
                              lineHeight: 1.4,
                              textAlign: 'center',
                              textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.8)',
                              letterSpacing: '0.01em'
                            }}
                          >
                            {shortTitle}
                          </Typography>
                        </Box>
                      </Card>
                    </Tooltip>
                  </Grid>
                );
                })}
              </Grid>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default DashboardPage;