import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import { Search, Event, CalendarToday, LocationOn, Person } from '@mui/icons-material';
import adminAPI from '../../services/adminAPI';
import { useAuth } from '../../contexts/AuthContext';
import './EventManagement.css';

const EventManagement = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalEvents: 0,
    openEvents: 0,
    draftEvents: 0,
    closedEvents: 0
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    event: null
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [searchTerm, events]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllEvents();
      console.log('API Response:', response);
      
      // Backend trả về response.data.data hoặc response.data
      const eventData = response.data?.data || response.data?.Data || response.data || [];
      console.log('Event Data:', eventData);
      
      setEvents(eventData);
      calculateStats(eventData);
    } catch (error) {
      console.error('Error fetching events:', error);
      console.error('Error details:', error.response?.data);
      alert('Lỗi khi tải danh sách events: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (eventData) => {
    const stats = {
      totalEvents: eventData.length,
      openEvents: eventData.filter(e => e.status === 'Open').length,
      draftEvents: eventData.filter(e => e.status === 'Draft').length,
      closedEvents: eventData.filter(e => e.status === 'Closed').length
    };
    setStats(stats);
  };

  const filterEvents = () => {
    if (!searchTerm) {
      setFilteredEvents(events);
      return;
    }

    const filtered = events.filter(event =>
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEvents(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open':
        return 'success';
      case 'Draft':
        return 'warning';
      case 'Closed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Delete handlers
  const handleDeleteClick = (event) => {
    setDeleteDialog({
      open: true,
      event: event
    });
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      event: null
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (user?.role === 'Admin') {
        await adminAPI.adminDeleteEvent(deleteDialog.event.eventId);
      } else {
        await adminAPI.deleteEvent(deleteDialog.event.eventId);
      }
      
      // Refresh event list
      await fetchEvents();
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Không thể xóa sự kiện: ' + (error.response?.data?.message || error.message || 'Đã có lỗi xảy ra'));
    }
  };


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="event-management">
      <div className="page-header">
        <Typography variant="h4" className="page-title">
          Quản Lý Events
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Quản lý tất cả sự kiện trong hệ thống
        </Typography>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <Card className="stat-card">
          <CardContent>
            <div className="stat-content">
              <div className="stat-icon total">
                <Event />
              </div>
              <div className="stat-details">
                <Typography variant="h4">{stats.totalEvents}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Tổng Events
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent>
            <div className="stat-content">
              <div className="stat-icon open">
                <Event />
              </div>
              <div className="stat-details">
                <Typography variant="h4">{stats.openEvents}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Đang Mở
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent>
            <div className="stat-content">
              <div className="stat-icon draft">
                <Event />
              </div>
              <div className="stat-details">
                <Typography variant="h4">{stats.draftEvents}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Nháp
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent>
            <div className="stat-content">
              <div className="stat-icon closed">
                <Event />
              </div>
              <div className="stat-details">
                <Typography variant="h4">{stats.closedEvents}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Đã Đóng
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="search-card">
        <CardContent>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Tìm kiếm theo tên sự kiện, danh mục, địa điểm hoặc trạng thái..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card className="table-card">
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sự Kiện</TableCell>
                <TableCell>Danh Mục</TableCell>
                <TableCell>Địa Điểm</TableCell>
                <TableCell>Thời Gian</TableCell>
                <TableCell>Host</TableCell>
                <TableCell>Trạng Thái</TableCell>
                <TableCell>Xóa</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body1" color="textSecondary">
                      Không tìm thấy sự kiện nào
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents.map((event) => (
                  <TableRow key={event.eventId} hover>
                    <TableCell>
                      <div className="event-cell">
                        <div>
                          <Typography variant="body1" fontWeight={500}>
                            {event.title}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            ID: {event.eventId}
                          </Typography>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={event.category}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="location-cell">
                        <LocationOn fontSize="small" />
                        {event.location || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="date-cell">
                        <CalendarToday fontSize="small" />
                        {formatDate(event.startTime)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="host-cell">
                        <Person fontSize="small" />
                        {event.hostName || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={event.status}
                        color={getStatusColor(event.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => handleDeleteClick(event)}
                        sx={{ 
                          minWidth: '100px',
                          fontWeight: 600,
                          textTransform: 'none'
                        }}
                      >
                        Xóa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={handleCloseDeleteDialog}>
        <DialogTitle>
          Xác nhận xóa sự kiện
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa sự kiện "{deleteDialog.event?.title}"? Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="inherit">
            Hủy
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error"
            variant="contained"
          >
            Xóa sự kiện
          </Button>
        </DialogActions>
      </Dialog>

    </div>
  );
};

export default EventManagement;

