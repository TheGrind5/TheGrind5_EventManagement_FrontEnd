import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Payment,
  Save,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';

const PaymentTab = ({ saving, onSave, showSnackbar }) => {
  const [paymentSettings, setPaymentSettings] = useState({
    // PayOS
    payOSEnabled: true,
    payOSClientId: '',
    payOSApiKey: '',
    payOSChecksumKey: '',
    payOSEnvironment: 'sandbox',
    
    // VNPay
    vnPayEnabled: false,
    vnPayTmnCode: '',
    vnPayHashSecret: '',
    vnPayUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    
    // Transaction Rules
    transactionFeePercent: 2.5,
    minTransactionAmount: 10000,
    maxTransactionAmount: 50000000
  });

  const [showKeys, setShowKeys] = useState({
    payOSApiKey: false,
    payOSChecksumKey: false,
    vnPayHashSecret: false
  });

  const handleChange = (field, value) => {
    setPaymentSettings(prev => ({ ...prev, [field]: value }));
  };

  const toggleKeyVisibility = (field) => {
    setShowKeys(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = () => {
    console.log('Saving payment settings:', paymentSettings);
    onSave();
    showSnackbar('Lưu cài đặt thanh toán thành công', 'success');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  return (
    <Card className="settings-card">
      <CardContent>
        <Box className="section-header" sx={{ mb: 3 }}>
          <Payment className="section-icon" />
          <Typography variant="h6" className="section-title">
            Cài Đặt Thanh Toán
          </Typography>
        </Box>

        {/* PayOS Configuration */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center" gap={2}>
                {paymentSettings.payOSEnabled ? (
                  <CheckCircle color="success" />
                ) : (
                  <ErrorIcon color="disabled" />
                )}
                <Typography variant="h6">PayOS Configuration</Typography>
              </Box>
              <Switch
                checked={paymentSettings.payOSEnabled}
                onChange={(e) => handleChange('payOSEnabled', e.target.checked)}
                color="primary"
              />
            </Box>

            {paymentSettings.payOSEnabled && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Alert severity="info">
                    PayOS là cổng thanh toán chính của hệ thống. Đăng ký tại: <strong>payos.vn</strong>
                  </Alert>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Client ID"
                    value={paymentSettings.payOSClientId}
                    onChange={(e) => handleChange('payOSClientId', e.target.value)}
                    placeholder="Nhập Client ID từ PayOS"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="API Key"
                    type={showKeys.payOSApiKey ? 'text' : 'password'}
                    value={paymentSettings.payOSApiKey}
                    onChange={(e) => handleChange('payOSApiKey', e.target.value)}
                    placeholder="Nhập API Key"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => toggleKeyVisibility('payOSApiKey')}>
                            {showKeys.payOSApiKey ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Checksum Key"
                    type={showKeys.payOSChecksumKey ? 'text' : 'password'}
                    value={paymentSettings.payOSChecksumKey}
                    onChange={(e) => handleChange('payOSChecksumKey', e.target.value)}
                    placeholder="Nhập Checksum Key"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => toggleKeyVisibility('payOSChecksumKey')}>
                            {showKeys.payOSChecksumKey ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Môi trường</InputLabel>
                    <Select
                      value={paymentSettings.payOSEnvironment}
                      onChange={(e) => handleChange('payOSEnvironment', e.target.value)}
                    >
                      <MenuItem value="sandbox">Sandbox (Test)</MenuItem>
                      <MenuItem value="production">Production (Live)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* VNPay Configuration */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center" gap={2}>
                {paymentSettings.vnPayEnabled ? (
                  <CheckCircle color="success" />
                ) : (
                  <ErrorIcon color="disabled" />
                )}
                <Typography variant="h6">VNPay Configuration</Typography>
              </Box>
              <Switch
                checked={paymentSettings.vnPayEnabled}
                onChange={(e) => handleChange('vnPayEnabled', e.target.checked)}
                color="primary"
              />
            </Box>

            {paymentSettings.vnPayEnabled && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Alert severity="info">
                    VNPay là cổng thanh toán phụ. Đăng ký tại: <strong>vnpay.vn</strong>
                  </Alert>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="TMN Code"
                    value={paymentSettings.vnPayTmnCode}
                    onChange={(e) => handleChange('vnPayTmnCode', e.target.value)}
                    placeholder="Mã website"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Hash Secret"
                    type={showKeys.vnPayHashSecret ? 'text' : 'password'}
                    value={paymentSettings.vnPayHashSecret}
                    onChange={(e) => handleChange('vnPayHashSecret', e.target.value)}
                    placeholder="Secret key"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => toggleKeyVisibility('vnPayHashSecret')}>
                            {showKeys.vnPayHashSecret ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="VNPay URL"
                    value={paymentSettings.vnPayUrl}
                    onChange={(e) => handleChange('vnPayUrl', e.target.value)}
                    placeholder="URL thanh toán VNPay"
                  />
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* Transaction Rules */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quy Tắc Giao Dịch
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Phí giao dịch (%)"
                  type="number"
                  value={paymentSettings.transactionFeePercent}
                  onChange={(e) => handleChange('transactionFeePercent', parseFloat(e.target.value))}
                  inputProps={{ min: 0, max: 10, step: 0.1 }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Số tiền tối thiểu"
                  type="number"
                  value={paymentSettings.minTransactionAmount}
                  onChange={(e) => handleChange('minTransactionAmount', parseInt(e.target.value))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>
                  }}
                  helperText={formatCurrency(paymentSettings.minTransactionAmount) + ' đ'}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Số tiền tối đa"
                  type="number"
                  value={paymentSettings.maxTransactionAmount}
                  onChange={(e) => handleChange('maxTransactionAmount', parseInt(e.target.value))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>
                  }}
                  helperText={formatCurrency(paymentSettings.maxTransactionAmount) + ' đ'}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box className="action-buttons" sx={{ mt: 3 }}>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : 'Lưu Cài Đặt'}
          </Button>
        </Box>

        {/* Security Warning */}
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Bảo mật:</strong> API Keys và Secret Keys rất quan trọng. Không chia sẻ cho bất kỳ ai!
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default PaymentTab;
