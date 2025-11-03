import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Card, CardContent, Typography, Tab, Tabs, Paper, CircularProgress, Alert, Stack, Avatar, Chip, Button, Divider, CardMedia, CardActions, IconButton } from '@mui/material';
import {
  TrendingUp, AttachMoney, ConfirmationNumber, People, QrCodeScanner, 
  Email, Share, Visibility, Assessment, Receipt, 
  Download, History, AccountBalance, CreditCard,
  Edit, Delete, Event as EventIcon, AccessTime, LocationOn
} from '@mui/icons-material';
import Header from '../components/layout/Header';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { eventsAPI, ordersAPI, ticketsAPI } from '../services/apiClient';
import { decodeText } from '../utils/textDecoder';
import SalesChart from '../components/host/SalesChart';

const HostDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [deletingEventId, setDeletingEventId] = useState(null);

  // Statistics State
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTicketsSold: 0,
    totalTicketsRemaining: 0,
    conversionRate: 0,
    totalEvents: 0,
    activeEvents: 0,
    upcomingEvents: 0
  });

  useEffect(() => {
    if (user) {
      fetchHostData();
    }
  }, [user]);

  const fetchHostData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch host's events
      const eventsResponse = await eventsAPI.getMyEvents();
      const hostEvents = Array.isArray(eventsResponse.data) ? eventsResponse.data : [];
      setEvents(hostEvents);

      // Calculate statistics - CHỈ từ events của host này
      let totalRevenue = 0;
      let totalTicketsSold = 0;
      let totalCapacity = 0;
      let activeEvents = 0;
      let upcomingEvents = 0;

      // Lặp qua từng event của host để tính toán statistics
      const now = new Date();
      
      for (const event of hostEvents) {
        // Lấy thời gian start và end của event
        const startTime = event.startTime ? new Date(event.startTime) : null;
        const endTime = event.endTime ? new Date(event.endTime) : null;
        
        // Đếm số lượng events theo logic chính xác - CHỈ tính từ events của host này
        // Mỗi event chỉ được đếm vào 1 trong 3 loại: đang diễn ra, sắp tới, hoặc đã kết thúc
        
        if (startTime && endTime) {
          if (event.status === 'Open' && now >= startTime && now <= endTime) {
            // "Sự kiện đang diễn ra" = status Open và đang trong khoảng thời gian
            activeEvents++;
          } else if (startTime > now) {
            // "Sự kiện sắp tới" = chưa bắt đầu (startTime > now), không phân biệt status
            upcomingEvents++;
          }
          // Nếu endTime < now thì event đã kết thúc, không đếm vào cả activeEvents và upcomingEvents
        } else if (startTime && startTime > now) {
          // Trường hợp không có endTime nhưng có startTime và chưa bắt đầu
          upcomingEvents++;
        }

        // Lấy ticket types để tính capacity
        let eventCapacity = 0;
        try {
          const ticketTypesResponse = await ticketsAPI.getTicketTypesByEvent(event.eventId);
          const ticketTypes = Array.isArray(ticketTypesResponse.data) ? ticketTypesResponse.data : [];
          ticketTypes.forEach(type => {
            eventCapacity += type.quantity || 0;
          });
          totalCapacity += eventCapacity;
        } catch (err) {
          console.error(`Error fetching ticket types for event ${event.eventId}:`, err);
        }

        // Lấy tickets của event này để tính revenue và tickets sold
        try {
          const ticketsResponse = await ticketsAPI.getTicketsByEvent(event.eventId);
          const tickets = Array.isArray(ticketsResponse.data) ? ticketsResponse.data : [];
          
          // Đếm tickets đã bán (status = Assigned hoặc Used, không phải Refunded)
          const soldTickets = tickets.filter(ticket => 
            ticket.status === 'Assigned' || ticket.status === 'Used'
          );
          
          totalTicketsSold += soldTickets.length;

          // Tính revenue từ giá của tickets đã bán
          // Tickets có ticketType với price, nên tính từ đó
          soldTickets.forEach(ticket => {
            if (ticket.ticketType && ticket.ticketType.price) {
              totalRevenue += ticket.ticketType.price;
            }
          });
        } catch (err) {
          console.error(`Error fetching tickets for event ${event.eventId}:`, err);
          // Nếu không lấy được tickets, vẫn tiếp tục với các events khác
        }
      }

      const totalTicketsRemaining = Math.max(0, totalCapacity - totalTicketsSold);
      const conversionRate = totalCapacity > 0 ? (totalTicketsSold / totalCapacity * 100) : 0;

      setStats({
        totalRevenue,
        totalTicketsSold,
        totalTicketsRemaining,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        totalEvents: hostEvents.length,
        activeEvents,
        upcomingEvents
      });
    } catch (err) {
      setError('Không thể tải dữ liệu dashboard của host');
      console.error('Error fetching host data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleViewEvent = (eventId) => {
    navigate(`/event/${eventId}`);
  };

  const handleEditEvent = async (eventId) => {
    try {
      const statusResponse = await eventsAPI.getEditStatus(eventId);
      if (statusResponse.data.canEdit) {
        navigate(`/create-event?edit=${eventId}`);
      } else {
        alert(statusResponse.data.message);
      }
    } catch (err) {
      console.error('Error checking edit status:', err);
      alert('Không thể kiểm tra trạng thái chỉnh sửa');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sự kiện này? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      setDeletingEventId(eventId);
      await eventsAPI.delete(eventId);
      fetchHostData();
      alert('Xóa sự kiện thành công');
    } catch (err) {
      console.error('Error deleting event:', err);
      let errorMessage = 'Không thể xóa sự kiện';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      alert(errorMessage);
    } finally {
      setDeletingEventId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'success';
      case 'Draft': return 'default';
      case 'Closed': return 'error';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'Open': return 'Đang mở';
      case 'Draft': return 'Nháp';
      case 'Closed': return 'Đã đóng';
      case 'Cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  // Statistics Tab Content
  const StatisticsTab = () => (
    <Box>
      <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
        Thống kê & Báo cáo
      </Typography>
      
      {/* Revenue Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tổng doanh thu
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    {formatCurrency(stats.totalRevenue)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                  <AttachMoney />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Vé đã bán
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="primary.main">
                    {stats.totalTicketsSold}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <TrendingUp />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Vé còn lại
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="warning.main">
                    {stats.totalTicketsRemaining}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                  <ConfirmationNumber />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tỷ lệ chuyển đổi
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="info.main">
                    {stats.conversionRate}%
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                  <Assessment />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Event Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Tổng số sự kiện
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {stats.totalEvents}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Sự kiện đang diễn ra
              </Typography>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {stats.activeEvents}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Sự kiện sắp tới
              </Typography>
              <Typography variant="h4" fontWeight={700} color="warning.main">
                {stats.upcomingEvents}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Biểu đồ bán vé */}
      <SalesChart hostEvents={events} />
    </Box>
  );

  // Orders Tab Content
  const OrdersTab = () => (
    <Box>
      <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
        Quản lý Đơn hàng
      </Typography>
      
      <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="body1" gutterBottom>
          Danh sách người mua vé
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
          Chức năng đang được phát triển...
        </Typography>

        <Stack spacing={2}>
          <Button variant="outlined" startIcon={<Download />} disabled>
            Export danh sách tham dự
          </Button>
          <Button variant="outlined" startIcon={<QrCodeScanner />} disabled>
            Check-in QR code
          </Button>
        </Stack>
      </Paper>
    </Box>
  );

  // Marketing Tab Content
  const MarketingTab = () => (
    <Box>
      <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
        Marketing & Engagement
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, mb: 2 }}>
                <Email />
              </Avatar>
              <Typography variant="h6" gutterBottom>
                Gửi email thông báo
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                Gửi thông báo đến tất cả người mua vé
              </Typography>
              <Button variant="outlined" fullWidth disabled>
                Gửi ngay
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56, mb: 2 }}>
                <Email />
              </Avatar>
              <Typography variant="h6" gutterBottom>
                Gửi reminder
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                Nhắc nhở trước sự kiện
              </Typography>
              <Button variant="outlined" fullWidth disabled>
                Gửi reminder
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56, mb: 2 }}>
                <Share />
              </Avatar>
              <Typography variant="h6" gutterBottom>
                Chia sẻ mạng xã hội
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                Chia sẻ lên Facebook, Twitter, Instagram
              </Typography>
              <Button variant="outlined" fullWidth disabled>
                Chia sẻ
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56, mb: 2 }}>
                <Visibility />
              </Avatar>
              <Typography variant="h6" gutterBottom>
                Theo dõi lượt xem
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                Xem thống kê lượt xem trang sự kiện
              </Typography>
              <Button variant="outlined" fullWidth disabled>
                Xem chi tiết
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  // Finance Tab Content
  const FinanceTab = () => (
    <Box>
      <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
        Tài chính
      </Typography>
      
      <Stack spacing={3}>
        <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <History /> Lịch sử giao dịch
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Xem lịch sử tất cả các giao dịch
          </Typography>
        </Paper>

        <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalance /> Yêu cầu rút tiền
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
            Rút tiền từ doanh thu sự kiện
          </Typography>
          <Button variant="outlined" startIcon={<CreditCard />} disabled>
            Rút tiền
          </Button>
        </Paper>

        <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt /> Báo cáo thuế
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Xuất báo cáo thuế cho sự kiện
          </Typography>
        </Paper>

        <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Phí platform
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Xem chi tiết phí platform và hoa hồng
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );

  // My Events Tab Content
  const MyEventsTab = () => (
    <Box>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
        Sự Kiện Của Tôi
      </Typography>

      {events.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2
          }}
        >
          <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Bạn chưa có sự kiện nào
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Hãy tạo sự kiện đầu tiên của bạn
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(3, 1fr)'
            },
            gap: 2,
            width: '100%'
          }}
        >
          {events.map((event) => {
            const backgroundImage = event.eventDetails?.backgroundImage || event.backgroundImage;
            const imageUrl = backgroundImage 
              ? (backgroundImage.startsWith('http') 
                  ? backgroundImage 
                  : `http://localhost:5000${backgroundImage.startsWith('/') ? '' : '/'}${backgroundImage}`)
              : '/default-event.svg';

            return (
              <Box
                key={event.eventId}
                sx={{
                  display: 'flex',
                  width: '100%'
                }}
              >
                <Card
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 6
                    }
                  }}
                >
                  <CardMedia
                    component="img"
                    height={160}
                    image={imageUrl}
                    alt={decodeText(event.title)}
                    onError={(e) => { e.target.src = '/default-event.svg'; }}
                    sx={{ objectFit: 'cover' }}
                  />
                  
                  <CardContent sx={{ flexGrow: 1, p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1, gap: 0.5 }}>
                      <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600, flex: 1, fontSize: '0.95rem', lineHeight: 1.3 }}>
                        {decodeText(event.title)}
                      </Typography>
                      <Chip
                        label={getStatusLabel(event.status)}
                        color={getStatusColor(event.status)}
                        size="small"
                        sx={{ ml: 0.5, fontSize: '0.7rem', height: 20 }}
                      />
                    </Box>

                    <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTime sx={{ fontSize: '0.875rem' }} color="action" />
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          {formatDate(event.startTime)}
                        </Typography>
                      </Box>

                      {event.location && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOn sx={{ fontSize: '0.875rem' }} color="action" />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }} noWrap>
                            {decodeText(event.location)}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <People sx={{ fontSize: '0.875rem' }} color="action" />
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          {decodeText(event.category) || 'Chưa phân loại'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 1.5, pt: 0, justifyContent: 'space-between', gap: 0.5 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Visibility sx={{ fontSize: '1rem' }} />}
                      onClick={() => handleViewEvent(event.eventId)}
                      sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}
                    >
                      Xem
                    </Button>
                    
                    <Box>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditEvent(event.eventId)}
                        title="Chỉnh sửa"
                        sx={{ padding: '4px' }}
                      >
                        <Edit sx={{ fontSize: '1rem' }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteEvent(event.eventId)}
                        title="Xóa"
                        disabled={deletingEventId === event.eventId}
                        sx={{ padding: '4px' }}
                      >
                        <Delete sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </Box>
                  </CardActions>
                </Card>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Header />
        <Container maxWidth="xl" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Host Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Quản lý sự kiện và theo dõi hiệu suất của bạn
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                minHeight: 64
              }
            }}
          >
            <Tab label="Tổng quan" />
            <Tab label="Thống kê" />
            <Tab label="Sự kiện" />
            <Tab label="Đơn hàng" />
            <Tab label="Marketing" />
            <Tab label="Tài chính" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Box sx={{ mt: 3 }}>
          {currentTab === 0 && <StatisticsTab />}
          {currentTab === 1 && <StatisticsTab />}
          {currentTab === 2 && <MyEventsTab />}
          {currentTab === 3 && <OrdersTab />}
          {currentTab === 4 && <MarketingTab />}
          {currentTab === 5 && <FinanceTab />}
        </Box>
      </Container>
    </Box>
  );
};

export default HostDashboard;

