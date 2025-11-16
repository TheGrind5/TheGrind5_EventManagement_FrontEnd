import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import { QrCodeScanner } from '@mui/icons-material';

/**
 * TicketQRCode Component
 * Hiển thị QR code cho ticket với SerialNumber
 * 
 * @param {Object} props
 * @param {Object} props.ticket - Ticket object có SerialNumber hoặc serialNumber
 * @param {number} props.size - Kích thước QR code (default: 200)
 * @param {boolean} props.showSerialNumber - Hiển thị SerialNumber text (default: true)
 */
const TicketQRCode = ({ ticket, size = 200, showSerialNumber = true }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extract SerialNumber từ ticket object (hỗ trợ cả PascalCase và camelCase)
  const serialNumber = ticket?.SerialNumber || ticket?.serialNumber || null;

  // 🔒 CRITICAL: Hiển thị QR code NGAY LẬP TỨC khi có SerialNumber
  useEffect(() => {
    if (serialNumber) {
      // Có SerialNumber rồi, hiển thị QR code ngay (không cần delay)
      setLoading(false);
      setError(null);
    } else {
      // Không có SerialNumber, hiển thị error ngay
      setError('Vé chưa có mã serial');
      setLoading(false);
    }
  }, [serialNumber]);

  // Nếu không có SerialNumber, hiển thị error message
  if (!serialNumber) {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: size + 100,
          border: `2px dashed ${theme.palette.error.main}`,
          borderRadius: 2
        }}
      >
        <QrCodeScanner sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
        <Alert severity="error" sx={{ width: '100%' }}>
          Vé chưa có mã serial. Vui lòng liên hệ hỗ trợ.
        </Alert>
      </Paper>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: size + 100,
          p: 3
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Đang tạo QR code...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: size + 100,
          border: `2px dashed ${theme.palette.error.main}`,
          borderRadius: 2
        }}
      >
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Paper>
    );
  }

  // Main QR code display
  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper
      }}
    >
      {/* QR Code */}
      <Box
        sx={{
          p: 2,
          backgroundColor: 'white',
          borderRadius: 2,
          border: `2px solid ${theme.palette.primary.main}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: showSerialNumber ? 2 : 0
        }}
      >
        <QRCodeSVG
          value={serialNumber}
          size={size}
          level="M" // Error correction level: L, M, Q, H
          includeMargin={true}
          fgColor={theme.palette.mode === 'dark' ? '#000000' : '#000000'}
          bgColor="#FFFFFF"
        />
      </Box>

      {/* Serial Number Text */}
      {showSerialNumber && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mb: 0.5 }}
          >
            Mã vé:
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontFamily: 'monospace',
              fontWeight: 600,
              color: 'text.primary',
              wordBreak: 'break-all',
              fontSize: '0.9rem'
            }}
          >
            {serialNumber}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default TicketQRCode;

