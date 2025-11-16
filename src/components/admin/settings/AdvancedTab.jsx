import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid, FormControl,
  InputLabel, Select, MenuItem, Switch, CircularProgress, Divider, LinearProgress, Alert
} from '@mui/material';
import { Speed, Save, Storage, Cloud, DeleteForever, Refresh } from '@mui/icons-material';

const AdvancedTab = ({ saving, onSave, showSnackbar }) => {
  const [advancedSettings, setAdvancedSettings] = useState({
    cacheEnabled: true,
    cacheLifetime: 3600,
    logLevel: 'info',
    maxUploadSize: 10,
    apiRateLimit: 100,
    enableDebugMode: false,
    backupEnabled: true,
    backupFrequency: 'daily'
  });

  const [storageInfo] = useState({ used: 2.5, total: 50, images: 1.2, documents: 0.8, backups: 0.5 });

  const handleChange = (field, value) => {
    setAdvancedSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave();
    showSnackbar('Lưu cài đặt nâng cao thành công', 'success');
  };

  const handleClearCache = () => {
    showSnackbar('Cache đã được xóa', 'success');
  };

  const handleBackupNow = () => {
    showSnackbar('Đang tiến hành sao lưu...', 'info');
    setTimeout(() => showSnackbar('Sao lưu hoàn tất!', 'success'), 3000);
  };

  const storagePercent = (storageInfo.used / storageInfo.total) * 100;

  return (
    <Card className="settings-card">
      <CardContent>
        <Box className="section-header" sx={{ mb: 3 }}>
          <Speed className="section-icon" />
          <Typography variant="h6">Cài Đặt Nâng Cao</Typography>
        </Box>

        {/* Cache & Performance */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Cache & Performance</Typography>
            <Box className="setting-item" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography>Bật Cache</Typography>
                <Typography variant="body2" color="text.secondary">Tăng tốc độ tải trang</Typography>
              </Box>
              <Switch checked={advancedSettings.cacheEnabled} onChange={(e) => handleChange('cacheEnabled', e.target.checked)} />
            </Box>
            {advancedSettings.cacheEnabled && (
              <TextField fullWidth label="Thời gian lưu cache (giây)" type="number" value={advancedSettings.cacheLifetime}
                onChange={(e) => handleChange('cacheLifetime', parseInt(e.target.value))} sx={{ mb: 2 }} />
            )}
            <Button variant="outlined" color="error" startIcon={<DeleteForever />} onClick={handleClearCache}>Xóa Cache</Button>
          </CardContent>
        </Card>

        {/* Storage Info */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Storage /> Lưu Trữ
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Đã sử dụng: {storageInfo.used} GB / {storageInfo.total} GB</Typography>
                <Typography variant="body2" color="primary">{storagePercent.toFixed(1)}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={storagePercent} sx={{ height: 8, borderRadius: 1 }} />
            </Box>
            <Grid container spacing={1}>
              <Grid item xs={6}><Typography variant="body2">🖼️ Images: {storageInfo.images} GB</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2">📄 Documents: {storageInfo.documents} GB</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2">💾 Backups: {storageInfo.backups} GB</Typography></Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Backup Settings */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Cloud /> Sao Lưu
            </Typography>
            <Box className="setting-item" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography>Tự động sao lưu</Typography>
                <Typography variant="body2" color="text.secondary">Sao lưu dữ liệu định kỳ</Typography>
              </Box>
              <Switch checked={advancedSettings.backupEnabled} onChange={(e) => handleChange('backupEnabled', e.target.checked)} />
            </Box>
            {advancedSettings.backupEnabled && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Tần suất sao lưu</InputLabel>
                <Select value={advancedSettings.backupFrequency} onChange={(e) => handleChange('backupFrequency', e.target.value)}>
                  <MenuItem value="hourly">Mỗi giờ</MenuItem>
                  <MenuItem value="daily">Hàng ngày</MenuItem>
                  <MenuItem value="weekly">Hàng tuần</MenuItem>
                </Select>
              </FormControl>
            )}
            <Button variant="contained" startIcon={<Cloud />} onClick={handleBackupNow}>Sao lưu ngay</Button>
          </CardContent>
        </Card>

        {/* Other Settings */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Mức độ log</InputLabel>
              <Select value={advancedSettings.logLevel} onChange={(e) => handleChange('logLevel', e.target.value)}>
                <MenuItem value="debug">Debug</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Dung lượng upload tối đa (MB)" type="number" value={advancedSettings.maxUploadSize}
              onChange={(e) => handleChange('maxUploadSize', parseInt(e.target.value))} />
          </Grid>
          <Grid item xs={12}>
            <Box className="setting-item" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography>Debug Mode</Typography>
                <Typography variant="body2" color="text.secondary">Hiển thị thông tin debug chi tiết</Typography>
              </Box>
              <Switch color="warning" checked={advancedSettings.enableDebugMode} onChange={(e) => handleChange('enableDebugMode', e.target.checked)} />
            </Box>
          </Grid>
        </Grid>

        <Alert severity="warning" sx={{ mt: 2 }}>Debug Mode chỉ nên bật khi cần troubleshoot.</Alert>

        <Box sx={{ mt: 3 }}>
          <Button variant="contained" startIcon={saving ? <CircularProgress size={20} /> : <Save />} onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu Cài Đặt'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AdvancedTab;
