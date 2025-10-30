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
  CardContent
} from '@mui/material';
import { Search, Person, AttachMoney, CalendarToday } from '@mui/icons-material';
import adminAPI from '../../services/adminAPI';
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
      
      setUsers(userData);
      calculateStats(userData);
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
        <Typography variant="h4" className="page-title">
          Quản Lý Users
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Quản lý tất cả người dùng trong hệ thống
        </Typography>
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
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
};

export default UserManagement;

