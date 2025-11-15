import React, { useState, useEffect, useMemo } from 'react';
import { Box, Container, Grid, Card, CardContent, Typography, Tab, Tabs, Paper, CircularProgress, Alert, Stack, Avatar, Chip, Button, Divider, CardMedia, CardActions, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, TextField, MenuItem } from '@mui/material';
import {
  TrendingUp, AttachMoney, ConfirmationNumber, People, QrCodeScanner, 
  Email, Share, Visibility, Assessment, Receipt, 
  Download, History, AccountBalance, CreditCard,
  Edit, Delete, Event as EventIcon, AccessTime, LocationOn, Search
} from '@mui/icons-material';
import Header from '../components/layout/Header';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { eventsAPI, ordersAPI, ticketsAPI } from '../services/apiClient';
import { subscriptionHelpers } from '../services/subscriptionService';
import { decodeText } from '../utils/textDecoder';
import SalesChart from '../components/host/SalesChart';
import MarketingSection from '../components/host/MarketingSection';

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
      }

      // Tính revenue và tickets sold từ Orders có status = "Paid" - ĐÂY LÀ CÁCH TÍNH CHÍNH XÁC
      // Revenue nên được tính từ Order.Amount (đã trừ discount/voucher), không phải từ ticket price
      // Tickets sold nên được tính từ Order.Quantity của các orders đã thanh toán
      try {
        // Fetch tất cả orders của host với status = "Paid"
        let page = 1;
        let hasMore = true;
        let allPaidOrders = [];

        while (hasMore) {
          const ordersResponse = await ordersAPI.getHostOrders({
            page,
            pageSize: 100, // Lấy nhiều orders mỗi lần để giảm số lượng requests
            status: 'Paid'
          });

          const payload = ordersResponse?.data || {};
          const ordersData = payload.Data || payload.data || [];
          const total = payload.TotalCount ?? payload.totalCount ?? 0;

          allPaidOrders = allPaidOrders.concat(ordersData);

          // Kiểm tra xem còn orders nào không
          if (ordersData.length < 100 || allPaidOrders.length >= total) {
            hasMore = false;
          } else {
            page++;
          }
        }

        // Tính tổng revenue và tickets sold từ các orders đã thanh toán
        allPaidOrders.forEach(order => {
          const amount = order.amount ?? order.Amount ?? 0;
          const quantity = order.quantity ?? order.Quantity ?? 0;
          
          totalRevenue += amount;
          totalTicketsSold += quantity; // Đếm tickets sold từ quantity của order
        });

        console.log(`[HostDashboard] Total revenue from ${allPaidOrders.length} paid orders: ${totalRevenue}`);
        console.log(`[HostDashboard] Total tickets sold: ${totalTicketsSold}`);
      } catch (err) {
        console.error('Error fetching host orders for revenue and tickets calculation:', err);
        // Nếu không lấy được orders, vẫn tiếp tục với dữ liệu hiện có
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

  const formatDateForExport = (dateString) => {
    // Kiểm tra null, undefined, hoặc chuỗi rỗng
    if (!dateString || dateString === '' || dateString === 'null' || dateString === 'undefined') {
      return '\tN/A';
    }
    
    // Thử parse date
    const date = new Date(dateString);
    
    // Kiểm tra invalid date hoặc năm < 1900 (Excel không hỗ trợ)
    if (Number.isNaN(date.getTime()) || date.getFullYear() < 1900) {
      return '\tN/A';
    }
    
    // Format date và thêm tab ở đầu để Excel hiểu là text
    const formatted = date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `\t${formatted}`;
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

  const SummaryMetrics = () => (
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
  );

  const EventOverview = () => (
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
  );

  const OverviewTab = () => (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 4, textAlign: { xs: 'left', md: 'center' } }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Chào mừng trở lại! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Tổng quan nhanh về hoạt động sự kiện của bạn
        </Typography>
      </Box>

      {/* Key Metrics Cards - Enhanced Design */}
      <Grid container spacing={3} sx={{ mb: 4, justifyContent: 'center' }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
              width: '100%',
              maxWidth: '100%',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1, fontWeight: 500 }}>
                    Tổng doanh thu
                  </Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ color: '#fff' }}>
                    {formatCurrency(stats.totalRevenue)}
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    width: 64,
                    height: 64,
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <AttachMoney sx={{ fontSize: 32, color: '#fff' }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1, fontWeight: 500 }}>
                    Vé đã bán
                  </Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ color: '#fff' }}>
                    {stats.totalTicketsSold}
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    width: 64,
                    height: 64,
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <TrendingUp sx={{ fontSize: 32, color: '#fff' }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1, fontWeight: 500 }}>
                    Vé còn lại
                  </Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ color: '#fff' }}>
                    {stats.totalTicketsRemaining}
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    width: 64,
                    height: 64,
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <ConfirmationNumber sx={{ fontSize: 32, color: '#fff' }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1, fontWeight: 500 }}>
                    Tỷ lệ chuyển đổi
                  </Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ color: '#fff' }}>
                    {stats.conversionRate}%
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    width: 64,
                    height: 64,
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Assessment sx={{ fontSize: 32, color: '#fff' }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Event Status Section - Enhanced */}
      <Grid container spacing={3} sx={{ mb: 4, justifyContent: 'center' }}>
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              background: 'linear-gradient(to bottom, rgba(255, 152, 0, 0.05), transparent)',
              overflow: 'hidden',
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                  <EventIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Trạng thái sự kiện
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Theo dõi tình hình các sự kiện của bạn trong thời gian thực
                  </Typography>
                </Box>
              </Stack>

              <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
                <Grid item xs={12} sm={4}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      bgcolor: 'rgba(76, 175, 80, 0.1)',
                      border: '2px solid',
                      borderColor: 'success.main',
                      textAlign: 'center',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      }
                    }}
                  >
                    <Typography variant="overline" sx={{ color: 'success.main', fontWeight: 600, letterSpacing: 1 }}>
                      ĐANG DIỄN RA
                    </Typography>
                    <Typography variant="h3" fontWeight={700} sx={{ color: 'success.main', mt: 1 }}>
                      {stats.activeEvents}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      bgcolor: 'rgba(255, 152, 0, 0.1)',
                      border: '2px solid',
                      borderColor: 'warning.main',
                      textAlign: 'center',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      }
                    }}
                  >
                    <Typography variant="overline" sx={{ color: 'warning.main', fontWeight: 600, letterSpacing: 1 }}>
                      SẮP DIỄN RA
                    </Typography>
                    <Typography variant="h3" fontWeight={700} sx={{ color: 'warning.main', mt: 1 }}>
                      {stats.upcomingEvents}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      bgcolor: 'rgba(33, 150, 243, 0.1)',
                      border: '2px solid',
                      borderColor: 'primary.main',
                      textAlign: 'center',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      }
                    }}
                  >
                    <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 600, letterSpacing: 1 }}>
                      TỔNG SỐ SỰ KIỆN
                    </Typography>
                    <Typography variant="h3" fontWeight={700} sx={{ color: 'primary.main', mt: 1 }}>
                      {stats.totalEvents}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              height: '100%',
              background: 'linear-gradient(to bottom, rgba(33, 150, 243, 0.05), transparent)',
            }}
          >
            <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Thao tác nhanh
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quản lý sự kiện của bạn
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={2} sx={{ flex: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  onClick={async () => {
                    await subscriptionHelpers.checkSubscriptionAndNavigate(navigate, user);
                  }}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    boxShadow: 3,
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.2s',
                  }}
                  startIcon={<EventIcon />}
                >
                  Tạo sự kiện mới
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  size="large"
                  onClick={() => navigate('/my-events')}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.2s',
                  }}
                  startIcon={<Edit />}
                >
                  Quản lý sự kiện
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  size="large"
                  onClick={() => setCurrentTab(3)}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.2s',
                  }}
                  startIcon={<Receipt />}
                >
                  Xem đơn hàng
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Info Section - Balanced Layout */}
      <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              background: 'linear-gradient(to bottom, rgba(102, 126, 234, 0.05), transparent)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main', width: 40, height: 40 }}>
                  <Assessment />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Hiệu suất bán vé
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tỷ lệ chuyển đổi hiện tại
                  </Typography>
                </Box>
              </Stack>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h4" fontWeight={700} color="info.main">
                  {stats.conversionRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {stats.totalTicketsSold} / {stats.totalTicketsSold + stats.totalTicketsRemaining} vé đã bán
                </Typography>
              </Box>
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
              background: 'linear-gradient(to bottom, rgba(67, 233, 123, 0.05), transparent)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Tổng quan doanh thu
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Doanh thu từ tất cả sự kiện
                  </Typography>
                </Box>
              </Stack>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h4" fontWeight={700} color="success.main">
                  {formatCurrency(stats.totalRevenue)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Trung bình: {stats.totalEvents > 0 ? formatCurrency(Math.round(stats.totalRevenue / stats.totalEvents)) : '0 ₫'} / sự kiện
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  // Statistics Tab Content
  const StatisticsTab = () => (
    <Box>
      <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
        Thống kê & Báo cáo
      </Typography>
      
      <SummaryMetrics />
      <EventOverview />

      {/* Biểu đồ bán vé */}
      <SalesChart hostEvents={events} />
    </Box>
  );

  // Orders Tab Content
  const OrdersTab = () => {
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [ordersError, setOrdersError] = useState(null);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [statusFilter, setStatusFilter] = useState('all');
    const [eventFilter, setEventFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const eventOptions = useMemo(() => {
      const mapped = events.map(event => {
        const eventId = event?.eventId ?? event?.EventId ?? event?.id ?? event?.Id;
        const title = decodeText(event?.title ?? event?.Title ?? '');
        if (eventId === undefined || eventId === null) return null;
        return { value: String(eventId), label: title || `Sự kiện #${eventId}` };
      }).filter(Boolean);

      return [{ value: 'all', label: 'Tất cả sự kiện' }, ...mapped];
    }, [events]);

    useEffect(() => {
      let ignore = false;

      const fetchOrders = async () => {
        try {
          setLoadingOrders(true);
          setOrdersError(null);

          const normalizedStatus = statusFilter === 'all'
            ? undefined
            : ({
                paid: 'Paid',
                pending: 'Pending',
                failed: 'Failed',
                cancelled: 'Cancelled',
                refunded: 'Refunded'
              }[statusFilter] || undefined);

          const eventIdParam = eventFilter === 'all' ? undefined : Number(eventFilter);
          const normalizedEventId = Number.isFinite(eventIdParam) ? eventIdParam : undefined;
          const normalizedSearch = searchTerm.trim() ? searchTerm.trim() : undefined;

          const response = await ordersAPI.getHostOrders({
            page: page + 1,
            pageSize,
            status: normalizedStatus,
            eventId: normalizedEventId,
            search: normalizedSearch
          });

          const payload = response?.data || {};
          const ordersData = payload.Data || payload.data || [];
          const total = payload.TotalCount ?? payload.totalCount ?? ordersData.length;

          if (!ignore) {
            setOrders(ordersData);
            setTotalCount(total);
          }
        } catch (err) {
          if (!ignore) {
            console.error('Failed to fetch host orders:', err);
            const message = err?.message || err?.response?.data?.message || 'Không thể tải danh sách đơn hàng';
            setOrdersError(message);
            setOrders([]);
            setTotalCount(0);
          }
        } finally {
          if (!ignore) {
            setLoadingOrders(false);
          }
        }
      };

      fetchOrders();
      return () => {
        ignore = true;
      };
    }, [page, pageSize, statusFilter, eventFilter, searchTerm]);

    const getOrderStatusLabel = (status) => {
      switch ((status || '').toLowerCase()) {
        case 'paid':
          return 'Đã thanh toán';
        case 'pending':
          return 'Chờ thanh toán';
        case 'failed':
          return 'Thanh toán thất bại';
        case 'cancelled':
          return 'Đã hủy';
        case 'refunded':
          return 'Đã hoàn tiền';
        default:
          return status || 'Không xác định';
      }
    };

    const getOrderStatusColor = (status) => {
      switch ((status || '').toLowerCase()) {
        case 'paid':
          return 'success';
        case 'pending':
          return 'warning';
        case 'refunded':
          return 'info';
        case 'failed':
        case 'cancelled':
          return 'error';
        default:
          return 'default';
      }
    };

    const handleExport = () => {
      if (!orders.length) {
        alert('Không có dữ liệu để export');
        return;
      }

      const headers = ['Mã đơn hàng', 'Tên khách hàng', 'Email', 'Sự kiện', 'Loại vé', 'Số lượng', 'Tổng tiền', 'Trạng thái', 'Ngày đặt'];
      const rows = orders.map(order => {
        const orderId = order.orderId ?? order.OrderId ?? '';
        const customerName = order.customerName ?? order.CustomerName ?? '';
        const customerEmail = order.customerEmail ?? order.CustomerEmail ?? '';
        const eventTitle = order.eventTitle ?? order.EventTitle ?? '';
        const ticketTypeName = order.ticketTypeName ?? order.TicketTypeName ?? '';
        const quantity = order.quantity ?? order.Quantity ?? 0;
        const amount = order.amount ?? order.Amount ?? 0;
        const status = order.status ?? order.Status ?? '';
        const createdAt = order.createdAt ?? order.CreatedAt ?? '';

        return [
          orderId,
          customerName,
          customerEmail,
          eventTitle,
          ticketTypeName,
          quantity,
          formatCurrency(amount),
          getOrderStatusLabel(status),
          formatDateForExport(createdAt)
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `host_orders_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <Box>
        <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
          Quản lý Đơn hàng
        </Typography>

        <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Tìm kiếm theo tên, email, mã đơn hàng..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Trạng thái"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="all">Tất cả trạng thái</MenuItem>
                <MenuItem value="paid">Đã thanh toán</MenuItem>
                <MenuItem value="pending">Chờ thanh toán</MenuItem>
                <MenuItem value="failed">Thanh toán thất bại</MenuItem>
                <MenuItem value="cancelled">Đã hủy</MenuItem>
                <MenuItem value="refunded">Đã hoàn tiền</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Sự kiện"
                value={eventFilter}
                onChange={(e) => {
                  setEventFilter(e.target.value);
                  setPage(0);
                }}
              >
                {eventOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<Download />}
                onClick={handleExport}
                disabled={loadingOrders || orders.length === 0}
              >
                Export CSV
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {ordersError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {ordersError}
          </Alert>
        )}

        <Paper sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          {loadingOrders ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : orders.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="body1" color="text.secondary">
                {searchTerm || statusFilter !== 'all' || eventFilter !== 'all'
                  ? 'Không tìm thấy đơn hàng phù hợp với bộ lọc'
                  : 'Chưa có đơn hàng nào'}
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Mã đơn hàng</strong></TableCell>
                      <TableCell><strong>Khách hàng</strong></TableCell>
                      <TableCell><strong>Email</strong></TableCell>
                      <TableCell><strong>Sự kiện</strong></TableCell>
                      <TableCell><strong>Loại vé</strong></TableCell>
                      <TableCell align="right"><strong>Số lượng</strong></TableCell>
                      <TableCell align="right"><strong>Tổng tiền</strong></TableCell>
                      <TableCell><strong>Trạng thái</strong></TableCell>
                      <TableCell><strong>Ngày đặt</strong></TableCell>
                      <TableCell align="center"><strong>Thao tác</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map(order => {
                      const orderId = order.orderId ?? order.OrderId ?? '';
                      const customerName = order.customerName ?? order.CustomerName ?? 'N/A';
                      const customerEmail = order.customerEmail ?? order.CustomerEmail ?? 'N/A';
                      const eventTitle = decodeText(order.eventTitle ?? order.EventTitle ?? 'N/A');
                      const ticketTypeName = order.ticketTypeName ?? order.TicketTypeName ?? 'N/A';
                      const quantity = order.quantity ?? order.Quantity ?? 0;
                      const amount = order.amount ?? order.Amount ?? 0;
                      const status = order.status ?? order.Status ?? '';
                      const createdAt = order.createdAt ?? order.CreatedAt ?? '';

                      return (
                        <TableRow key={orderId} hover>
                          <TableCell>#{orderId}</TableCell>
                          <TableCell>{customerName}</TableCell>
                          <TableCell>{customerEmail}</TableCell>
                          <TableCell>{eventTitle}</TableCell>
                          <TableCell>{ticketTypeName}</TableCell>
                          <TableCell align="right">{quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(amount)}</TableCell>
                          <TableCell>
                            <Chip
                              label={getOrderStatusLabel(status)}
                              color={getOrderStatusColor(status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{formatDate(createdAt)}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              title="Chức năng đang phát triển"
                              disabled
                            >
                              <QrCodeScanner fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={(event, newPage) => setPage(newPage)}
                rowsPerPage={pageSize}
                onRowsPerPageChange={(event) => {
                  setPageSize(parseInt(event.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Số dòng mỗi trang:"
              />
            </>
          )}
        </Paper>
      </Box>
    );
  };

  // Marketing Tab Content
  const MarketingTab = () => (
    <MarketingSection />
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
          {currentTab === 0 && <OverviewTab />}
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

