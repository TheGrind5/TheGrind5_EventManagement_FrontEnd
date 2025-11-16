import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Stack, 
  CircularProgress,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import { 
  AccountBalanceWallet
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { walletAPI } from '../services/apiClient';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/layout/Header';
import WalletBalance from '../components/wallet/WalletBalance';
import DepositModal from '../components/wallet/DepositModal';
import QuickWithdrawalModal from '../components/wallet/QuickWithdrawalModal';
import TransactionHistory from '../components/wallet/TransactionHistory';
import WithdrawalRequestStatus from '../components/wallet/WithdrawalRequestStatus';

const WalletPage = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('VND');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchWalletBalance();
    fetchTransactionsForChart();
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

  const fetchTransactionsForChart = async () => {
    try {
      // Fetch nhiều transactions để có đủ dữ liệu cho biểu đồ
      const response = await walletAPI.getTransactions(1, 100);
      if (response.data && response.data.transactions) {
        setTransactions(response.data.transactions);
      }
    } catch (err) {
      console.error('Error fetching transactions for chart:', err);
    }
  };

  const handleDepositSuccess = (newBalance) => {
    setBalance(newBalance);
    setShowDepositModal(false);
    // Refresh transaction history
    window.dispatchEvent(new CustomEvent('refreshTransactions'));
    // Refresh chart data
    fetchTransactionsForChart();
  };

  const handleWithdrawSuccess = (newBalance) => {
    setBalance(newBalance);
    setShowWithdrawModal(false);
    // Refresh transaction history
    window.dispatchEvent(new CustomEvent('refreshTransactions'));
    // Refresh chart data
    fetchTransactionsForChart();
  };

  // Tính toán dữ liệu cho biểu đồ theo 6 tháng gần nhất
  const calculateChartData = () => {
    const now = new Date();
    const months = [];
    
    // Tạo 6 tháng gần nhất
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = `T${date.getMonth() + 1}`;
      months.push({
        name: monthName,
        month: date.getMonth(),
        year: date.getFullYear(),
        nạp: 0,
        chi: 0
      });
    }

    // Phân loại transactions theo tháng
    transactions.forEach(transaction => {
      if (transaction.status === 'Completed') {
        const transactionDate = new Date(transaction.createdAt);
        const monthIndex = months.findIndex(
          m => m.month === transactionDate.getMonth() && 
               m.year === transactionDate.getFullYear()
        );

        if (monthIndex !== -1) {
          // Chuyển đổi amount sang số nếu là string
          const amount = typeof transaction.amount === 'string' 
            ? parseFloat(transaction.amount) 
            : transaction.amount;
            
          if (transaction.transactionType === 'Deposit' || transaction.transactionType === 'Refund') {
            months[monthIndex].nạp += amount || 0;
          } else if (transaction.transactionType === 'Withdraw' || transaction.transactionType === 'Payment') {
            months[monthIndex].chi += amount || 0;
          }
        }
      }
    });

    return months;
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

          {/* Main Content Grid: Bank + Wallet + Transaction History với tỷ lệ 32.5%:25%:42.5% */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            {/* Thông tin ngân hàng - 32.5% */}
            <Box sx={{ flex: { xs: '1 1 100%', md: '32.5 32.5 0' }, minWidth: 0 }}>
              <WalletBalance 
                balance={balance}
                currency={currency}
                onRefresh={fetchWalletBalance}
                onDeposit={() => setShowDepositModal(true)}
                onWithdraw={() => setShowWithdrawModal(true)}
                showBalance={false}
              />
            </Box>

            {/* Số dư ví - 25% */}
            <Box sx={{ flex: { xs: '1 1 100%', md: '25 25 0' }, minWidth: 0 }}>
              <WalletBalance 
                balance={balance}
                currency={currency}
                onRefresh={fetchWalletBalance}
                onDeposit={() => setShowDepositModal(true)}
                onWithdraw={() => setShowWithdrawModal(true)}
                showBankInfo={false}
              />
            </Box>

            {/* Lịch sử giao dịch - 42.5% với scroll, GIỚI HẠN chiều cao 300px */}
            <Box sx={{ 
              flex: { xs: '1 1 100%', md: '42.5 42.5 0' }, 
              minWidth: 0, 
              height: { xs: 'auto', md: '300px' },
              maxHeight: { xs: 'none', md: '300px' }
            }}>
              <TransactionHistory />
            </Box>
          </Box>

          {/* Statistics Chart & Withdrawal Requests */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            {/* Chart - 70% */}
            <Box sx={{ flex: { xs: '1 1 100%', md: '70 70 0' } }}>
              <Card>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Thống kê nạp/chi
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={calculateChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="#888" fontSize={12} />
                      <YAxis stroke="#888" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.8)', 
                          border: 'none',
                          borderRadius: '4px'
                        }}
                        formatter={(value) => new Intl.NumberFormat('vi-VN').format(value) + '₫'}
                      />
                      <Legend />
                      <Bar dataKey="nạp" fill="#4caf50" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="chi" fill="#ff9800" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>

            {/* Withdrawal Requests - 30% */}
            <Box sx={{ flex: { xs: '1 1 100%', md: '30 30 0' } }}>
              <WithdrawalRequestStatus />
            </Box>
          </Box>
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
        <QuickWithdrawalModal
          open={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          currentBalance={balance}
          userBankInfo={{
            bankName: user?.bankName,
            bankAccountNumber: user?.bankAccountNumber,
            bankAccountName: user?.bankAccountName,
            bankCode: user?.bankCode,
            username: user?.username
          }}
        />
      )}
    </Box>
  );
};

export default WalletPage;
