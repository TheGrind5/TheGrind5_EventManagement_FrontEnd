import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Divider
} from '@mui/material';
import { Refresh, MoneyOff } from '@mui/icons-material';
import WalletService from '../../services/walletService';

const WithdrawalRequestStatus = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await WalletService.getWithdrawalRequests(1, 5); // Get latest 5
      if (response.data) {
        setRequests(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching withdrawal requests:', err);
      setError('Không thể tải yêu cầu rút tiền');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const getStatusChip = (status) => {
    const colorMap = {
      'Pending': 'warning',
      'Approved': 'info',
      'Rejected': 'error',
      'Completed': 'success',
      'Cancelled': 'default'
    };
    return (
      <Chip 
        label={WalletService.formatStatus(status)} 
        color={colorMap[status] || 'default'}
        size="small"
      />
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={24} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return null; // Don't show if no requests
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '1rem' }}>
            <MoneyOff fontSize="small" /> Yêu cầu rút tiền
          </Typography>
          <IconButton size="small" onClick={fetchRequests}>
            <Refresh fontSize="small" />
          </IconButton>
        </Box>
        
        <List dense>
          {requests.map((request, index) => (
            <React.Fragment key={request.withdrawalRequestId}>
              {index > 0 && <Divider />}
              <ListItem disablePadding sx={{ py: 1 }}>
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" fontWeight={600}>
                        {request.amount.toLocaleString('vi-VN')} VND
                      </Typography>
                      {getStatusChip(request.status)}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {request.bankName} - {request.bankAccountNumber}
                      </Typography>
                      <br/>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                      </Typography>
                      {request.rejectionReason && (
                        <>
                          <br/>
                          <Typography variant="caption" color="error">
                            Lý do từ chối: {request.rejectionReason}
                          </Typography>
                        </>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default WithdrawalRequestStatus;
