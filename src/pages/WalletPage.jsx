import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Stack, 
  CircularProgress,
  Alert,
  Paper,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { 
  AccountBalanceWallet, 
  Add, 
  Remove 
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { walletAPI } from '../services/apiClient';
import Header from '../components/layout/Header';
import WalletBalance from '../components/wallet/WalletBalance';
import DepositModal from '../components/wallet/DepositModal';
import WithdrawModal from '../components/wallet/WithdrawModal';
import TransactionHistory from '../components/wallet/TransactionHistory';

const WalletPage = () => {
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('VND');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      setLoading(true);
      const response = await walletAPI.getBalance();
      setBalance(response.data.balance || 0);
      setCurrency(response.data.currency || 'VND');
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching wallet balance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDepositSuccess = (newBalance) => {
    setBalance(newBalance);
    setShowDepositModal(false);
    // Refresh transaction history
    window.dispatchEvent(new CustomEvent('refreshTransactions'));
  };

  const handleWithdrawSuccess = (newBalance) => {
    setBalance(newBalance);
    setShowWithdrawModal(false);
    // Refresh transaction history
    window.dispatchEvent(new CustomEvent('refreshTransactions'));
  };

  if (loading) {
    return (
      <Box>
        <Header />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center" 
            minHeight="400px"
            gap={2}
          >
            <CircularProgress size={60} />
            <Typography variant="h6" color="text.secondary">
              Đang tải thông tin ví...
            </Typography>
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
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center" 
            minHeight="400px"
            gap={2}
          >
            <Alert severity="error" sx={{ width: '100%', maxWidth: 500 }}>
              <Typography variant="h6" gutterBottom>
                Lỗi tải thông tin ví
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {error}
              </Typography>
              <Button 
                variant="contained" 
                color="error"
                onClick={fetchWalletBalance}
                startIcon={<AccountBalanceWallet />}
              >
                Thử lại
              </Button>
            </Alert>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box>
      <Header />
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Stack spacing={2.5}>
          {/* Header - Compact */}
          <Box textAlign="center" sx={{ mb: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              💳 Quản lý ví của tôi
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Quản lý số dư và giao dịch ví điện tử
            </Typography>
          </Box>

          {/* Main Content Grid: Wallet + Bank + Transaction History */}
          <Grid container spacing={2}>
            {/* Wallet Balance + Bank Info */}
            <Grid item xs={12} md={6}>
              <WalletBalance 
                balance={balance}
                currency={currency}
                onRefresh={fetchWalletBalance}
                onDeposit={() => setShowDepositModal(true)}
                onWithdraw={() => setShowWithdrawModal(true)}
              />
            </Grid>

            {/* Transaction History - Chiếm phần còn lại */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <TransactionHistory />
              </Paper>
            </Grid>
          </Grid>

          {/* Statistics Chart - Full Width */}
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Thống kê nạp/chi
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { name: 'T1', nạp: 0, chi: 0 },
                  { name: 'T2', nạp: 0, chi: 0 },
                  { name: 'T3', nạp: 0, chi: 0 },
                  { name: 'T4', nạp: 0, chi: 0 },
                  { name: 'T5', nạp: 0, chi: 0 },
                  { name: 'T6', nạp: 0, chi: 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: 'none',
                      borderRadius: '4px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="nạp" fill="#4caf50" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="chi" fill="#ff9800" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Stack>
      </Container>

      {/* Modals */}
      {showDepositModal && (
        <DepositModal
          onClose={() => setShowDepositModal(false)}
          onSuccess={handleDepositSuccess}
        />
      )}

      {showWithdrawModal && (
        <WithdrawModal
          currentBalance={balance}
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={handleWithdrawSuccess}
        />
      )}
    </Box>
  );
};

export default WalletPage;
