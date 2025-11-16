import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  IconButton, 
  Chip,
  Stack,
  Grid,
  Paper,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import { 
  AccountBalanceWallet, 
  Refresh, 
  TrendingUp, 
  TrendingDown, 
  SwapHoriz,
  CheckCircle,
  Warning,
  Error,
  AccountBalance,
  Edit,
  Save,
  Close,
  Add,
  Remove
} from '@mui/icons-material';
import { api } from '../../services/apiClient';
import { BANK_CODES, getBankByCode, getBankByName } from '../../constants/bankCodes';

const WalletBalance = ({ balance, currency, onRefresh, onDeposit, onWithdraw, showBalance = true, showBankInfo = true }) => {
  const [bankInfo, setBankInfo] = useState({
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
    bankCode: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/Auth/profile');
      if (response.data) {
        setBankInfo({
          bankName: response.data.bankName || '',
          bankAccountNumber: response.data.bankAccountNumber || '',
          bankAccountName: response.data.bankAccountName || '',
          bankCode: response.data.bankCode || ''
        });
      }
    } catch (err) {
      console.error('Error fetching user info:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBankInfo(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
    setSuccess(false);
  };

  const handleBankNameChange = (event, newValue) => {
    if (newValue && typeof newValue === 'object') {
      // Nếu chọn từ autocomplete dropdown (object)
      setBankInfo(prev => ({
        ...prev,
        bankName: newValue.name,
        bankCode: newValue.code
      }));
    } else {
      // Nếu xóa hoặc nhập tự do
      const inputValue = typeof newValue === 'string' ? newValue : '';
      setBankInfo(prev => ({
        ...prev,
        bankName: inputValue
      }));
      
      // Tự động tìm và điền bank code nếu tìm thấy
      if (inputValue) {
        const foundBank = getBankByName(inputValue);
        if (foundBank) {
          setBankInfo(prev => ({
            ...prev,
            bankCode: foundBank.code
          }));
        } else {
          // Nếu không tìm thấy, xóa bank code
          setBankInfo(prev => ({
            ...prev,
            bankCode: ''
          }));
        }
      } else {
        // Nếu xóa hết, xóa cả bank code
        setBankInfo(prev => ({
          ...prev,
          bankCode: ''
        }));
      }
    }
    setError(null);
    setSuccess(false);
  };

  // Filter banks dựa trên input
  const filterBanks = (options, { inputValue }) => {
    const searchValue = inputValue.toLowerCase().trim();
    if (!searchValue) return options;
    
    return options.filter(bank => 
      bank.name.toLowerCase().includes(searchValue) ||
      bank.fullName.toLowerCase().includes(searchValue) ||
      bank.code.includes(searchValue)
    );
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await api.put('/Auth/profile', {
        bankName: bankInfo.bankName,
        bankAccountNumber: bankInfo.bankAccountNumber,
        bankAccountName: bankInfo.bankAccountName,
        bankCode: bankInfo.bankCode
      });

      if (response.data) {
        setSuccess(true);
        setEditMode(false);
        setOpenDialog(false);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };
  const formatCurrency = (amount) => {
    // Đảm bảo amount là number
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Format cho VND
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount || 0);
  };

  const getBalanceStatus = () => {
    if (balance === 0) return { status: 'empty', message: 'Ví trống', color: 'error', icon: Error };
    if (balance < 100000) return { status: 'low', message: 'Số dư thấp', color: 'warning', icon: Warning };
    return { status: 'good', message: 'Số dư khả dụng', color: 'success', icon: CheckCircle };
  };

  const balanceInfo = getBalanceStatus();
  const StatusIcon = balanceInfo.icon;

  return (
    <>
    {showBalance && (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountBalanceWallet color="primary" sx={{ fontSize: 24 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Số dư ví
              </Typography>
            </Box>
            <IconButton 
              onClick={onRefresh}
              title="Làm mới"
              color="primary"
              size="small"
            >
              <Refresh fontSize="small" />
            </IconButton>
          </Box>
          
          {/* Balance Amount - Căn giữa */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
              {formatCurrency(balance)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <StatusIcon color={balanceInfo.color} fontSize="small" />
              <Typography variant="body2" color={`${balanceInfo.color}.main`} sx={{ fontWeight: 500 }}>
                {balanceInfo.message}
              </Typography>
            </Box>
          </Box>

          {/* Action Buttons - Đặt ở dưới cùng */}
          <Stack spacing={1.5} sx={{ mt: 'auto', pt: 2 }}>
            <Button
              fullWidth
              variant="contained"
              color="success"
              startIcon={<Add />}
              onClick={onDeposit}
              sx={{ py: 1.2 }}
            >
              Nạp tiền
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="warning"
              startIcon={<Remove />}
              onClick={onWithdraw}
              disabled={balance <= 0}
              sx={{ py: 1.2 }}
            >
              Rút tiền
            </Button>
          </Stack>
        </CardContent>
      </Card>
    )}

    {showBankInfo && (
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack spacing={1.5}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalance color="primary" sx={{ fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Thông tin ngân hàng
                </Typography>
              </Box>
              <IconButton 
                onClick={() => setOpenDialog(true)}
                title="Chỉnh sửa"
                color="primary"
                size="small"
              >
                <Edit fontSize="small" />
              </IconButton>
            </Box>

            {/* Bank Info Display - Compact Grid */}
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    Tên ngân hàng
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {bankInfo.bankName || 'Chưa cập nhật'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    Số tài khoản
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                    {bankInfo.bankAccountNumber || 'Chưa cập nhật'}
                  </Typography>
                </Box>
              </Grid>
              {bankInfo.bankAccountName && (
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                      Tên chủ tài khoản
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {bankInfo.bankAccountName}
                    </Typography>
                  </Box>
                </Grid>
              )}
              {bankInfo.bankCode && (
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                      Mã ngân hàng
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {bankInfo.bankCode}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>

            {/* VietQR Code */}
            {bankInfo.bankAccountNumber && bankInfo.bankCode && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Box
                  component="img"
                  src={`https://img.vietqr.io/image/${bankInfo.bankCode}-${bankInfo.bankAccountNumber}-compact2.png`}
                  alt="VietQR Code"
                  sx={{
                    width: '100%',
                    maxWidth: 250,
                    height: 'auto',
                    aspectRatio: '1/1',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: 'white',
                    p: 0.5
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </Box>
            )}

            {success && (
              <Alert severity="success" onClose={() => setSuccess(false)} sx={{ mt: 1 }}>
                Cập nhật thông tin thành công!
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>
    )}

      {/* Edit Bank Info Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Cập nhật thông tin ngân hàng
            </Typography>
            <IconButton onClick={() => setOpenDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Autocomplete
              freeSolo
              options={BANK_CODES}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                return option.name || option.fullName || '';
              }}
              filterOptions={filterBanks}
              value={bankInfo.bankName ? BANK_CODES.find(b => 
                b.name.toLowerCase() === bankInfo.bankName.toLowerCase() || 
                b.fullName.toLowerCase() === bankInfo.bankName.toLowerCase()
              ) || bankInfo.bankName : null}
              onChange={(event, newValue) => handleBankNameChange(event, newValue)}
              onInputChange={(event, newInputValue, reason) => {
                // Chỉ xử lý khi người dùng nhập (không phải khi chọn từ dropdown)
                if (reason === 'input' && newInputValue) {
                  const foundBank = getBankByName(newInputValue);
                  if (foundBank) {
                    setBankInfo(prev => ({
                      ...prev,
                      bankName: newInputValue,
                      bankCode: foundBank.code
                    }));
                  }
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label="Tên ngân hàng *"
                  placeholder="Nhập tên ngân hàng (ví dụ: Techcombank, Vietcombank...)"
                  required
                  size="small"
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {option.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.code} - {option.fullName}
                    </Typography>
                  </Box>
                </Box>
              )}
            />
            <TextField
              fullWidth
              label="Số tài khoản *"
              name="bankAccountNumber"
              value={bankInfo.bankAccountNumber}
              onChange={handleInputChange}
              placeholder="Nhập số tài khoản ngân hàng"
              required
              size="small"
            />
            <TextField
              fullWidth
              label="Tên chủ tài khoản (tùy chọn)"
              name="bankAccountName"
              value={bankInfo.bankAccountName}
              onChange={handleInputChange}
              placeholder="Tên chủ tài khoản"
              size="small"
            />
            <TextField
              fullWidth
              label="Mã ngân hàng (tùy chọn)"
              name="bankCode"
              value={bankInfo.bankCode}
              onChange={handleInputChange}
              placeholder="Ví dụ: VCB, TCB, BID..."
              helperText="Mã ngân hàng dùng để tạo QR code"
              size="small"
            />
            {error && (
              <Alert severity="error">{error}</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={loading}>
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <Save />}
            disabled={loading || !bankInfo.bankName || !bankInfo.bankAccountNumber}
          >
            {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default WalletBalance;
