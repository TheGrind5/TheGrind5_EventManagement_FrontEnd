import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Grid,
  Paper,
  IconButton,
  InputAdornment,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import {
  Person,
  Lock,
  Settings as SettingsIcon,
  Notifications,
  Save,
  Visibility,
  VisibilityOff,
  Security,
  Email,
  Phone,
  Edit
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/apiClient';
import adminAPI from '../../services/adminAPI';
import '../../styles/AdminSettings.css';

const AdminSettingsPage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Profile Settings
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    username: ''
  });

  // Security Settings
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    requireEmailVerification: true,
    sessionTimeout: 30
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    systemAnnouncements: true,
    orderNotifications: true,
    userNotifications: true,
    eventNotifications: true
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        username: user.username || ''
      });
    }
    fetchSystemSettings();
    fetchNotificationSettings();
  }, [user]);

  const fetchNotificationSettings = async () => {
    try {
      const response = await adminAPI.getAdminNotificationSettings();
      if (response.success && response.data) {
        setNotificationSettings({
          emailNotifications: response.data.emailNotifications !== false,
          systemAnnouncements: response.data.systemAnnouncements !== false,
          orderNotifications: response.data.orderNotifications !== false,
          userNotifications: response.data.userNotifications !== false,
          eventNotifications: response.data.eventNotifications !== false
        });
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      // Don't show error, use defaults
    }
  };

  const fetchSystemSettings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSystemSettings();
      if (response.success && response.data) {
        setSystemSettings({
          maintenanceMode: response.data.maintenanceMode || false,
          requireEmailVerification: response.data.requireEmailVerification !== false,
          sessionTimeout: response.data.sessionTimeout || 30
        });
      }
    } catch (error) {
      console.error('Error fetching system settings:', error);
      showSnackbar('Không thể tải cài đặt hệ thống', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSystemSettingChange = (field, value) => {
    setSystemSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (field, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateProfile = () => {
    if (!profileData.fullName.trim()) {
      showSnackbar('Vui lòng nhập họ tên', 'error');
      return false;
    }
    if (!profileData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      showSnackbar('Email không hợp lệ', 'error');
      return false;
    }
    if (profileData.phone && !/^[0-9]{10,11}$/.test(profileData.phone.replace(/\s/g, ''))) {
      showSnackbar('Số điện thoại không hợp lệ', 'error');
      return false;
    }
    return true;
  };

  const validatePassword = () => {
    if (!passwordData.currentPassword) {
      showSnackbar('Vui lòng nhập mật khẩu hiện tại', 'error');
      return false;
    }
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      showSnackbar('Mật khẩu mới phải có ít nhất 6 ký tự', 'error');
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showSnackbar('Mật khẩu xác nhận không khớp', 'error');
      return false;
    }
    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;

    try {
      setSaving(true);
      const response = await authAPI.updateProfile({
        fullName: profileData.fullName,
        email: profileData.email,
        phone: profileData.phone
      });

      if (response.success) {
        updateUser(response.data);
        showSnackbar('Cập nhật thông tin thành công', 'success');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showSnackbar(
        error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;

    try {
      setSaving(true);
      const response = await authAPI.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (response.success) {
        showSnackbar('Đổi mật khẩu thành công', 'success');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showSnackbar(
        error.response?.data?.message || 'Mật khẩu hiện tại không đúng',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSystemSettings = async () => {
    try {
      setSaving(true);
      const response = await adminAPI.updateSystemSettings({
        maintenanceMode: systemSettings.maintenanceMode,
        requireEmailVerification: systemSettings.requireEmailVerification,
        sessionTimeout: systemSettings.sessionTimeout
      });

      if (response.success) {
        showSnackbar(response.message || 'Cập nhật cài đặt hệ thống thành công', 'success');
        if (response.data) {
          setSystemSettings({
            maintenanceMode: response.data.maintenanceMode,
            requireEmailVerification: response.data.requireEmailVerification,
            sessionTimeout: response.data.sessionTimeout
          });
        }
      } else {
        showSnackbar(response.message || 'Có lỗi xảy ra khi cập nhật cài đặt', 'error');
      }
    } catch (error) {
      console.error('Error saving system settings:', error);
      showSnackbar(
        error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật cài đặt',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    try {
      setSaving(true);
      const response = await adminAPI.updateAdminNotificationSettings({
        emailNotifications: notificationSettings.emailNotifications,
        systemAnnouncements: notificationSettings.systemAnnouncements,
        orderNotifications: notificationSettings.orderNotifications,
        userNotifications: notificationSettings.userNotifications,
        eventNotifications: notificationSettings.eventNotifications
      });

      if (response.success) {
        showSnackbar(response.message || 'Cập nhật cài đặt thông báo thành công', 'success');
        if (response.data) {
          setNotificationSettings({
            emailNotifications: response.data.emailNotifications,
            systemAnnouncements: response.data.systemAnnouncements,
            orderNotifications: response.data.orderNotifications,
            userNotifications: response.data.userNotifications,
            eventNotifications: response.data.eventNotifications
          });
        }
      } else {
        showSnackbar(response.message || 'Có lỗi xảy ra khi cập nhật cài đặt', 'error');
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      showSnackbar(
        error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật cài đặt',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (loading) {
    return (
      <Box className="admin-settings-page" display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="admin-settings-page">
      <Box className="settings-header">
        <Typography variant="h4" className="page-title">
          Cài Đặt
        </Typography>
        <Typography variant="body1" className="page-subtitle">
          Quản lý cài đặt tài khoản và hệ thống
        </Typography>
      </Box>

      <Paper className="settings-container">
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          className="settings-tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<Person />} iconPosition="start" label="Thông Tin Cá Nhân" />
          <Tab icon={<Lock />} iconPosition="start" label="Bảo Mật" />
          <Tab icon={<SettingsIcon />} iconPosition="start" label="Hệ Thống" />
          <Tab icon={<Notifications />} iconPosition="start" label="Thông Báo" />
        </Tabs>

        <Divider />

        <Box className="settings-content">
          {/* Profile Tab */}
          {activeTab === 0 && (
            <Card className="settings-card">
              <CardContent>
                <Box className="section-header">
                  <Person className="section-icon" />
                  <Typography variant="h6" className="section-title">
                    Thông Tin Cá Nhân
                  </Typography>
                </Box>
                <Typography variant="body2" className="section-description">
                  Cập nhật thông tin cá nhân của bạn
                </Typography>

                <Grid container spacing={3} sx={{ mt: 2 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Họ và Tên"
                      value={profileData.fullName}
                      onChange={(e) => handleProfileChange('fullName', e.target.value)}
                      variant="outlined"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Tên đăng nhập"
                      value={profileData.username}
                      disabled
                      variant="outlined"
                      helperText="Không thể thay đổi tên đăng nhập"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      variant="outlined"
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Số Điện Thoại"
                      value={profileData.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                </Grid>

                <Box className="action-buttons">
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="save-button"
                  >
                    {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 1 && (
            <Card className="settings-card">
              <CardContent>
                <Box className="section-header">
                  <Security className="section-icon" />
                  <Typography variant="h6" className="section-title">
                    Bảo Mật
                  </Typography>
                </Box>
                <Typography variant="body2" className="section-description">
                  Thay đổi mật khẩu để bảo vệ tài khoản của bạn
                </Typography>

                <Grid container spacing={3} sx={{ mt: 2 }}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Mật Khẩu Hiện Tại"
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      variant="outlined"
                      required
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => togglePasswordVisibility('current')}
                              edge="end"
                            >
                              {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Mật Khẩu Mới"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      variant="outlined"
                      required
                      helperText="Tối thiểu 6 ký tự"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => togglePasswordVisibility('new')}
                              edge="end"
                            >
                              {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Xác Nhận Mật Khẩu Mới"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      variant="outlined"
                      required
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => togglePasswordVisibility('confirm')}
                              edge="end"
                            >
                              {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                </Grid>

                <Box className="action-buttons">
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <Lock />}
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="save-button"
                  >
                    {saving ? 'Đang đổi...' : 'Đổi Mật Khẩu'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* System Settings Tab */}
          {activeTab === 2 && (
            <Card className="settings-card">
              <CardContent>
                <Box className="section-header">
                  <SettingsIcon className="section-icon" />
                  <Typography variant="h6" className="section-title">
                    Cài Đặt Hệ Thống
                  </Typography>
                </Box>
                <Typography variant="body2" className="section-description">
                  Quản lý cấu hình hệ thống
                </Typography>

                <Box className="settings-list">
                  <Box className="setting-item">
                    <Box className="setting-info">
                      <Typography variant="subtitle1" className="setting-label">
                        Chế Độ Bảo Trì
                      </Typography>
                      <Typography variant="body2" className="setting-description">
                        Tạm thời tắt hệ thống để bảo trì
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={systemSettings.maintenanceMode}
                          onChange={(e) => handleSystemSettingChange('maintenanceMode', e.target.checked)}
                          color="primary"
                        />
                      }
                      label=""
                    />
                  </Box>

                  <Divider />


                  <Box className="setting-item">
                    <Box className="setting-info">
                      <Typography variant="subtitle1" className="setting-label">
                        Yêu Cầu Xác Thực Email
                      </Typography>
                      <Typography variant="body2" className="setting-description">
                        Người dùng phải xác thực email trước khi sử dụng
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={systemSettings.requireEmailVerification}
                          onChange={(e) => handleSystemSettingChange('requireEmailVerification', e.target.checked)}
                          color="primary"
                        />
                      }
                      label=""
                    />
                  </Box>

                  <Divider />

                  <Box className="setting-item">
                    <Box className="setting-info">
                      <Typography variant="subtitle1" className="setting-label">
                        Thời Gian Hết Phiên (phút)
                      </Typography>
                      <Typography variant="body2" className="setting-description">
                        Thời gian tự động đăng xuất khi không hoạt động
                      </Typography>
                    </Box>
                    <TextField
                      type="number"
                      value={systemSettings.sessionTimeout}
                      onChange={(e) => handleSystemSettingChange('sessionTimeout', parseInt(e.target.value) || 30)}
                      variant="outlined"
                      size="small"
                      sx={{ width: 120 }}
                      inputProps={{ min: 5, max: 1440 }}
                    />
                  </Box>
                </Box>

                <Box className="action-buttons">
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                    onClick={handleSaveSystemSettings}
                    disabled={saving}
                    className="save-button"
                  >
                    {saving ? 'Đang lưu...' : 'Lưu Cài Đặt'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Notification Settings Tab */}
          {activeTab === 3 && (
            <Card className="settings-card">
              <CardContent>
                <Box className="section-header">
                  <Notifications className="section-icon" />
                  <Typography variant="h6" className="section-title">
                    Cài Đặt Thông Báo
                  </Typography>
                </Box>
                <Typography variant="body2" className="section-description">
                  Quản lý các loại thông báo bạn muốn nhận
                </Typography>

                <Box className="settings-list">
                  <Box className="setting-item">
                    <Box className="setting-info">
                      <Typography variant="subtitle1" className="setting-label">
                        Thông Báo Qua Email
                      </Typography>
                      <Typography variant="body2" className="setting-description">
                        Nhận thông báo quan trọng qua email
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.emailNotifications}
                          onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                          color="primary"
                        />
                      }
                      label=""
                    />
                  </Box>

                  <Divider />

                  <Box className="setting-item">
                    <Box className="setting-info">
                      <Typography variant="subtitle1" className="setting-label">
                        Thông Báo Hệ Thống
                      </Typography>
                      <Typography variant="body2" className="setting-description">
                        Nhận thông báo từ hệ thống
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.systemAnnouncements}
                          onChange={(e) => handleNotificationChange('systemAnnouncements', e.target.checked)}
                          color="primary"
                        />
                      }
                      label=""
                    />
                  </Box>

                  <Divider />

                  <Box className="setting-item">
                    <Box className="setting-info">
                      <Typography variant="subtitle1" className="setting-label">
                        Thông Báo Đơn Hàng
                      </Typography>
                      <Typography variant="body2" className="setting-description">
                        Nhận thông báo về đơn hàng mới
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.orderNotifications}
                          onChange={(e) => handleNotificationChange('orderNotifications', e.target.checked)}
                          color="primary"
                        />
                      }
                      label=""
                    />
                  </Box>

                  <Divider />

                  <Box className="setting-item">
                    <Box className="setting-info">
                      <Typography variant="subtitle1" className="setting-label">
                        Thông Báo Người Dùng
                      </Typography>
                      <Typography variant="body2" className="setting-description">
                        Nhận thông báo về hoạt động người dùng
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.userNotifications}
                          onChange={(e) => handleNotificationChange('userNotifications', e.target.checked)}
                          color="primary"
                        />
                      }
                      label=""
                    />
                  </Box>

                  <Divider />

                  <Box className="setting-item">
                    <Box className="setting-info">
                      <Typography variant="subtitle1" className="setting-label">
                        Thông Báo Sự Kiện
                      </Typography>
                      <Typography variant="body2" className="setting-description">
                        Nhận thông báo về sự kiện mới và cập nhật
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.eventNotifications}
                          onChange={(e) => handleNotificationChange('eventNotifications', e.target.checked)}
                          color="primary"
                        />
                      }
                      label=""
                    />
                  </Box>
                </Box>

                <Box className="action-buttons">
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                    onClick={handleSaveNotificationSettings}
                    disabled={saving}
                    className="save-button"
                  >
                    {saving ? 'Đang lưu...' : 'Lưu Cài Đặt'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default AdminSettingsPage;