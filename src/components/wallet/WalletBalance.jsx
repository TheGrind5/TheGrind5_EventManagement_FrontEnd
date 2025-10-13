import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  IconButton, 
  Chip,
  Stack,
  Grid,
  Paper
} from '@mui/material';
import { 
  AccountBalanceWallet, 
  Refresh, 
  TrendingUp, 
  TrendingDown, 
  SwapHoriz,
  CheckCircle,
  Warning,
  Error
} from '@mui/icons-material';

const WalletBalance = ({ balance, currency, onRefresh }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'VND' ? 'VND' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getBalanceStatus = () => {
    if (balance === 0) return { status: 'empty', message: 'Ví trống', color: 'error', icon: Error };
    if (balance < 100000) return { status: 'low', message: 'Số dư thấp', color: 'warning', icon: Warning };
    return { status: 'good', message: 'Số dư khả dụng', color: 'success', icon: CheckCircle };
  };

  const balanceInfo = getBalanceStatus();
  const StatusIcon = balanceInfo.icon;

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Stack spacing={3}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalanceWallet color="primary" />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Số dư ví
                </Typography>
              </Box>
              <IconButton 
                onClick={onRefresh}
                title="Làm mới"
                color="primary"
              >
                <Refresh />
              </IconButton>
            </Box>
            
            {/* Balance Amount */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {formatCurrency(balance)}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {currency}
              </Typography>
            </Box>

            {/* Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <StatusIcon color={balanceInfo.color} />
              <Typography variant="body1" color={`${balanceInfo.color}.main`}>
                {balanceInfo.message}
              </Typography>
            </Box>

            {/* Details */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Trạng thái
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Hoạt động
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Cập nhật
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Vừa xong
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <TrendingUp color="success" sx={{ mb: 1 }} />
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Tổng nạp
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              -
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <TrendingDown color="warning" sx={{ mb: 1 }} />
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Tổng chi
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              -
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <SwapHoriz color="info" sx={{ mb: 1 }} />
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Giao dịch
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              -
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default WalletBalance;
