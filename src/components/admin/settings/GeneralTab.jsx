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
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  Language,
  Save,
  Public,
  Phone,
  Email
} from '@mui/icons-material';

const GeneralTab = ({ saving, onSave, showSnackbar }) => {
  const [generalSettings, setGeneralSettings] = useState({
    // Site Info
    siteName: 'FUTicket',
    siteDescription: 'Event Management & Ticketing Platform',
    siteUrl: 'https://futicket.com',
    
    // Contact
    contactEmail: 'contact@futicket.com',
    supportEmail: 'support@futicket.com',
    supportPhone: '+84 123 456 789',
    
    // Localization
    defaultLanguage: 'vi',
    timezone: 'Asia/Ho_Chi_Minh',
    currency: 'VND',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    
    // Pagination
    itemsPerPage: 20
  });

  const handleChange = (field, value) => {
    setGeneralSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    console.log('Saving general settings:', generalSettings);
    onSave();
    showSnackbar('Lưu cài đặt chung thành công', 'success');
  };

  return (
    <Card className="settings-card">
      <CardContent>
        <Box className="section-header" sx={{ mb: 3 }}>
          <Language className="section-icon" />
          <Typography variant="h6" className="section-title">
            Cài Đặt Chung
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Site Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Public /> Thông Tin Website
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Tên Website"
              value={generalSettings.siteName}
              onChange={(e) => handleChange('siteName', e.target.value)}
              placeholder="FUTicket"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="URL Website"
              value={generalSettings.siteUrl}
              onChange={(e) => handleChange('siteUrl', e.target.value)}
              placeholder="https://futicket.com"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Mô tả Website"
              multiline
              rows={3}
              value={generalSettings.siteDescription}
              onChange={(e) => handleChange('siteDescription', e.target.value)}
              placeholder="Mô tả ngắn về website..."
            />
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Phone /> Thông Tin Liên Hệ
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email Liên Hệ"
              value={generalSettings.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Email fontSize="small" /></InputAdornment>
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email Hỗ Trợ"
              value={generalSettings.supportEmail}
              onChange={(e) => handleChange('supportEmail', e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Email fontSize="small" /></InputAdornment>
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Số Điện Thoại Hỗ Trợ"
              value={generalSettings.supportPhone}
              onChange={(e) => handleChange('supportPhone', e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Phone fontSize="small" /></InputAdornment>
              }}
            />
          </Grid>

          {/* Localization */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Language /> Ngôn Ngữ & Khu Vực
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Ngôn ngữ mặc định</InputLabel>
              <Select
                value={generalSettings.defaultLanguage}
                onChange={(e) => handleChange('defaultLanguage', e.target.value)}
              >
                <MenuItem value="vi">🇻🇳 Tiếng Việt</MenuItem>
                <MenuItem value="en">🇬🇧 English</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Múi giờ</InputLabel>
              <Select
                value={generalSettings.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
              >
                <MenuItem value="Asia/Ho_Chi_Minh">Ho Chi Minh (UTC+7)</MenuItem>
                <MenuItem value="Asia/Bangkok">Bangkok (UTC+7)</MenuItem>
                <MenuItem value="Asia/Singapore">Singapore (UTC+8)</MenuItem>
                <MenuItem value="Asia/Tokyo">Tokyo (UTC+9)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Định dạng ngày</InputLabel>
              <Select
                value={generalSettings.dateFormat}
                onChange={(e) => handleChange('dateFormat', e.target.value)}
              >
                <MenuItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</MenuItem>
                <MenuItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</MenuItem>
                <MenuItem value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Định dạng giờ</InputLabel>
              <Select
                value={generalSettings.timeFormat}
                onChange={(e) => handleChange('timeFormat', e.target.value)}
              >
                <MenuItem value="12h">12 giờ (2:30 PM)</MenuItem>
                <MenuItem value="24h">24 giờ (14:30)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Đơn vị tiền tệ</InputLabel>
              <Select
                value={generalSettings.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
              >
                <MenuItem value="VND">VND (₫)</MenuItem>
                <MenuItem value="USD">USD ($)</MenuItem>
                <MenuItem value="EUR">EUR (€)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Display Settings */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Hiển Thị
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Số items mỗi trang"
              type="number"
              value={generalSettings.itemsPerPage}
              onChange={(e) => handleChange('itemsPerPage', parseInt(e.target.value))}
              inputProps={{ min: 10, max: 100, step: 10 }}
              helperText="Số lượng items hiển thị trong danh sách"
            />
          </Grid>
        </Grid>

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
      </CardContent>
    </Card>
  );
};

export default GeneralTab;
