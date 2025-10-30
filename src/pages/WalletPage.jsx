import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Stack, 
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import { 
  AccountBalanceWallet, 
  Add, 
  Remove 
} from '@mui/icons-material';
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
      setBalance(response.balance);
      setCurrency(response.currency || 'VND');
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
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={4}>
          {/* Header */}
          <Box textAlign="center">
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              💳 Quản lý ví của tôi
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Quản lý số dư và giao dịch ví điện tử
            </Typography>
          </Box>

          {/* Wallet Balance Section */}
          <Box>
            <WalletBalance 
              balance={balance}
              currency={currency}
              onRefresh={fetchWalletBalance}
            />
            
            <Stack 
              direction="row" 
              spacing={2} 
              justifyContent="center" 
              sx={{ mt: 3 }}
            >
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<Add />}
                onClick={() => setShowDepositModal(true)}
                sx={{ minWidth: 150 }}
              >
                Nạp tiền
              </Button>
              <Button
                variant="contained"
                color="warning"
                size="large"
                startIcon={<Remove />}
                onClick={() => setShowWithdrawModal(true)}
                disabled={balance <= 0}
                sx={{ minWidth: 150 }}
              >
                Rút tiền
              </Button>
            </Stack>
          </Box>

          {/* Transaction History Section */}
          <Paper sx={{ p: 3 }}>
            <TransactionHistory />
          </Paper>
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
