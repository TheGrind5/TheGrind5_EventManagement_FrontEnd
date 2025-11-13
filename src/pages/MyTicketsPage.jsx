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
  Warning
} from '@mui/icons-material';
import Header from '../components/layout/Header';
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
      // Refresh tickets after cancel
      await fetchTickets();
      alert('Hủy vé thành công!');
    } catch (err) {
      alert(`Lỗi hủy vé: ${err.message}`);
    }
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
          <Box>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              {activeTab === 'tickets' ? 'Vé của tôi' : 'Sự kiện của tôi'}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {activeTab === 'tickets' 
                ? 'Quản lý và theo dõi vé sự kiện của bạn'
                : 'Quản lý và chỉnh sửa sự kiện của bạn'}
            </Typography>
          </Box>


          {/* Search and Filter Section - Only for Tickets */}
          {activeTab === 'tickets' && (
          <Paper sx={{ p: 3 }}>
            <Stack spacing={3}>
              {/* Search Bar */}
              <TextField
                fullWidth
                placeholder="Tìm kiếm vé..."
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
                      <IconButton
                        onClick={() => setSearchTerm('')}
                        edge="end"
                        size="small"
                      >
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              {/* Filter Controls */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Sự kiện</InputLabel>
                    <Select
                      value={eventFilter}
                      label="Sự kiện"
                      onChange={(e) => setEventFilter(e.target.value)}
                    >
                      <MenuItem value="all">Tất cả sự kiện</MenuItem>
                      {events.map(event => (
                        <MenuItem key={event} value={event}>{event}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Thời gian</InputLabel>
                    <Select
                      value={dateFilter}
                      label="Thời gian"
                      onChange={(e) => setDateFilter(e.target.value)}
                    >
                      <MenuItem value="all">Tất cả</MenuItem>
                      <MenuItem value="recent">Gần đây (7 ngày)</MenuItem>
                      <MenuItem value="old">Cũ hơn</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => {
                      setSearchTerm('');
                      setEventFilter('all');
                      setDateFilter('all');
                    }}
                    sx={{ height: '56px' }}
                  >
                    Đặt lại
                  </Button>
                </Grid>
              </Grid>

              {/* Results Summary */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Hiển thị {filteredTickets.length} / {tickets.length} vé
                </Typography>
                {(searchTerm || eventFilter !== 'all' || dateFilter !== 'all') && (
                  <Chip label="Đang lọc" color="primary" size="small" />
                )}
              </Box>
            </Stack>
          </Paper>
          )}

          {/* Filter Tabs - Only for Tickets */}
          {activeTab === 'tickets' && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button 
              variant={filter === 'all' ? 'contained' : 'outlined'}
              onClick={() => setFilter('all')}
            >
              Tất cả ({tickets.length})
            </Button>
            <Button 
              variant={filter === 'Assigned' ? 'contained' : 'outlined'}
              onClick={() => setFilter('Assigned')}
            >
              Có thể dùng ({tickets.filter(t => (t.Status || t.status) === 'Assigned').length})
            </Button>
            <Button 
              variant={filter === 'Used' ? 'contained' : 'outlined'}
              onClick={() => setFilter('Used')}
            >
              Đã dùng ({tickets.filter(t => (t.Status || t.status) === 'Used').length})
            </Button>
            <Button 
              variant={filter === 'Refunded' ? 'contained' : 'outlined'}
              onClick={() => setFilter('Refunded')}
            >
              Đã hoàn ({tickets.filter(t => (t.Status || t.status) === 'Refunded').length})
            </Button>
            <Button 
              variant={filter === 'Cancelled' ? 'contained' : 'outlined'}
              onClick={() => setFilter('Cancelled')}
            >
              Đã hủy ({tickets.filter(t => (t.Status || t.status) === 'Cancelled').length})
            </Button>
          </Box>
          )}

          {/* Tickets List */}
          {activeTab === 'tickets' && filteredTickets.length === 0 ? (
            tickets.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <ConfirmationNumber sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Chưa có vé nào
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Bạn chưa mua vé sự kiện nào. Hãy khám phá các sự kiện thú vị!
                </Typography>
                <Button component={Link} to="/" variant="contained">
                  Xem sự kiện
                </Button>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Event sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Không tìm thấy vé
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSearchTerm('');
                    setEventFilter('all');
                    setDateFilter('all');
                  }}
                >
                  Đặt lại bộ lọc
                </Button>
              </Box>
            )
          ) : (
            activeTab === 'tickets' && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(2, 1fr)'
                },
                gap: 3,
                alignItems: 'stretch'
              }}
            >
              {filteredTickets.map((ticket) => (
                <Card 
                  key={ticket.TicketId || ticket.ticketId || Math.random()}
                  elevation={0}
                  sx={{ 
                    width: '100%',
                    height: '100%',
                    display: 'flex', 
                    flexDirection: 'column',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 8px 24px ${theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.12)'}`,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                    <CardContent 
                      sx={{ 
                        flexGrow: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        p: 3,
                        minHeight: 0,
                        '&:last-child': { pb: 3 }
                      }}
                    >
                      <Stack spacing={2.5} sx={{ flexGrow: 1, minHeight: 0 }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                          <Box sx={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 600,
                                mb: 1,
                                lineHeight: 1.4,
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word',
                                hyphens: 'auto'
                              }}
                            >
                              {decodeText(ticket.Event?.Title || ticket.event?.title || ticket.Event?.title || 'Chưa có tiêu đề')}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                mb: 0.5,
                                lineHeight: 1.5,
                                wordWrap: 'break-word'
                              }}
                            >
                              {decodeText(ticket.TicketType?.TypeName || ticket.ticketType?.typeName || ticket.TicketType?.typeName || 'Chưa có loại vé')}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                fontSize: '0.85rem',
                                lineHeight: 1.5,
                                fontFamily: 'monospace'
                              }}
                            >
                              Số vé: {ticket.SerialNumber || ticket.serialNumber || 'N/A'}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right', flexShrink: 0, alignSelf: 'flex-start' }}>
                            {(() => {
                              const ticketStatus = ticket.Status || ticket.status;
                              const orderStatus = ticket.Order?.Status || ticket.order?.status || ticket.Order?.status;
                              const statusText = getStatusText(ticketStatus, orderStatus);
                              const statusColor = getStatusColor(ticketStatus, orderStatus);
                              
                              return (
                                <Chip 
                                  label={statusText}
                                  color={orderStatus === 'Failed' ? 'error' :
                                         ticketStatus === 'Assigned' ? 'success' : 
                                         ticketStatus === 'Used' ? 'info' : 'default'}
                                  size="small"
                                  sx={{ mb: 1, display: 'block' }}
                                />
                              );
                            })()}
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 600, 
                                color: 'primary.main',
                                lineHeight: 1.2
                              }}
                            >
                              {formatPrice((ticket.Order?.Amount || ticket.order?.amount || ticket.Order?.amount || 0))}
                            </Typography>
                          </Box>
                        </Box>

                        <Divider sx={{ my: 0.5 }} />

                        {/* Details - Allow natural wrapping */}
                        <Stack spacing={1.5} sx={{ flexGrow: 1, minHeight: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                            <AccessTime 
                              fontSize="small" 
                              color="action" 
                              sx={{ 
                                mt: 0.25, 
                                flexShrink: 0,
                                width: '20px'
                              }} 
                            />
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                flex: 1,
                                lineHeight: 1.6,
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word'
                              }}
                            >
                              {formatDate((ticket.Event?.StartTime || ticket.event?.startTime || ticket.Event?.startTime))}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                            <LocationOn 
                              fontSize="small" 
                              color="action" 
                              sx={{ 
                                mt: 0.25, 
                                flexShrink: 0,
                                width: '20px'
                              }} 
                            />
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                flex: 1,
                                lineHeight: 1.6,
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word',
                                hyphens: 'auto'
                              }}
                            >
                              {decodeText(ticket.Event?.Location || ticket.event?.location || ticket.Event?.location || 'Chưa có địa điểm')}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                            <Person 
                              fontSize="small" 
                              color="action" 
                              sx={{ 
                                mt: 0.25, 
                                flexShrink: 0,
                                width: '20px'
                              }} 
                            />
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                flex: 1,
                                lineHeight: 1.6,
                                wordWrap: 'break-word'
                              }}
                            >
                              Phát hành: {formatDate(ticket.IssuedAt || ticket.issuedAt)}
                            </Typography>
                          </Box>
                          
                          {(ticket.UsedAt || ticket.usedAt) && (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                              <ConfirmationNumber 
                                fontSize="small" 
                                color="action" 
                                sx={{ 
                                  mt: 0.25, 
                                  flexShrink: 0,
                                  width: '20px'
                                }} 
                              />
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{ 
                                  flex: 1,
                                  lineHeight: 1.6,
                                  wordWrap: 'break-word'
                                }}
                              >
                                Sử dụng: {formatDate(ticket.UsedAt || ticket.usedAt)}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </Stack>
                    </CardContent>

                    {/* Actions - Fixed at bottom */}
                    <Box 
                      sx={{ 
                        p: 2, 
                        pt: 2, 
                        mt: 'auto',
                        borderTop: `1px solid ${theme.palette.divider}`,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                        flexShrink: 0
                      }}
                    >
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {(() => {
                          const ticketStatus = ticket.Status || ticket.status;
                          const orderStatus = ticket.Order?.Status || ticket.order?.status || ticket.Order?.status;
                          const isAssigned = ticketStatus === 'Assigned';
                          const isPaymentFailed = orderStatus === 'Failed';
                          
                          // Chỉ hiển thị nút khi ticket là Assigned VÀ order không phải Failed
                          if (isAssigned && !isPaymentFailed) {
                            return (
                              <>
                                <Button 
                                  variant="contained"
                                  color="success"
                                  size="small"
                                  onClick={() => handleCheckIn(ticket.TicketId || ticket.ticketId)}
                                  sx={{ 
                                    flex: { xs: '1 1 auto', sm: '0 0 auto' }, 
                                    minWidth: '100px',
                                    textTransform: 'none',
                                    fontWeight: 600
                                  }}
                                >
                                  Check-in
                                </Button>
                                <Button 
                                  variant="outlined"
                                  color="warning"
                                  size="small"
                                  onClick={() => handleCancel(ticket.TicketId || ticket.ticketId)}
                                  sx={{ 
                                    flex: { xs: '1 1 auto', sm: '0 0 auto' }, 
                                    minWidth: '100px',
                                    textTransform: 'none',
                                    fontWeight: 600
                                  }}
                                >
                                  Hủy vé
                                </Button>
                              </>
                            );
                          }
                          return null;
                        })()}
                        <Button 
                          component={Link} 
                          to={`/event/${ticket.Event?.EventId || ticket.event?.eventId || ticket.Event?.eventId || '0'}`}
                          variant="outlined"
                          size="small"
                          sx={{ 
                            flex: { xs: '1 1 auto', sm: '0 0 auto' }, 
                            minWidth: '120px',
                            textTransform: 'none',
                            fontWeight: 600
                          }}
                        >
                          Xem sự kiện
                        </Button>
                      </Stack>
                    </Box>
                  </Card>
              ))}
            </Box>
            )
          )}

          {/* My Events Section */}
          {activeTab === 'events' && (
            <>
              {eventsLoading ? (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  minHeight: '50vh' 
                }}>
                  <Stack alignItems="center" spacing={2}>
                    <CircularProgress />
                    <Typography>Đang tải sự kiện của bạn...</Typography>
                  </Stack>
                </Box>
              ) : myEvents.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Event sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h5" gutterBottom>
                    Chưa có sự kiện nào
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Bạn chưa tạo sự kiện nào. Hãy tạo sự kiện đầu tiên của bạn!
                  </Typography>
                  <Button 
                    variant="contained"
                    onClick={async () => {
                      await subscriptionHelpers.checkSubscriptionAndNavigate(navigate, user);
                    }}
                  >
                    Tạo sự kiện
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {myEvents.map((event) => {
                    const daysUntilStart = Math.floor((new Date(event.startTime) - new Date()) / (1000 * 60 * 60 * 24));
                    const canEditLocationCategory = daysUntilStart > 7;
                    const canEditAnyField = daysUntilStart > 1;

                    return (
                      <Grid item xs={12} md={6} key={event.eventId}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Stack spacing={2}>
                              {/* Header */}
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {decodeText(event.title)}
                                  </Typography>
                                  <Chip 
                                    label={decodeText(event.category) || 'Không có danh mục'} 
                                    size="small" 
                                    sx={{ mt: 1 }}
                                  />
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Trạng thái: <strong>{event.status}</strong>
                                  </Typography>
                                </Box>
                                <Chip 
                                  label={event.status === 'Open' ? 'Đang mở' : 
                                         event.status === 'Closed' ? 'Đã đóng' : 
                                         event.status === 'Draft' ? 'Bản nháp' : 'Đã hủy'} 
                                  color={event.status === 'Open' ? 'success' : 
                                         event.status === 'Closed' ? 'default' : 
                                         event.status === 'Draft' ? 'warning' : 'error'}
                                  size="small"
                                />
                              </Box>

                              {/* Details */}
                              <Stack spacing={1}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <AccessTime fontSize="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    {formatDate(event.startTime)}
                                  </Typography>
                                </Box>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <LocationOn fontSize="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    {decodeText(event.location) || 'Chưa có địa điểm'}
                                  </Typography>
                                </Box>
                              </Stack>

                              {/* Edit Restrictions Warning */}
                              {!canEditAnyField && (
                                <Alert severity="warning" icon={<Warning />}>
                                  Không thể chỉnh sửa trong vòng 24 giờ trước khi sự kiện bắt đầu
                                </Alert>
                              )}
                              {canEditAnyField && !canEditLocationCategory && (
                                <Alert severity="info">
                                  Không thể thay đổi địa điểm và danh mục trong vòng 7 ngày trước khi sự kiện bắt đầu
                                </Alert>
                              )}
                            </Stack>
                          </CardContent>

                          {/* Actions */}
                          <Box sx={{ p: 2, pt: 0 }}>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                              <Button 
                                component={Link} 
                                to={`/event/${event.eventId}`}
                                variant="outlined"
                                size="small"
                              >
                                Xem sự kiện
                              </Button>
                              {canEditAnyField && (
                                <Button 
                                  variant="outlined"
                                  color="primary"
                                  size="small"
                                  startIcon={<Edit />}
                                  onClick={() => handleEditEvent(event)}
                                >
                                  Chỉnh sửa
                                </Button>
                              )}
                            </Stack>
                          </Box>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </>
          )}
        </Stack>
      </Container>

      {/* Edit Event Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Chỉnh sửa sự kiện
          {editingEvent && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {(() => {
                const daysUntilStart = Math.floor((new Date(editingEvent.startTime) - new Date()) / (1000 * 60 * 60 * 24));
                if (daysUntilStart <= 7 && daysUntilStart > 1) {
                  return 'Chỉ có thể chỉnh sửa tiêu đề và mô tả. Không thể thay đổi địa điểm và danh mục trong vòng 7 ngày trước khi sự kiện bắt đầu.';
                }
                return 'Có thể chỉnh sửa tất cả các trường.';
              })()}
            </Alert>
          )}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Tiêu đề"
              value={editFormData.title}
              onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Mô tả"
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              multiline
              rows={4}
            />
            {editingEvent && (
              <>
                <Typography variant="body2" color="text.secondary">
                  <strong>Danh mục:</strong> {editingEvent.category || 'Chưa có'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Địa điểm:</strong> {editingEvent.location || 'Chưa có'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Thời gian:</strong> {formatDate(editingEvent.startTime)}
                </Typography>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Hủy
          </Button>
          <Button onClick={handleSaveEvent} variant="contained">
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyTicketsPage;
