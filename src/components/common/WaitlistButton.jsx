import React, { useState, useEffect } from 'react';
import { Button, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Snackbar } from '@mui/material';
import { Queue, QueueOutlined } from '@mui/icons-material';
import { waitlistAPI } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';

const WaitlistButton = ({ eventId, ticketTypeId, quantity: defaultQuantity = 1, onSuccess, size = 'medium', variant = 'outlined' }) => {
  const { user } = useAuth();
  const [isInWaitlist, setIsInWaitlist] = useState(false);
  const [waitlistId, setWaitlistId] = useState(null);
  const [waitlistStatus, setWaitlistStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [quantity, setQuantity] = useState(defaultQuantity);
  const [position, setPosition] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (user && eventId) {
      checkWaitlistStatus();
    }
  }, [user, eventId, ticketTypeId]);

  const checkWaitlistStatus = async () => {
    try {
      const response = await waitlistAPI.getMyWaitlists();
      const waitlists = response.data || [];
      const found = waitlists.find(w => 
        w.eventId === eventId && 
        (ticketTypeId ? w.ticketTypeId === ticketTypeId : !w.ticketTypeId)
      );
      
      if (found) {
        setIsInWaitlist(true);
        setWaitlistId(found.waitlistId);
        setWaitlistStatus(found.status);
      } else {
        setIsInWaitlist(false);
        setWaitlistId(null);
        setWaitlistStatus(null);
      }
    } catch (err) {
      console.error('Error checking waitlist status:', err);
    }
  };

  const handleOpenDialog = () => {
    if (!user) {
      setSnackbar({ open: true, message: 'Vui lòng đăng nhập để đăng ký danh sách chờ!', severity: 'warning' });
      return;
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setQuantity(defaultQuantity);
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      const response = await waitlistAPI.register(eventId, ticketTypeId, quantity);
      const data = response.data || response;
      
      setIsInWaitlist(true);
      setWaitlistId(data.waitlistId);
      setWaitlistStatus('Pending');
      setPosition(data.position);
      
      setSnackbar({ 
        open: true, 
        message: `Đăng ký thành công! Vị trí của bạn trong danh sách: #${data.position}`, 
        severity: 'success' 
      });
      
      handleCloseDialog();
      
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi đăng ký danh sách chờ';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!waitlistId) return;
    
    if (!window.confirm('Bạn có chắc chắn muốn hủy đăng ký danh sách chờ?')) {
      return;
    }

    try {
      setLoading(true);
      await waitlistAPI.cancel(waitlistId);
      
      setIsInWaitlist(false);
      setWaitlistId(null);
      setWaitlistStatus(null);
      setPosition(null);
      
      setSnackbar({ open: true, message: 'Đã hủy đăng ký danh sách chờ thành công', severity: 'success' });
      
      if (onSuccess) {
        onSuccess(null);
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi hủy đăng ký';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (!isInWaitlist) {
      return 'Đăng ký danh sách chờ';
    }
    
    switch (waitlistStatus) {
      case 'Pending':
        return position ? `Đang chờ (#${position})` : 'Đang chờ';
      case 'Notified':
        return 'Đã được thông báo';
      case 'Fulfilled':
        return 'Đã nhận vé';
      case 'Cancelled':
        return 'Đã hủy';
      default:
        return 'Đã đăng ký';
    }
  };

  const getButtonColor = () => {
    if (!isInWaitlist) return 'primary';
    
    switch (waitlistStatus) {
      case 'Pending':
        return 'warning';
      case 'Notified':
        return 'success';
      case 'Fulfilled':
        return 'info';
      default:
        return 'default';
    }
  };

  if (!user) {
    return null; // Don't show if not logged in
  }

  return (
    <>
      <Tooltip title={isInWaitlist ? 'Hủy đăng ký danh sách chờ' : 'Đăng ký danh sách chờ để nhận thông báo khi có vé'}>
        <Button
          variant={isInWaitlist ? 'contained' : variant}
          color={getButtonColor()}
          size={size}
          startIcon={isInWaitlist ? <Queue /> : <QueueOutlined />}
          onClick={isInWaitlist ? handleCancel : handleOpenDialog}
          disabled={loading || waitlistStatus === 'Fulfilled'}
          sx={{ 
            minWidth: 'auto',
          }}
        >
          {getButtonText()}
        </Button>
      </Tooltip>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Đăng ký danh sách chờ</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Vé đã hết. Đăng ký danh sách chờ để nhận thông báo khi có vé available.
          </Alert>
          <TextField
            autoFocus
            margin="dense"
            label="Số lượng vé"
            type="number"
            fullWidth
            variant="outlined"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleRegister} variant="contained" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default WaitlistButton;

