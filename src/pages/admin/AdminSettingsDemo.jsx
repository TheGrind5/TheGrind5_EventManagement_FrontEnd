import React, { useState } from 'react';
import { Box, Paper, Tabs, Tab, Divider, Snackbar, Alert, Typography } from '@mui/material';
import { Person, Lock, Settings as SettingsIcon, Email, Payment, Language, Notifications, Speed } from '@mui/icons-material';
import EmailTab from '../../components/admin/settings/EmailTab';
import PaymentTab from '../../components/admin/settings/PaymentTab';
import GeneralTab from '../../components/admin/settings/GeneralTab';
import AdvancedTab from '../../components/admin/settings/AdvancedTab';
import '../../styles/AdminSettings.css';

/**
 * DEMO PAGE - Test các tabs mới
 * Navigate to: /admin/settings-demo để test
 */
const AdminSettingsDemo = () => {
  const [activeTab, setActiveTab] = useState(3); // Start at Email tab
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleSaveWrapper = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1000);
  };

  return (
    <div className="admin-settings-page" style={{ padding: '20px' }}>
      <Box className="settings-header" sx={{ mb: 3 }}>
        <Typography variant="h4">Admin Settings - DEMO</Typography>
        <Typography variant="body1" color="text.secondary">
          Test 4 tabs mới: Email, Payment, General, Advanced
        </Typography>
      </Box>

      <Paper className="settings-container" elevation={2}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<Person />} iconPosition="start" label="Profile" disabled />
          <Tab icon={<Lock />} iconPosition="start" label="Security" disabled />
          <Tab icon={<SettingsIcon />} iconPosition="start" label="System" disabled />
          <Tab icon={<Email />} iconPosition="start" label="Email" />
          <Tab icon={<Payment />} iconPosition="start" label="Payment" />
          <Tab icon={<Language />} iconPosition="start" label="General" />
          <Tab icon={<Notifications />} iconPosition="start" label="Notifications" disabled />
          <Tab icon={<Speed />} iconPosition="start" label="Advanced" />
        </Tabs>

        <Divider />

        <Box className="settings-content" sx={{ p: 3 }}>
          {activeTab === 3 && <EmailTab saving={saving} onSave={handleSaveWrapper} showSnackbar={showSnackbar} />}
          {activeTab === 4 && <PaymentTab saving={saving} onSave={handleSaveWrapper} showSnackbar={showSnackbar} />}
          {activeTab === 5 && <GeneralTab saving={saving} onSave={handleSaveWrapper} showSnackbar={showSnackbar} />}
          {activeTab === 7 && <AdvancedTab saving={saving} onSave={handleSaveWrapper} showSnackbar={showSnackbar} />}
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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

export default AdminSettingsDemo;
