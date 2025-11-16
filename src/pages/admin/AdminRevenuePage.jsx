import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  TablePagination
} from '@mui/material';
import { TrendingUp, AttachMoney, Assessment, AccountBalance } from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdminRevenuePage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  useEffect(() => {
    fetchRevenueData();
  }, [page, rowsPerPage]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch stats and transactions in parallel
      const [statsRes, transRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/revenue/stats`, config),
        axios.get(`${API_URL}/api/admin/revenue/transactions?page=${page + 1}&pageSize=${rowsPerPage}`, config)
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data);
      }

      if (transRes.data.success) {
        setTransactions(transRes.data.transactions || []);
      }

    } catch (err) {
      console.error('Error fetching revenue data:', err);
      setError(err.response?.data?.message || 'Không thể tải dữ liệu doanh thu');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
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
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={600}>
          Doanh Thu Sàn
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Theo dõi doanh thu từ phí chuyển nhượng vé và các dịch vụ khác
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Revenue */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'primary.lighter',
                    color: 'primary.main'
                  }}
                >
                  <AccountBalance />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Tổng Doanh Thu
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {formatCurrency(stats?.totalRevenue)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Today Revenue */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'success.lighter',
                    color: 'success.main'
                  }}
                >
                  <TrendingUp />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Doanh Thu Hôm Nay
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {formatCurrency(stats?.todayRevenue)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Month Revenue */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'info.lighter',
                    color: 'info.main'
                  }}
                >
                  <Assessment />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Doanh Thu Tháng Này
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {formatCurrency(stats?.monthRevenue)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Average Fee */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'warning.lighter',
                    color: 'warning.main'
                  }}
                >
                  <AttachMoney />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Phí Trung Bình
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {formatCurrency(stats?.averageFee)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Stats */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Thống Kê Chi Tiết
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" color="text.secondary">
                Tổng Số Giao Dịch
              </Typography>
              <Typography variant="h6">
                {stats?.transactionCount?.toLocaleString('vi-VN') || 0}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" color="text.secondary">
                Phí Thấp Nhất
              </Typography>
              <Typography variant="h6">
                {formatCurrency(stats?.minFee)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" color="text.secondary">
                Phí Cao Nhất
              </Typography>
              <Typography variant="h6">
                {formatCurrency(stats?.maxFee)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Lịch Sử Giao Dịch
          </Typography>
          <Divider sx={{ my: 2 }} />
          
          {transactions.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Chưa có giao dịch nào
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>ID</strong></TableCell>
                      <TableCell><strong>Thời Gian</strong></TableCell>
                      <TableCell><strong>Mô Tả</strong></TableCell>
                      <TableCell align="right"><strong>Số Tiền</strong></TableCell>
                      <TableCell align="right"><strong>Số Dư Sau</strong></TableCell>
                      <TableCell><strong>Loại</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.transactionId} hover>
                        <TableCell>{transaction.transactionId}</TableCell>
                        <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell align="right">
                          <Typography color="success.main" fontWeight={600}>
                            +{formatCurrency(transaction.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(transaction.balanceAfter)}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={transaction.type} 
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                component="div"
                count={stats?.transactionCount || 0}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 20, 50, 100]}
                labelRowsPerPage="Số dòng mỗi trang:"
                labelDisplayedRows={({ from, to, count }) => 
                  `${from}–${to} trong ${count !== -1 ? count : `hơn ${to}`}`
                }
              />
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default AdminRevenuePage;
