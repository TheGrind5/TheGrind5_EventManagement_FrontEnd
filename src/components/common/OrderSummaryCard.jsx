import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  useTheme
} from '@mui/material';
import {
  ConfirmationNumber as TicketIcon
} from '@mui/icons-material';

/**
 * OrderSummaryCard Component
 * Display order summary with ticket details and pricing
 * 
 * @param {array} orderItems - Array of order items {ticketTypeName, quantity, unitPrice, totalPrice}
 * @param {number} subtotal - Subtotal amount
 * @param {number} discount - Discount amount
 * @param {number} total - Total amount
 */
const OrderSummaryCard = ({ 
  orderItems = [], 
  subtotal = 0, 
  discount = 0, 
  total = 0 
}) => {
  const theme = useTheme();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.02)'
          : 'rgba(0, 0, 0, 0.01)'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <TicketIcon color="primary" />
        <Typography variant="h6" fontWeight={800}>
          Thông tin đặt vé
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {orderItems.map((item, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 0.5 }}>
            <Typography variant="body1" fontWeight={600}>
              {item.ticketTypeName || 'Loại vé'}
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {formatCurrency(item.unitPrice || 0)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Số lượng: {item.quantity || 0}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {formatCurrency(item.totalPrice || 0)}
            </Typography>
          </Box>
        </Box>
      ))}

      <Divider sx={{ my: 2 }} />

      {discount > 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Tạm tính
            </Typography>
            <Typography variant="body2">
              {formatCurrency(subtotal)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body2" color="error">
              Giảm giá
            </Typography>
            <Typography variant="body2" color="error">
              -{formatCurrency(discount)}
            </Typography>
          </Box>
        </>
      )}

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={800}>
          Tổng tiền
        </Typography>
        <Typography variant="h5" fontWeight={800} color="primary.main">
          {formatCurrency(total)}
        </Typography>
      </Box>
    </Paper>
  );
};

export default OrderSummaryCard;

