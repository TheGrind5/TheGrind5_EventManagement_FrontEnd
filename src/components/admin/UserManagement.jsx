import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import { Search, Person, AttachMoney, CalendarToday, Block, CheckCircle, Event as EventIcon } from '@mui/icons-material';
import adminAPI from '../../services/adminAPI';
import adminService from '../../services/adminService';
import NotificationIcon from '../common/NotificationIcon';
import { formatVietnamDateTimeShort } from '../../utils/dateTimeUtils';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    hosts: 0,
    customers: 0,
    admins: 0
  });
  const [banDialog, setBanDialog] = useState({
    open: false,
    user: null,
    action: '' // 'ban' or 'unban'
  });
  const [reportDialog, setReportDialog] = useState({
    open: false,
    user: null,
    reports: [],
    loading: false
  });
  // Track which users have been warned
  const [warnedUsers, setWarnedUsers] = useState(new Set());

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllUsers();
      console.log('API Response:', response);
      
      // Backend trả về response.data.data
      const userData = response.data?.data || response.data || [];
      console.log('User Data:', userData);
      
      // Fetch report count for each user
      const usersWithReportCount = await Promise.all(
        userData.map(async (user) => {
          try {
            const reportCountResponse = await adminAPI.getUserReportCount(user.userId);
            return {
              ...user,
              reportCount: reportCountResponse.data?.reportCount || 0
            };
          } catch (err) {
            console.warn(`Failed to get report count for user ${user.userId}:`, err);
            return {
              ...user,
              reportCount: 0
            };
          }
        })
      );
      
      setUsers(usersWithReportCount);
      calculateStats(usersWithReportCount);
    } catch (error) {
      console.error('Error fetching users:', error);
      console.error('Error details:', error.response?.data);
      alert('Lỗi khi tải danh sách users: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (userData) => {
    const stats = {
      totalUsers: userData.length,
      hosts: userData.filter(u => u.role === 'Host').length,
      customers: userData.filter(u => u.role === 'Customer').length,
      admins: userData.filter(u => u.role === 'Admin').length
    };
    setStats(stats);
  };

  const filterUsers = () => {
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user =>
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin':
        return 'error';
      case 'Host':
        return 'primary';
      case 'Customer':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Sử dụng formatVietnamDateTimeShort từ dateTimeUtils để đồng bộ UTC+7
  const formatDate = formatVietnamDateTimeShort;

  // Ban/Unban handlers
  const handleBanClick = (user) => {
    setBanDialog({
      open: true,
      user: user,
      action: 'ban'
    });
  };

  const handleUnbanClick = (user) => {
    setBanDialog({
      open: true,
      user: user,
      action: 'unban'
    });
  };

  const handleCloseBanDialog = () => {
    setBanDialog({
      open: false,
      user: null,
      action: ''
    });
  };

  const handleConfirmBanUnban = async () => {
    try {
      if (banDialog.action === 'ban') {
        await adminAPI.banUser(banDialog.user.userId, 'Vi phạm chính sách');
      } else {
        await adminAPI.unbanUser(banDialog.user.userId);
        // Sau khi bỏ cấm, xóa user khỏi danh sách đã cảnh cáo để quay lại nút "Cảnh cáo"
        setWarnedUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(banDialog.user.userId);
          return newSet;
        });
      }
      
      // Refresh user list
      await fetchUsers();
      handleCloseBanDialog();
    } catch (error) {
      console.error('Error banning/unbanning user:', error);
      alert(`Lỗi khi ${banDialog.action === 'ban' ? 'cấm' : 'mở cấm'} tài khoản`);
    }
  };

  // Report dialog handlers
  const handleViewReports = async (user) => {
    setReportDialog({
      open: true,
      user: user,
      reports: [],
      loading: true
    });

    try {
      const response = await adminAPI.getUserReports(user.userId);
      const reports = response.data || [];
      setReportDialog(prev => ({
        ...prev,
        reports: reports,
        loading: false
      }));
    } catch (error) {
      console.error('Error fetching user reports:', error);
      alert('Lỗi khi tải danh sách báo cáo: ' + (error.response?.data?.message || error.message));
      setReportDialog(prev => ({
        ...prev,
        loading: false
      }));
    }
  };

  const handleCloseReportDialog = () => {
    setReportDialog({
      open: false,
      user: null,
      reports: [],
      loading: false
    });
  };

  const handleWarnUser = async (userId) => {
    try {
      await adminService.warnUser(userId);
      
      // Mark user as warned
      setWarnedUsers(prev => new Set(prev).add(userId));
      
      alert('Đã gửi thông báo cảnh cáo đến người dùng thành công');
    } catch (err) {
      console.error('Error warning user:', err);
      alert('Có lỗi xảy ra khi gửi thông báo cảnh cáo: ' + (err.response?.data?.message || err.message));
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
    <div className="user-management">
      <div className="page-header">
        <div className="header-left">
          <Typography variant="h4" className="page-title">
            Quản Lý Users
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Quản lý tất cả người dùng trong hệ thống
          </Typography>
        </div>
        <div className="header-right">
          <NotificationIcon />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <Card className="stat-card">
          <CardContent>
            <div className="stat-content">
              <div className="stat-icon total">
                <Person />
              </div>
              <div className="stat-details">
                <Typography variant="h4">{stats.totalUsers}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Tổng Users
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent>
            <div className="stat-content">
              <div className="stat-icon admin">
                <Person />
              </div>
              <div className="stat-details">
                <Typography variant="h4">{stats.admins}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Admins
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent>
            <div className="stat-content">
              <div className="stat-icon host">
                <Person />
              </div>
              <div className="stat-details">
                <Typography variant="h4">{stats.hosts}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Hosts
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent>
            <div className="stat-content">
              <div className="stat-icon customer">
                <Person />
              </div>
              <div className="stat-details">
                <Typography variant="h4">{stats.customers}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Customers
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
            placeholder="Tìm kiếm theo tên, email, username, hoặc role..."
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

      {/* Users Table */}
      <Card className="table-card">
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Số Dư Ví</TableCell>
                <TableCell>SĐT</TableCell>
                <TableCell>Ngày Tạo</TableCell>
                <TableCell>Trạng Thái</TableCell>
                <TableCell>Hành Động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body1" color="textSecondary">
                      Không tìm thấy user nào
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.userId} hover>
                    <TableCell>
                      <div className="user-cell">
                        <Avatar
                          src={user.avatar}
                          alt={user.fullName}
                          sx={{ width: 40, height: 40, mr: 2 }}
                        >
                          {user.fullName?.charAt(0)}
                        </Avatar>
                        <div>
                          <Typography variant="body1" fontWeight={500}>
                            {user.fullName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            @{user.username}
                          </Typography>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color={getRoleColor(user.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="wallet-cell">
                        <AttachMoney fontSize="small" />
                        {formatCurrency(user.walletBalance)}
                      </div>
                    </TableCell>
                    <TableCell>{user.phone || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="date-cell">
                        <CalendarToday fontSize="small" />
                        {formatDate(user.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isBanned ? 'Đã cấm' : 'Hoạt động'}
                        color={user.isBanned ? 'error' : 'success'}
                        size="small"
                        sx={user.isBanned ? {} : {
                          backgroundColor: '#4caf50',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: '#45a049'
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {user.role !== 'Admin' && (
                        <div className="action-cell">
                          {user.isBanned ? (
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              onClick={() => handleUnbanClick(user)}
                              sx={{ 
                                minWidth: '100px',
                                fontWeight: 600,
                                textTransform: 'none',
                                backgroundColor: '#4caf50',
                                color: 'white',
                                '&:hover': {
                                  backgroundColor: '#45a049'
                                }
                              }}
                            >
                              Bỏ cấm
                            </Button>
                          ) : warnedUsers.has(user.userId) ? (
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={() => handleBanClick(user)}
                              sx={{ 
                                minWidth: '100px',
                                fontWeight: 600,
                                textTransform: 'none'
                              }}
                            >
                              Cấm
                            </Button>
                          ) : (
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleWarnUser(user.userId)}
                              sx={{ 
                                minWidth: '100px',
                                fontWeight: 600,
                                textTransform: 'none',
                                backgroundColor: '#fbbf24',
                                color: 'white',
                                '&:hover': {
                                  backgroundColor: '#f59e0b'
                                }
                              }}
                            >
                              Cảnh cáo
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Ban/Unban Confirmation Dialog */}
      <Dialog open={banDialog.open} onClose={handleCloseBanDialog}>
        <DialogTitle>
          {banDialog.action === 'ban' ? 'Xác nhận cấm tài khoản' : 'Xác nhận mở cấm tài khoản'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {banDialog.action === 'ban' 
              ? `Bạn có chắc chắn muốn cấm tài khoản của ${banDialog.user?.fullName}? Người dùng này sẽ không thể đăng nhập sau khi bị cấm.`
              : `Bạn có chắc chắn muốn mở cấm cho tài khoản của ${banDialog.user?.fullName}? Người dùng này sẽ có thể đăng nhập trở lại.`
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBanDialog} color="inherit">
            Hủy
          </Button>
          <Button 
            onClick={handleConfirmBanUnban} 
            color={banDialog.action === 'ban' ? 'error' : 'success'}
            variant="contained"
          >
            {banDialog.action === 'ban' ? 'Cấm tài khoản' : 'Mở cấm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reports Dialog */}
      <Dialog 
        open={reportDialog.open} 
        onClose={handleCloseReportDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventIcon />
            <Typography variant="h6">
              Nội dung báo cáo - {reportDialog.user?.fullName}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {reportDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : reportDialog.reports.length === 0 ? (
            <DialogContentText>
              Người dùng này chưa có báo cáo nào.
            </DialogContentText>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Sự Kiện</strong></TableCell>
                    <TableCell><strong>Người Báo Cáo</strong></TableCell>
                    <TableCell><strong>Nội Dung Báo Cáo</strong></TableCell>
                    <TableCell><strong>Thời Gian</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportDialog.reports.map((report) => (
                    <TableRow key={report.reportId} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EventIcon fontSize="small" color="primary" />
                          <Typography variant="body2" fontWeight={500}>
                            {report.eventTitle}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {report.reporterUsername}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {report.reporterEmail}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            maxWidth: 300,
                            wordBreak: 'break-word',
                            borderLeft: '2px solid',
                            borderColor: 'error.main',
                            pl: 1
                          }}
                        >
                          {report.reportReason}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {formatDate(report.reportedAt)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReportDialog} color="inherit">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default UserManagement;

