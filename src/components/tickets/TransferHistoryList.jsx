import React from 'react';
import {
  Box,
  Typography,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Paper,
  Chip,
  Stack
} from '@mui/material';
import {
  Send,
  CheckCircle,
  Cancel,
  Block,
  AccessTime,
  Person,
  Mail
} from '@mui/icons-material';
import TicketTransferService from '../../services/ticketTransferService';

const TransferHistoryList = ({ transfers }) => {
  if (!transfers || transfers.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <AccessTime sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Chưa có lịch sử chuyển nhượng
        </Typography>
      </Box>
    );
  }

  const getStatusIcon = (status) => {
    const iconMap = {
      'Pending': <Send fontSize="small" />,
      'Accepted': <CheckCircle fontSize="small" />,
      'Rejected': <Cancel fontSize="small" />,
      'Cancelled': <Block fontSize="small" />,
      'Expired': <AccessTime fontSize="small" />
    };
    return iconMap[status] || <Send fontSize="small" />;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'Pending': 'warning',
      'Accepted': 'success',
      'Rejected': 'error',
      'Cancelled': 'default',
      'Expired': 'grey'
    };
    return colorMap[status] || 'default';
  };

  return (
    <Timeline position="right">
      {transfers.map((transfer, index) => (
        <TimelineItem key={transfer.transferId}>
          <TimelineOppositeContent
            sx={{ 
              m: 'auto 0',
              maxWidth: '120px',
              px: 1
            }}
            align="right"
            variant="body2"
            color="text.secondary"
          >
            {TicketTransferService.formatDate(transfer.requestedAt).split(' ')[0]}
            <br />
            <Typography variant="caption" color="text.secondary">
              {TicketTransferService.formatDate(transfer.requestedAt).split(' ')[1]}
            </Typography>
          </TimelineOppositeContent>

          <TimelineSeparator>
            <TimelineDot color={getStatusColor(transfer.transferStatus)}>
              {getStatusIcon(transfer.transferStatus)}
            </TimelineDot>
            {index < transfers.length - 1 && <TimelineConnector />}
          </TimelineSeparator>

          <TimelineContent sx={{ py: '12px', px: 2 }}>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                bgcolor: transfer.transferStatus === 'Pending' ? 'warning.lighter' : 'background.paper',
                border: 1,
                borderColor: transfer.transferStatus === 'Pending' ? 'warning.main' : 'divider',
                borderRadius: 2
              }}
            >
              {/* Status Chip */}
              <Chip
                label={TicketTransferService.formatStatus(transfer.transferStatus)}
                color={getStatusColor(transfer.transferStatus)}
                size="small"
                sx={{ mb: 1, fontWeight: 600 }}
              />

              {/* Transfer Info */}
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person fontSize="small" color="action" />
                  <Typography variant="body2">
                    <strong>Từ:</strong> {transfer.fromUser?.fullName || 'Unknown'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Mail fontSize="small" color="action" />
                  <Typography variant="body2">
                    <strong>Đến:</strong> {transfer.toEmail}
                    {transfer.toUser && ` (${transfer.toUser.fullName})`}
                  </Typography>
                </Box>

                {/* Transfer Code */}
                <Typography variant="caption" color="text.secondary">
                  Mã: {transfer.transferCode}
                </Typography>

                {/* Message */}
                {transfer.message && (
                  <Box sx={{ 
                    mt: 1, 
                    p: 1, 
                    bgcolor: 'background.default', 
                    borderRadius: 1,
                    borderLeft: 3,
                    borderColor: 'primary.main'
                  }}>
                    <Typography variant="caption" color="text.secondary">
                      "{transfer.message}"
                    </Typography>
                  </Box>
                )}

                {/* Rejection Reason */}
                {transfer.rejectionReason && (
                  <Box sx={{ 
                    mt: 1, 
                    p: 1, 
                    bgcolor: 'error.lighter', 
                    borderRadius: 1,
                    borderLeft: 3,
                    borderColor: 'error.main'
                  }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Lý do từ chối:
                    </Typography>
                    <Typography variant="caption" display="block">
                      {transfer.rejectionReason}
                    </Typography>
                  </Box>
                )}

                {/* Expiry / Completion Time */}
                {transfer.transferStatus === 'Pending' && (
                  <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                    <AccessTime fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    {TicketTransferService.formatTimeRemaining(transfer.expiresAt)}
                  </Typography>
                )}

                {transfer.completedAt && (
                  <Typography variant="caption" color="text.secondary">
                    Hoàn thành: {TicketTransferService.formatDate(transfer.completedAt)}
                  </Typography>
                )}
              </Stack>
            </Paper>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
};

export default TransferHistoryList;
