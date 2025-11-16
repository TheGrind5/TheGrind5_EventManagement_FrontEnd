import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Button, 
  Grid, 
  Chip, 
  Alert,
  CircularProgress,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import { 
  Search, 
  Clear, 
  ConfirmationNumber, 
  Event, 
  AccessTime, 
  LocationOn,
  Person,
  FilterList,
  Edit,
  Delete,
  Warning,
  RateReview,
  QrCodeScanner,
  SwapHoriz
} from '@mui/icons-material';
import Header from '../components/layout/Header';
import TicketQRCode from '../components/tickets/TicketQRCode';
import TransferTicketModal from '../components/tickets/TransferTicketModal';
import { ticketsAPI, eventsAPI } from '../services/apiClient';
import { subscriptionHelpers } from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';
import { decodeText } from '../utils/textDecoder';

const MyTicketsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, available, used, refunded
  const [showNewTicketsAlert, setShowNewTicketsAlert] = useState(false);
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' or 'events'
  
  // Edit dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editFormData, setEditFormData] = useState({ title: '', description: '' });
  
  // QR Code dialog states
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedTicketForQR, setSelectedTicketForQR] = useState(null);
  
  // Transfer ticket dialog states
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedTicketForTransfer, setSelectedTicketForTransfer] = useState(null);
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchTickets();
    fetchMyEvents();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketsAPI.getMyTickets();
      console.log('🔍 DEBUG MyTickets - Full response:', response);
      
      // API returns: { data: [...tickets...], totalCount, page, ... }
      const newTickets = response?.data?.data || response?.data || response?.tickets || [];
      console.log('🔍 DEBUG MyTickets - Parsed tickets:', newTickets);
      console.log('🔍 DEBUG MyTickets - Ticket count:', newTickets.length);
      
      if (newTickets.length > 0) {
        console.log('🔍 DEBUG MyTickets - First ticket structure:', newTickets[0]);
        console.log('🔍 DEBUG MyTickets - Has Event?', !!newTickets[0]?.Event || !!newTickets[0]?.event);
        console.log('🔍 DEBUG MyTickets - Has TicketType?', !!newTickets[0]?.TicketType || !!newTickets[0]?.ticketType);
      }
      
      // Check if there are new tickets (recently created)
      const recentTickets = newTickets.filter(ticket => {
        const ticketDate = new Date(ticket.issuedAt || ticket.IssuedAt);
        if (isNaN(ticketDate.getTime())) return false;
        const now = new Date();
        const diffHours = (now - ticketDate) / (1000 * 60 * 60);
        return diffHours < 24; // Tickets created in last 24 hours
      });
      
      if (recentTickets.length > 0) {
        setShowNewTicketsAlert(true);
        // Auto-hide alert after 10 seconds
        setTimeout(() => setShowNewTicketsAlert(false), 10000);
      }
      
      setTickets(newTickets);
      setError(null);
    } catch (err) {
      console.error('🔍 DEBUG MyTickets - Error:', err);
      setError(err.message || 'Không thể tải danh sách vé. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEvents = async () => {
    try {
      setEventsLoading(true);
      const response = await eventsAPI.getMyEvents();
      const events = response.data || [];
      setMyEvents(events);
    } catch (err) {
      console.error('Error fetching my events:', err);
      // Don't show error if user has no events
      setMyEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleCheckIn = async (ticketId) => {
    try {
      await ticketsAPI.checkInTicket(ticketId);
      // Refresh tickets after check-in
      await fetchTickets();
      alert('Check-in thành công!');
    } catch (err) {
      alert(`Lỗi check-in: ${err.message}`);
    }
  };

  const handleCancel = async (ticketId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy vé này?')) {
      return;
    }

    try {
      await ticketsAPI.cancelTicket(ticketId);
      // Refresh tickets after cancellation
      await fetchTickets();
      alert('Hủy vé thành công!');
    } catch (error) {
      console.error('Error cancelling ticket:', error);
      alert('Hủy vé thất bại. Vui lòng thử lại.');
    }
  };

  const handleFeedback = (eventId) => {
    // Navigate to event page
    navigate(`/event/${eventId}`);
    
    // Scroll to feedback section after navigation
    setTimeout(() => {
      const feedbackSection = document.getElementById('feedback-section');
      if (feedbackSection) {
        feedbackSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setEditFormData({
      title: event.title,
      description: event.description || ''
    });
    setEditDialogOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!editingEvent) return;

    try {
      await eventsAPI.update(editingEvent.eventId, {
        ...editingEvent,
        title: editFormData.title,
        description: editFormData.description
      });
      
      setEditDialogOpen(false);
      await fetchMyEvents();
      alert('Cập nhật sự kiện thành công!');
    } catch (err) {
      alert(`Lỗi cập nhật: ${err.message}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price) + ' ₫';
  };

  const getStatusColor = (status, orderStatus) => {
    // Nếu order status là Failed, hiển thị màu lỗi
    if (orderStatus === 'Failed') return '#ef4444';
    
    switch (status) {
      case 'Assigned': return '#22c55e';
      case 'Used': return '#3b82f6';
      case 'Refunded': return '#ef4444';
      case 'Cancelled': return '#f97316';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status, orderStatus) => {
    // Nếu order status là Failed, hiển thị "Thanh toán thất bại"
    if (orderStatus === 'Failed') return 'Thanh toán thất bại';
    
    switch (status) {
      case 'Assigned': return 'Có thể sử dụng';
      case 'Used': return 'Đã sử dụng';
      case 'Refunded': return 'Đã hoàn tiền';
      case 'Cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  // Get unique events for filter dropdown
  const events = [...new Set(tickets.map(ticket => 
    ticket.Event?.Title || ticket.event?.title || ticket.Event?.title || ''
  ).filter(Boolean))];

  // Debug logging
  console.log('🎫 Total tickets:', tickets.length);
  console.log('🎫 Tickets data:', tickets);
  console.log('🔍 Current filter:', filter);
  console.log('🔍 Search term:', searchTerm);
  console.log('🔍 Event filter:', eventFilter);
  console.log('🔍 Date filter:', dateFilter);

  const filteredTickets = tickets.filter(ticket => {
    const ticketStatus = ticket.Status || ticket.status;
    const eventTitle = ticket.Event?.Title || ticket.event?.title || ticket.Event?.title || '';
    const ticketTypeName = ticket.TicketType?.TypeName || ticket.ticketType?.typeName || ticket.TicketType?.typeName || '';
    const serialNumber = ticket.SerialNumber || ticket.serialNumber || '';
    const issuedAt = ticket.IssuedAt || ticket.issuedAt;
    
    // Status filter
    let matchesStatus = true;
    switch (filter) {
      case 'available':
        matchesStatus = ticketStatus === 'Assigned';
        break;
      case 'used':
        matchesStatus = ticketStatus === 'Used';
        break;
      case 'refunded':
        matchesStatus = ticketStatus === 'Refunded';
        break;
      case 'cancelled':
        matchesStatus = ticketStatus === 'Cancelled';
        break;
      default:
        matchesStatus = true;
    }

    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      decodeText(eventTitle).toLowerCase().includes(searchLower) ||
      decodeText(ticketTypeName).toLowerCase().includes(searchLower) ||
      serialNumber.toLowerCase().includes(searchLower);

    // Event filter
    const matchesEvent = eventFilter === 'all' || eventTitle === eventFilter;

    // Date filter
    if (!issuedAt) {
      return matchesStatus && matchesSearch && matchesEvent;
    }
    
    const ticketDate = new Date(issuedAt);
    if (isNaN(ticketDate.getTime())) {
      return matchesStatus && matchesSearch && matchesEvent;
    }
    
    const now = new Date();
    let matchesDate = true;
    
    if (dateFilter === 'recent') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = ticketDate >= weekAgo;
    } else if (dateFilter === 'old') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = ticketDate < weekAgo;
    }

    return matchesStatus && matchesSearch && matchesEvent && matchesDate;
  });

  console.log('✅ Filtered tickets:', filteredTickets.length);
  console.log('✅ Filtered data:', filteredTickets);

  if (loading) {
    return (
      <Box>
        <Header />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '50vh' 
          }}>
            <Stack alignItems="center" spacing={2}>
              <CircularProgress />
              <Typography>Đang tải vé của bạn...</Typography>
            </Stack>
          </Box>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Header />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert 
            severity="error" 
            action={
              <Button color="inherit" size="small" onClick={fetchTickets}>
                Thử lại
              </Button>
            }
          >
            {error}
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={4}>
          {/* New Tickets Alert */}
          {showNewTicketsAlert && (
            <Alert 
              severity="success" 
              icon={<ConfirmationNumber />}
              action={
                <IconButton
                  size="small"
                  onClick={() => setShowNewTicketsAlert(false)}
                >
                  <Clear />
                </IconButton>
              }
            >
              <Typography variant="h6" gutterBottom>
                Vé mới đã được tạo!
              </Typography>
              <Typography variant="body2">
                Bạn có vé mới trong tài khoản. Hãy kiểm tra bên dưới!
              </Typography>
            </Alert>
          )}

          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" spacing={2}>
              <Box>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                  {activeTab === 'tickets' ? 'Vé của tôi' : 'Sự kiện của tôi'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {activeTab === 'tickets' 
                    ? 'Quản lý vé đã mua và xem thông tin sự kiện' 
                    : 'Quản lý sự kiện đã tạo'}
                </Typography>
              </Box>
              
              {activeTab === 'tickets' && (
                <Stack direction="row" spacing={1.5}>
                  <Button
                    component={Link}
                    to="/my-transfers"
                    variant="outlined"
                    size="medium"
                    startIcon={<SwapHoriz />}
                    sx={{ 
                      fontWeight: 600,
                      textTransform: 'none'
                    }}
                  >
                    Chuyển nhượng vé
                  </Button>
                  <Button
                    component={Link}
                    to="/"
                    variant="contained"
                    size="medium"
                    startIcon={<Event />}
                    sx={{ 
                      fontWeight: 600,
                      textTransform: 'none'
                    }}
                  >
                    Khám phá sự kiện
                  </Button>
                </Stack>
              )}
            </Stack>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Stack direction="row" spacing={0}>
              <Button
                onClick={() => setActiveTab('tickets')}
                sx={{
                  px: 3,
                  py: 1.5,
                  borderRadius: 0,
                  borderBottom: 3,
                  borderColor: activeTab === 'tickets' ? 'primary.main' : 'transparent',
                  color: activeTab === 'tickets' ? 'primary.main' : 'text.secondary',
                  fontWeight: activeTab === 'tickets' ? 700 : 500,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    color: 'primary.main'
                  }
                }}
              >
                <ConfirmationNumber sx={{ mr: 1, fontSize: 20 }} />
                Vé của tôi ({tickets.length})
              </Button>
              <Button
                onClick={() => setActiveTab('events')}
                sx={{
                  px: 3,
                  py: 1.5,
                  borderRadius: 0,
                  borderBottom: 3,
                  borderColor: activeTab === 'events' ? 'primary.main' : 'transparent',
                  color: activeTab === 'events' ? 'primary.main' : 'text.secondary',
                  fontWeight: activeTab === 'events' ? 700 : 500,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    color: 'primary.main'
                  }
                }}
              >
                <Event sx={{ mr: 1, fontSize: 20 }} />
                Sự kiện của tôi ({myEvents.length})
              </Button>
            </Stack>
          </Box>

          {/* Tickets Tab Content */}
          {activeTab === 'tickets' && (
            <>
              {/* Statistics Dashboard */}
              {tickets.length > 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Paper 
                      sx={{ 
                        p: 2.5, 
                        borderRadius: 2, 
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: filter === 'all' ? '2px solid' : '1px solid',
                        borderColor: filter === 'all' ? 'primary.main' : 'divider',
                        bgcolor: filter === 'all' ? 'action.selected' : 'background.paper',
                        '&:hover': { 
                          borderColor: 'primary.main',
                          boxShadow: 2
                        }
                      }}
                      onClick={() => setFilter('all')}
                    >
                      <Typography variant="h3" fontWeight={700} color="text.primary">
                        {tickets.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Tổng vé
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Paper 
                      sx={{ 
                        p: 2.5, 
                        borderRadius: 2, 
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: filter === 'available' ? '2px solid' : '1px solid',
                        borderColor: filter === 'available' ? 'success.main' : 'divider',
                        bgcolor: filter === 'available' ? 'success.lighter' : 'background.paper',
                        '&:hover': { 
                          borderColor: 'success.main',
                          boxShadow: 2
                        }
                      }}
                      onClick={() => setFilter('available')}
                    >
                      <Typography variant="h3" fontWeight={700} color="success.main">
                        {tickets.filter(t => (t.Status || t.status) === 'Assigned').length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Có thể dùng
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Paper 
                      sx={{ 
                        p: 2.5, 
                        borderRadius: 2, 
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: filter === 'used' ? '2px solid' : '1px solid',
                        borderColor: filter === 'used' ? 'info.main' : 'divider',
                        bgcolor: filter === 'used' ? 'info.lighter' : 'background.paper',
                        '&:hover': { 
                          borderColor: 'info.main',
                          boxShadow: 2
                        }
                      }}
                      onClick={() => setFilter('used')}
                    >
                      <Typography variant="h3" fontWeight={700} color="info.main">
                        {tickets.filter(t => (t.Status || t.status) === 'Used').length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Đã dùng
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Paper 
                      sx={{ 
                        p: 2.5, 
                        borderRadius: 2, 
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: filter === 'refunded' ? '2px solid' : '1px solid',
                        borderColor: filter === 'refunded' ? 'warning.main' : 'divider',
                        bgcolor: filter === 'refunded' ? 'warning.lighter' : 'background.paper',
                        '&:hover': { 
                          borderColor: 'warning.main',
                          boxShadow: 2
                        }
                      }}
                      onClick={() => setFilter('refunded')}
                    >
                      <Typography variant="h3" fontWeight={700} color="warning.main">
                        {tickets.filter(t => (t.Status || t.status) === 'Refunded').length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Đã hoàn
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {/* Search and Filter Section */}
              <Paper sx={{ p: 3, borderRadius: 2, border: '2px solid', borderColor: 'divider' }}>
                <Stack spacing={2}>
                  {/* Active Filter Indicator */}
                  {(filter !== 'all' || searchTerm || eventFilter !== 'all' || dateFilter !== 'all') && (
                    <Alert 
                      severity="info" 
                      icon={<FilterList />}
                      action={
                        <Button 
                          size="small" 
                          color="inherit"
                          onClick={() => {
                            setSearchTerm('');
                            setEventFilter('all');
                            setDateFilter('all');
                            setFilter('all');
                          }}
                        >
                          Xóa tất cả
                        </Button>
                      }
                    >
                      <Typography variant="body2">
                        <strong>Đang áp dụng bộ lọc:</strong> Hiển thị {filteredTickets.length} / {tickets.length} vé
                      </Typography>
                    </Alert>
                  )}

                  {/* Search Bar */}
                  <TextField
                    fullWidth
                    placeholder="Tìm kiếm theo tên sự kiện, loại vé, hoặc mã vé..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                      endAdornment: searchTerm && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setSearchTerm('')}>
                            <Clear />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />

                  {/* Filters */}
                  <Stack 
                    direction={isMobile ? 'column' : 'row'} 
                    spacing={2}
                    alignItems={isMobile ? 'stretch' : 'center'}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                      <FilterList color="primary" />
                      <Typography variant="body2" fontWeight={700} color="primary">
                        Bộ lọc:
                      </Typography>
                    </Box>

                    <FormControl size="small" sx={{ minWidth: 150, flex: 1 }}>
                      <InputLabel>Trạng thái</InputLabel>
                      <Select
                        value={filter}
                        label="Trạng thái"
                        onChange={(e) => setFilter(e.target.value)}
                      >
                        <MenuItem value="all">Tất cả</MenuItem>
                        <MenuItem value="available">Có thể sử dụng</MenuItem>
                        <MenuItem value="used">Đã sử dụng</MenuItem>
                        <MenuItem value="cancelled">Đã hủy</MenuItem>
                        <MenuItem value="refunded">Đã hoàn tiền</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 150, flex: 1 }}>
                      <InputLabel>Sự kiện</InputLabel>
                      <Select
                        value={eventFilter}
                        label="Sự kiện"
                        onChange={(e) => setEventFilter(e.target.value)}
                      >
                        <MenuItem value="all">Tất cả sự kiện</MenuItem>
                        {events.map((event, idx) => (
                          <MenuItem key={idx} value={event}>
                            {decodeText(event)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 150, flex: 1 }}>
                      <InputLabel>Thời gian</InputLabel>
                      <Select
                        value={dateFilter}
                        label="Thời gian"
                        onChange={(e) => setDateFilter(e.target.value)}
                      >
                        <MenuItem value="all">Tất cả</MenuItem>
                        <MenuItem value="recent">7 ngày gần đây</MenuItem>
                        <MenuItem value="old">Trước 7 ngày</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                </Stack>
              </Paper>

              {/* Tickets List */}
              {filteredTickets.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                  <ConfirmationNumber sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {tickets.length === 0 
                      ? 'Bạn chưa có vé nào'
                      : 'Không tìm thấy vé phù hợp'
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {tickets.length === 0
                      ? 'Hãy khám phá các sự kiện thú vị và đặt vé ngay!'
                      : 'Thử thay đổi bộ lọc hoặc tìm kiếm khác'
                    }
                  </Typography>
                  {tickets.length === 0 ? (
                    <Button
                      variant="contained"
                      component={Link}
                      to="/"
                      startIcon={<Event />}
                    >
                      Khám phá sự kiện
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setSearchTerm('');
                        setEventFilter('all');
                        setDateFilter('all');
                        setFilter('all');
                      }}
                      startIcon={<Clear />}
                    >
                      Xóa bộ lọc
                    </Button>
                  )}
                </Paper>
              ) : (
                <Grid container spacing={3} sx={{ 
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: 'repeat(2, 1fr)'
                  },
                  gap: 3
                }}>
                  {filteredTickets.map((ticket) => {
                    const eventData = ticket.Event || ticket.event || {};
                    const ticketTypeData = ticket.TicketType || ticket.ticketType || {};
                    const orderData = ticket.Order || ticket.order || {};
                    const ticketStatus = ticket.Status || ticket.status;
                    const isAssigned = ticketStatus === 'Assigned';
                    const isUsed = ticketStatus === 'Used';
                    
                    return (
                      <Box key={ticket.TicketId || ticket.ticketId}>
                        <Card sx={{ 
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%',
                          minHeight: 420,
                          borderRadius: 2, 
                          transition: 'all 0.2s ease-in-out',
                          overflow: 'visible',
                          position: 'relative',
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:hover': {
                            boxShadow: 4,
                            transform: 'translateY(-2px)',
                            borderColor: 'primary.main'
                          }
                        }}>
                          {/* Status Banner */}
                          <Box sx={{ 
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            zIndex: 1
                          }}>
                            <Chip
                              label={getStatusText(ticketStatus, orderData.Status || orderData.status)}
                              size="small"
                              sx={{
                                bgcolor: getStatusColor(ticketStatus, orderData.Status || orderData.status),
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                height: 24,
                                textTransform: 'uppercase'
                              }}
                            />
                          </Box>

                          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                            {/* Header Section */}
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="h6" sx={{ 
                                fontWeight: 700, 
                                mb: 1, 
                                pr: 10,
                                color: 'text.primary',
                                lineHeight: 1.3
                              }}>
                                {decodeText(eventData.Title || eventData.title || 'Không có tên sự kiện')}
                              </Typography>
                              <Chip
                                icon={<ConfirmationNumber sx={{ fontSize: 14 }} />}
                                label={decodeText(ticketTypeData.TypeName || ticketTypeData.typeName || 'N/A')}
                                size="small"
                                variant="outlined"
                                color="primary"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  height: 24
                                }}
                              />
                            </Box>

                            <Divider sx={{ mb: 2 }} />

                            {/* Details Section */}
                            <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1,
                                bgcolor: 'action.hover',
                                p: 1.5,
                                borderRadius: 1
                              }}>
                                <ConfirmationNumber sx={{ fontSize: 18, color: 'primary.main' }} />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
                                    Mã vé
                                  </Typography>
                                  <Typography variant="body2" sx={{ 
                                    fontFamily: 'monospace', 
                                    fontWeight: 700,
                                    color: 'text.primary',
                                    fontSize: '0.85rem',
                                    letterSpacing: '0.5px'
                                  }}>
                                    {ticket.SerialNumber || ticket.serialNumber || 'N/A'}
                                  </Typography>
                                </Box>
                              </Box>

                              {(eventData.StartTime || eventData.startTime) && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <AccessTime sx={{ fontSize: 18, color: 'info.main' }} />
                                  <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
                                      Thời gian
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500, fontSize: '0.85rem' }}>
                                      {formatDate(eventData.StartTime || eventData.startTime)}
                                    </Typography>
                                  </Box>
                                </Box>
                              )}

                              {(eventData.Location || eventData.location) && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <LocationOn sx={{ fontSize: 18, color: 'error.main' }} />
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
                                      Địa điểm
                                    </Typography>
                                    <Typography variant="body2" sx={{ 
                                      color: 'text.primary', 
                                      fontWeight: 500,
                                      fontSize: '0.85rem',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {decodeText(eventData.Location || eventData.location)}
                                    </Typography>
                                  </Box>
                                </Box>
                              )}

                              {(ticket.IssuedAt || ticket.issuedAt) && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <Person sx={{ fontSize: 18, color: 'text.secondary' }} />
                                  <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
                                      Phát hành
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500, fontSize: '0.85rem' }}>
                                      {formatDate(ticket.IssuedAt || ticket.issuedAt)}
                                    </Typography>
                                  </Box>
                                </Box>
                              )}
                            </Stack>
                          </CardContent>

                          {/* Action Buttons */}
                          <Box sx={{ p: 3, pt: 0 }}>
                            <Stack spacing={1.5}>
                              {isAssigned && (
                                <Stack direction="row" spacing={1.5}>
                                  <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<QrCodeScanner sx={{ fontSize: 18 }} />}
                                    onClick={() => {
                                      setSelectedTicketForQR(ticket);
                                      setQrDialogOpen(true);
                                    }}
                                    fullWidth
                                    sx={{ 
                                      fontWeight: 600,
                                      fontSize: '0.875rem',
                                      py: 1,
                                      textTransform: 'none'
                                    }}
                                  >
                                    QR Code
                                  </Button>
                                  <Button
                                    variant="contained"
                                    color="secondary"
                                    startIcon={<SwapHoriz sx={{ fontSize: 18 }} />}
                                    onClick={() => {
                                      setSelectedTicketForTransfer(ticket);
                                      setTransferModalOpen(true);
                                    }}
                                    fullWidth
                                    sx={{ 
                                      fontWeight: 600,
                                      fontSize: '0.875rem',
                                      py: 1,
                                      textTransform: 'none'
                                    }}
                                  >
                                    Chuyển nhượng
                                  </Button>
                                </Stack>
                              )}

                              <Button
                                variant="outlined"
                                onClick={() => navigate(`/event/${eventData.EventId || eventData.eventId}`)}
                                fullWidth
                                startIcon={<Event sx={{ fontSize: 18 }} />}
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.875rem',
                                  py: 1,
                                  textTransform: 'none'
                                }}
                              >
                                Chi tiết sự kiện
                              </Button>

                              {isUsed && (
                                <Button
                                  variant="outlined"
                                  color="info"
                                  startIcon={<RateReview sx={{ fontSize: 18 }} />}
                                  onClick={() => handleFeedback(eventData.EventId || eventData.eventId)}
                                  fullWidth
                                  sx={{
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    py: 1,
                                    textTransform: 'none'
                                  }}
                                >
                                  Đánh giá
                                </Button>
                              )}
                            </Stack>
                          </Box>
                        </Card>
                      </Box>
                    );
                  })}
                </Grid>
              )}
            </>
          )}

          {/* Events Tab Content */}
          {activeTab === 'events' && (
            <>
              {eventsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : myEvents.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                  <Event sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Bạn chưa tạo sự kiện nào
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Hãy tạo sự kiện đầu tiên của bạn!
                  </Typography>
                  <Button
                    variant="contained"
                    component={Link}
                    to="/create-event"
                    startIcon={<Event />}
                  >
                    Tạo sự kiện
                  </Button>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {myEvents.map((event) => (
                    <Grid item xs={12} sm={6} md={4} key={event.eventId}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" gutterBottom>
                            {decodeText(event.title)}
                          </Typography>
                          <Stack spacing={1} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AccessTime fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(event.startTime)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationOn fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {decodeText(event.location)}
                              </Typography>
                            </Box>
                          </Stack>
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              startIcon={<Edit />}
                              onClick={() => handleEditEvent(event)}
                            >
                              Sửa
                            </Button>
                            <Button
                              size="small"
                              onClick={() => navigate(`/event/${event.eventId}`)}
                            >
                              Chi tiết
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}

          {/* Edit Event Dialog */}
          <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Chỉnh sửa sự kiện</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label="Tên sự kiện"
                  fullWidth
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                />
                <TextField
                  label="Mô tả"
                  fullWidth
                  multiline
                  rows={4}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialogOpen(false)}>Hủy</Button>
              <Button onClick={handleSaveEvent} variant="contained">Lưu</Button>
            </DialogActions>
          </Dialog>
          
          {/* QR Code Dialog */}
          <Dialog
            open={qrDialogOpen}
            onClose={() => {
              setQrDialogOpen(false);
              setSelectedTicketForQR(null);
            }}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <QrCodeScanner />
                <Typography variant="h6">QR Code Vé</Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              {selectedTicketForQR && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                  <TicketQRCode ticket={selectedTicketForQR} size={250} showSerialNumber={true} />
                  {selectedTicketForQR.Event && (
                    <Box sx={{ mt: 3, textAlign: 'center', width: '100%' }}>
                      <Typography variant="body2" color="text.secondary">
                        Sự kiện: {decodeText(selectedTicketForQR.Event.Title || selectedTicketForQR.Event.title || 'N/A')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Quét QR code này tại sự kiện để check-in
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => {
                  setQrDialogOpen(false);
                  setSelectedTicketForQR(null);
                }}
                variant="contained"
              >
                Đóng
              </Button>
            </DialogActions>
          </Dialog>

          {/* Transfer Ticket Modal */}
          {transferModalOpen && selectedTicketForTransfer && (
            <TransferTicketModal
              ticket={selectedTicketForTransfer}
              onClose={() => {
                setTransferModalOpen(false);
                setSelectedTicketForTransfer(null);
              }}
              onSuccess={() => {
                fetchTickets(); // Refresh tickets after successful transfer
              }}
            />
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default MyTicketsPage;
