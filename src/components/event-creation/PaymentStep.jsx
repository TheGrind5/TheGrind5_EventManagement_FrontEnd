import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Alert,
  Chip,
  Divider,
  FormControlLabel,
  Switch,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  AccountBalance,
  CreditCard,
  PhoneAndroid,
  AttachMoney,
  Security,
  Info,
  Add,
  Delete
} from '@mui/icons-material';

const PaymentStep = ({ data, onChange }) => {
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState(
    data.selectedPaymentMethods || ['bank_transfer']
  );
  const [bankAccounts, setBankAccounts] = useState(
    data.bankAccounts || [
      {
        bankName: 'MB Bank',
        accountNumber: '04358345653',
        accountHolder: 'Khanh Ngu da',
        isDefault: true
      }
    ]
  );

  // Sync local state with data prop
  React.useEffect(() => {
    if (data.selectedPaymentMethods) {
      setSelectedPaymentMethods(data.selectedPaymentMethods);
    }
  }, [data.selectedPaymentMethods]);

  React.useEffect(() => {
    if (data.bankAccounts) {
      setBankAccounts(data.bankAccounts);
    }
  }, [data.bankAccounts]);

  const handleInputChange = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const paymentMethods = [
    {
      id: 'bank_transfer',
      name: 'Chuyển khoản ngân hàng',
      icon: <AccountBalance />,
      description: 'Chuyển khoản qua ngân hàng',
      enabled: true
    },
    {
      id: 'credit_card',
      name: 'Thẻ tín dụng',
      icon: <CreditCard />,
      description: 'Visa, Mastercard, JCB',
      enabled: false
    },
    {
      id: 'momo',
      name: 'Ví MoMo',
      icon: <PhoneAndroid />,
      description: 'Thanh toán qua ví MoMo',
      enabled: false
    },
    {
      id: 'zalopay',
      name: 'ZaloPay',
      icon: <PhoneAndroid />,
      description: 'Thanh toán qua ZaloPay',
      enabled: false
    },
    {
      id: 'vnpay',
      name: 'VNPay',
      icon: <AttachMoney />,
      description: 'Thanh toán qua VNPay',
      enabled: false
    },
    {
      id: 'cash',
      name: 'Tiền mặt',
      icon: <AttachMoney />,
      description: 'Thanh toán tại sự kiện',
      enabled: true
    }
  ];

  const handlePaymentMethodToggle = (methodId) => {
    const newMethods = selectedPaymentMethods.includes(methodId)
      ? selectedPaymentMethods.filter(id => id !== methodId)
      : [...selectedPaymentMethods, methodId];
    
    setSelectedPaymentMethods(newMethods);
    handleInputChange('selectedPaymentMethods', newMethods);
  };

  const addBankAccount = () => {
    const newAccount = {
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      isDefault: bankAccounts.length === 0
    };
    const newAccounts = [...bankAccounts, newAccount];
    setBankAccounts(newAccounts);
    handleInputChange('bankAccounts', newAccounts);
  };

  const updateBankAccount = (index, field, value) => {
    const newAccounts = [...bankAccounts];
    newAccounts[index] = { ...newAccounts[index], [field]: value };
    setBankAccounts(newAccounts);
    handleInputChange('bankAccounts', newAccounts);
  };

  const removeBankAccount = (index) => {
    const newAccounts = bankAccounts.filter((_, i) => i !== index);
    setBankAccounts(newAccounts);
    handleInputChange('bankAccounts', newAccounts);
  };

  const setDefaultBankAccount = (index) => {
    const newAccounts = bankAccounts.map((account, i) => ({
      ...account,
      isDefault: i === index
    }));
    setBankAccounts(newAccounts);
    handleInputChange('bankAccounts', newAccounts);
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Cài đặt thanh toán chuyên nghiệp
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Payment Methods Selection */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Phương thức thanh toán
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Chọn các phương thức thanh toán mà bạn muốn chấp nhận cho sự kiện này
          </Typography>
          
          <Grid container spacing={2}>
            {paymentMethods.map((method) => (
              <Grid item xs={12} sm={6} md={4} key={method.id}>
                <Card 
                  sx={{ 
                    p: 2, 
                    cursor: 'pointer',
                    border: selectedPaymentMethods.includes(method.id) ? 2 : 1,
                    borderColor: selectedPaymentMethods.includes(method.id) ? 'primary.main' : 'divider',
                    bgcolor: selectedPaymentMethods.includes(method.id) ? 'primary.50' : 'background.paper',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'primary.50'
                    }
                  }}
                  onClick={() => handlePaymentMethodToggle(method.id)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {method.icon}
                    <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 600 }}>
                      {method.name}
                    </Typography>
                    {method.enabled && (
                      <Chip 
                        label="Sẵn sàng" 
                        size="small" 
                        color="success" 
                        sx={{ ml: 'auto' }}
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {method.description}
                  </Typography>
                  {!method.enabled && (
                    <Chip 
                      label="Sắp ra mắt" 
                      size="small" 
                      color="default" 
                      sx={{ mt: 1 }}
                    />
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        </Card>

        {/* Bank Accounts Management */}
        {selectedPaymentMethods.includes('bank_transfer') && (
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Tài khoản ngân hàng
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={addBankAccount}
                size="small"
              >
                Thêm tài khoản
              </Button>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Thêm thông tin tài khoản ngân hàng để nhận thanh toán
            </Typography>

            {bankAccounts.map((account, index) => (
              <Card key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Tài khoản {index + 1}
                  </Typography>
                  <Box>
                    {account.isDefault && (
                      <Chip label="Mặc định" color="primary" size="small" sx={{ mr: 1 }} />
                    )}
                    <IconButton
                      color="error"
                      onClick={() => removeBankAccount(index)}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Tên ngân hàng"
                      value={account.bankName}
                      onChange={(e) => updateBankAccount(index, 'bankName', e.target.value)}
                      fullWidth
                      required
                      placeholder="VD: Vietcombank, MB Bank, Techcombank"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Số tài khoản"
                      value={account.accountNumber}
                      onChange={(e) => updateBankAccount(index, 'accountNumber', e.target.value)}
                      fullWidth
                      required
                      placeholder="VD: 1234567890"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Tên chủ tài khoản"
                      value={account.accountHolder}
                      onChange={(e) => updateBankAccount(index, 'accountHolder', e.target.value)}
                      fullWidth
                      required
                      placeholder="VD: Nguyễn Văn A"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant={account.isDefault ? "contained" : "outlined"}
                      onClick={() => setDefaultBankAccount(index)}
                      size="small"
                    >
                      {account.isDefault ? "Tài khoản mặc định" : "Đặt làm mặc định"}
                    </Button>
                  </Grid>
                </Grid>
              </Card>
            ))}
          </Card>
        )}

        {/* Payment Settings */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Cài đặt thanh toán
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={data.autoConfirm || false}
                    onChange={(e) => handleInputChange('autoConfirm', e.target.checked)}
                  />
                }
                label="Tự động xác nhận thanh toán"
              />
              <Typography variant="caption" color="text.secondary" display="block">
                Tự động xác nhận khi nhận được thanh toán
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={data.requirePaymentProof || false}
                    onChange={(e) => handleInputChange('requirePaymentProof', e.target.checked)}
                  />
                }
                label="Yêu cầu chứng từ thanh toán"
              />
              <Typography variant="caption" color="text.secondary" display="block">
                Yêu cầu người mua vé upload ảnh chuyển khoản
              </Typography>
            </Grid>
          </Grid>
        </Card>

        {/* Security & Compliance */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Bảo mật & Tuân thủ
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Thông tin thuế (tùy chọn)"
                value={data.taxInfo || ''}
                onChange={(e) => handleInputChange('taxInfo', e.target.value)}
                fullWidth
                multiline
                rows={2}
                placeholder="Mã số thuế, tên công ty, địa chỉ..."
                helperText="Thông tin này sẽ được hiển thị trên hóa đơn"
              />
            </Grid>
          </Grid>
        </Card>

        {/* Information Alerts */}
        <Alert severity="info" icon={<Info />}>
          <Typography variant="body2">
            <strong>Lưu ý:</strong> Thông tin thanh toán sẽ được hiển thị cho người tham gia 
            khi họ mua vé. Hãy đảm bảo thông tin chính xác để tránh nhầm lẫn.
          </Typography>
        </Alert>

        <Alert severity="warning" icon={<Security />}>
          <Typography variant="body2">
            <strong>Bảo mật:</strong> Thông tin tài khoản ngân hàng sẽ được mã hóa và bảo mật. 
            Chỉ hiển thị 4 số cuối cho người mua vé.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default PaymentStep;
