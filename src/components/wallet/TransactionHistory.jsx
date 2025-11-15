import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Button, 
  Stack,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper
} from '@mui/material';
import { 
  AccountBalanceWallet, 
  Refresh, 
  TrendingUp, 
  TrendingDown, 
  Payment,
  SwapHoriz,
  Inbox
} from '@mui/icons-material';
import { walletAPI } from '../../services/apiClient';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchTransactions();
    
    // Listen for refresh events
    const handleRefresh = () => {
      setPage(1);
      fetchTransactions(true);
    };
    
    window.addEventListener('refreshTransactions', handleRefresh);
    return () => window.removeEventListener('refreshTransactions', handleRefresh);
  }, []);

  // Helper function to remove duplicate transactions based on transactionId
  const removeDuplicates = (transactions) => {
    const seen = new Set();
    return transactions.filter(transaction => {
      // Use transactionId as unique identifier, fallback to referenceId + createdAt if transactionId is missing
      const uniqueKey = transaction.transactionId 
        ? `id_${transaction.transactionId}`
        : `ref_${transaction.referenceId || 'unknown'}_${transaction.createdAt}`;
      
      if (seen.has(uniqueKey)) {
        console.warn('Duplicate transaction detected:', transaction);
        return false;
      }
      seen.add(uniqueKey);
      return true;
    });
  };

  const fetchTransactions = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentPage = reset ? 1 : page;
      const response = await walletAPI.getTransactions(currentPage, 10);
      
      // Remove duplicates from response
      const uniqueTransactions = removeDuplicates(response.data.transactions || []);
      
      if (reset) {
        setTransactions(uniqueTransactions);
      } else {
        setTransactions(prev => {
          // Combine previous and new transactions, then remove all duplicates
          const combined = [...prev, ...uniqueTransactions];
          return removeDuplicates(combined);
        });
      }
      
      setHasMore(uniqueTransactions.length === 10);
      setPage(currentPage + 1);
      
    } catch (err) {
      setError(err.message);
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + '₫';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'Deposit': return TrendingUp;
      case 'Withdraw': return TrendingDown;
      case 'Payment': return Payment;
      case 'Refund': return SwapHoriz;
      default: return AccountBalanceWallet;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'Deposit': return 'success';
      case 'Refund': return 'success';
      case 'Withdraw': return 'warning';
      case 'Payment': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Pending': return 'warning';
      case 'Failed': return 'error';
      case 'Cancelled': return 'default';
      default: return 'default';
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Đang tải lịch sử giao dịch...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountBalanceWallet />
              Lịch sử giao dịch
            </Typography>
            <Button 
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => fetchTransactions(true)}
              disabled={loading}
            >
              Làm mới
            </Button>
          </Box>

          {error && (
            <Alert severity="error" action={
              <Button color="inherit" size="small" onClick={() => fetchTransactions(true)}>
                Thử lại
              </Button>
            }>
              {error}
            </Alert>
          )}

          {transactions.length === 0 && !loading && !error ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Inbox sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Chưa có giao dịch nào
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Lịch sử giao dịch sẽ hiển thị ở đây khi bạn thực hiện nạp tiền, rút tiền hoặc thanh toán.
              </Typography>
            </Box>
          ) : (
            <>
              <List>
                {transactions.map((transaction, index) => {
                  const TransactionIcon = getTransactionIcon(transaction.transactionType);
                  const isPositive = transaction.transactionType === 'Deposit' || transaction.transactionType === 'Refund';
                  
                  // Create unique key: use transactionId if available, otherwise use index + referenceId + createdAt
                  const uniqueKey = transaction.transactionId 
                    ? `transaction_${transaction.transactionId}`
                    : `transaction_${index}_${transaction.referenceId || 'unknown'}_${transaction.createdAt}`;
                  
                  return (
                    <React.Fragment key={uniqueKey}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <TransactionIcon color={getTransactionColor(transaction.transactionType)} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {transaction.description || transaction.transactionType}
                              </Typography>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography 
                                  variant="h6" 
                                  sx={{ 
                                    fontWeight: 600,
                                    color: isPositive ? 'success.main' : 'error.main'
                                  }}
                                >
                                  {isPositive ? '+' : '-'}{formatCurrency(transaction.amount)}
                                </Typography>
                                <Chip 
                                  label={transaction.status} 
                                  color={getStatusColor(transaction.status)}
                                  size="small"
                                />
                              </Box>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(transaction.createdAt)}
                                {transaction.referenceId && ` • #${transaction.referenceId}`}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Số dư: {formatCurrency(transaction.balanceAfter)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < transactions.length - 1 && <Divider />}
                    </React.Fragment>
                  );
                })}
              </List>

              {hasMore && (
                <Box sx={{ textAlign: 'center' }}>
                  <Button 
                    variant="outlined"
                    onClick={() => fetchTransactions()}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} /> : null}
                  >
                    {loading ? 'Đang tải...' : 'Tải thêm'}
                  </Button>
                </Box>
              )}
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
