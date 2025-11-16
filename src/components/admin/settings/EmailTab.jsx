import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Email,
  Save,
  Visibility,
  VisibilityOff,
  Send
} from '@mui/icons-material';

const EmailTab = ({ saving, onSave, showSnackbar }) => {
  const [emailConfig, setEmailConfig] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    smtpUseSsl: true,
    fromEmail: 'noreply@futicket.com',
    fromName: 'FUTicket',
    replyToEmail: 'support@futicket.com'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [testEmailSending, setTestEmailSending] = useState(false);

  const handleChange = (field, value) => {
    setEmailConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    console.log('Saving email config:', emailConfig);
    onSave();
    showSnackbar('Lưu cấu hình email thành công', 'success');
  };

  const handleTestEmail = () => {
    setTestEmailSending(true);
    setTimeout(() => {
      showSnackbar('Email test đã được gửi thành công!', 'success');
      setTestEmailSending(false);
    }, 2000);
  };

  return (
    <Card className="settings-card">
      <CardContent>
        <Box className="section-header" sx={{ mb: 3 }}>
          <Email className="section-icon" />
          <Typography variant="h6" className="section-title">
            Cấu Hình Email SMTP
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Thiết lập SMTP để gửi email tự động (đăng ký, xác nhận, thông báo, v.v.)
        </Alert>

        <Grid container spacing={3}>
          {/* SMTP Host */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="SMTP Host"
              value={emailConfig.smtpHost}
              onChange={(e) => handleChange('smtpHost', e.target.value)}
              placeholder="smtp.gmail.com"
              helperText="Ví dụ: smtp.gmail.com, smtp.sendgrid.net"
            />
          </Grid>

          {/* SMTP Port */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="SMTP Port"
              type="number"
              value={emailConfig.smtpPort}
              onChange={(e) => handleChange('smtpPort', parseInt(e.target.value))}
              placeholder="587"
              helperText="587 (TLS) hoặc 465 (SSL)"
            />
          </Grid>

          {/* Username */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Username/Email"
              value={emailConfig.smtpUsername}
              onChange={(e) => handleChange('smtpUsername', e.target.value)}
              placeholder="your-email@gmail.com"
            />
          </Grid>

          {/* Password */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={emailConfig.smtpPassword}
              onChange={(e) => handleChange('smtpPassword', e.target.value)}
              placeholder="App password hoặc mật khẩu email"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          {/* SSL/TLS */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={emailConfig.smtpUseSsl}
                  onChange={(e) => handleChange('smtpUseSsl', e.target.checked)}
                  color="primary"
                />
              }
              label="Sử dụng SSL/TLS (Bảo mật)"
            />
          </Grid>

          {/* From Email */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="From Email"
              value={emailConfig.fromEmail}
              onChange={(e) => handleChange('fromEmail', e.target.value)}
              placeholder="noreply@futicket.com"
              helperText="Email người gửi"
            />
          </Grid>

          {/* From Name */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="From Name"
              value={emailConfig.fromName}
              onChange={(e) => handleChange('fromName', e.target.value)}
              placeholder="FUTicket"
              helperText="Tên người gửi"
            />
          </Grid>

          {/* Reply To */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Reply To Email"
              value={emailConfig.replyToEmail}
              onChange={(e) => handleChange('replyToEmail', e.target.value)}
              placeholder="support@futicket.com"
              helperText="Email nhận phản hồi"
            />
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box className="action-buttons" sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : 'Lưu Cài Đặt'}
          </Button>

          <Button
            variant="outlined"
            startIcon={testEmailSending ? <CircularProgress size={20} /> : <Send />}
            onClick={handleTestEmail}
            disabled={testEmailSending || !emailConfig.smtpUsername}
          >
            {testEmailSending ? 'Đang gửi...' : 'Gửi Email Test'}
          </Button>
        </Box>

        {/* Help Text */}
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="body2" gutterBottom>
            <strong>Lưu ý với Gmail:</strong>
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 0 }}>
            <li>Bật "2-Step Verification" trong Google Account</li>
            <li>Tạo "App Password" tại: myaccount.google.com/apppasswords</li>
            <li>Sử dụng App Password thay vì mật khẩu Gmail thường</li>
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default EmailTab;
