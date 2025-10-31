import React, { useState, useEffect } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { AccessTime } from '@mui/icons-material';

/**
 * CountdownTimer Component
 * Display a countdown timer with visual warning colors
 * 
 * @param {number} duration - Duration in seconds
 * @param {function} onExpire - Callback when timer expires
 * @param {'small' | 'medium' | 'large'} size - Display size
 * @param {'mm:ss' | 'hh:mm:ss'} format - Time format
 */
const CountdownTimer = ({ 
  duration, 
  onExpire, 
  size = 'large',
  format = 'mm:ss' 
}) => {
  const theme = useTheme();
  const [timeLeft, setTimeLeft] = useState(duration);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setExpired(true);
      if (onExpire) {
        onExpire();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onExpire]);

  // Format time based on format prop
  const formatTime = (seconds) => {
    if (format === 'hh:mm:ss') {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${String(hours).padStart(2, '0')} : ${String(minutes).padStart(2, '0')} : ${String(secs).padStart(2, '0')}`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${String(minutes).padStart(2, '0')} : ${String(secs).padStart(2, '0')}`;
    }
  };

  // Determine color based on time left
  const getColor = () => {
    if (expired) return theme.palette.error.main;
    if (timeLeft <= 300) return theme.palette.error.main; // ≤ 5 minutes: Red
    if (timeLeft <= 600) return theme.palette.warning.main; // ≤ 10 minutes: Yellow
    return theme.palette.success.main; // > 10 minutes: Green
  };

  // Determine background color
  const getBackgroundColor = () => {
    if (expired) return theme.palette.error.light;
    if (timeLeft <= 300) return `${theme.palette.error.main}15`;
    if (timeLeft <= 600) return `${theme.palette.warning.main}15`;
    return `${theme.palette.success.main}15`;
  };

  // Size configurations
  const sizeConfig = {
    small: {
      fontSize: '1rem',
      padding: 1,
      iconSize: '1rem'
    },
    medium: {
      fontSize: '1.5rem',
      padding: 1.5,
      iconSize: '1.5rem'
    },
    large: {
      fontSize: '2rem',
      padding: 2,
      iconSize: '2rem'
    }
  };

  const config = sizeConfig[size];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        padding: config.padding,
        borderRadius: 2,
        backgroundColor: getBackgroundColor(),
        border: `2px solid ${getColor()}40`,
        transition: 'all 0.3s ease'
      }}
    >
      <AccessTime 
        sx={{ 
          fontSize: config.iconSize,
          color: getColor(),
          animation: timeLeft <= 60 ? 'pulse 2s infinite' : 'none',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.5 }
          }
        }} 
      />
      <Typography
        variant="h6"
        component="span"
        sx={{
          fontSize: config.fontSize,
          fontWeight: 800,
          color: getColor(),
          fontFamily: 'monospace',
          letterSpacing: '0.1em'
        }}
      >
        {formatTime(timeLeft)}
      </Typography>
    </Box>
  );
};

export default CountdownTimer;

