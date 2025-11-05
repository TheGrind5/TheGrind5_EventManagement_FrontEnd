// React & Router
import React, { memo } from 'react';
import { Link } from 'react-router-dom';

// Material-UI Components
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Stack,
  useTheme
} from '@mui/material';

// Material-UI Icons
import {
  LocationOn,
  AccessTime,
  Person,
  Event as EventIcon
} from '@mui/icons-material';

// Utils
import { decodeText } from '../../utils/textDecoder';

/**
 * EventCard Component - TicketBox Style
 * Displays event information in a clean, professional card
 * Consumes existing event objects without prop changes
 * Memoized để tránh re-render không cần thiết và cải thiện performance
 */
const EventCard = memo(({ event }) => {
  const theme = useTheme();

  // Format date helper
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Determine event status based on time
  const getEventStatus = (startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : null;
    
    if (end) {
      if (now < start) return 'Upcoming';
      if (now >= start && now <= end) return 'Active';
      return 'Completed';
    }
    return now < start ? 'Upcoming' : 'Completed';
  };

  // Get status display text
  const getStatusText = (status) => {
    switch (status) {
      case 'Active': return 'Đang diễn ra';
      case 'Upcoming': return 'Sắp diễn ra';
      case 'Completed': return 'Đã kết thúc';
      default: return 'Không xác định';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Upcoming': return 'warning';
      case 'Completed': return 'default';
      default: return 'default';
    }
  };

  const currentStatus = getEventStatus(event.startTime, event.endTime);
  
  // Get background image (1280x720) - main display image for all pages
  const backgroundImage = event.eventDetails?.backgroundImage || event.backgroundImage || null;
  const imageUrl = backgroundImage
    ? (backgroundImage.startsWith('http') ? backgroundImage : `http://localhost:5000${backgroundImage}`)
    : null;

  return (
    <Card
      component={Link}
      to={`/event/${event.eventId}`}
      sx={{
        width: '100%',
        height: 440,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        textDecoration: 'none',
        color: 'inherit',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: theme.palette.mode === 'dark' 
          ? theme.palette.background.paper 
          : '#FAFAFA',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: 'none',
        backgroundColor: theme.palette.mode === 'dark' ? '#1A1A1A' : '#FFFFFF',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 12px 24px rgba(0, 0, 0, 0.4)'
            : '0 12px 24px rgba(0, 0, 0, 0.15)',
          borderColor: 'primary.main',
          backgroundColor: theme.palette.mode === 'dark' 
            ? theme.palette.background.paper 
            : '#F5F5F5',
          zIndex: 10,
        }
      }}
    >
      {/* Event Image */}
      <Box
        sx={{
          height: 200,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'grey.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Placeholder when no image */}
        {!imageUrl && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              width: '100%',
              backgroundColor: theme.palette.mode === 'dark' ? '#262626' : '#E5E5E5',
              color: theme.palette.mode === 'dark' ? '#525252' : '#9CA3AF'
            }}
          >
            <EventIcon sx={{ fontSize: 40, opacity: 0.5 }} />
          </Box>
        )}

        {/* Event Image - 1280x720 with hover zoom effect - Optimized với lazy loading */}
        {imageUrl && (
          <Box
            component="img"
            className="event-image"
            src={imageUrl}
            alt={decodeText(event.title)}
            loading="lazy"
            decoding="async"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
              willChange: 'transform',
              '&:hover': {
                transform: 'scale(1.05)',
              }
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}

        {/* Overlay with chips - Increased z-index to ensure they're above any image text */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            right: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            zIndex: 20,
          }}
        >
          {event.category && (
            <Chip
              label={decodeText(event.category)}
              size="small"
              sx={{
                fontWeight: 500,
                borderRadius: 1,
                fontSize: '0.7rem',
                height: 24,
                backgroundColor: 'white',
                color: 'text.primary',
                '& .MuiChip-label': {
                  textRendering: 'optimizeLegibility',
                  WebkitFontSmoothing: 'antialiased',
                }
              }}
            />
          )}
          <Chip
            label={getStatusText(currentStatus)}
            size="small"
            sx={{
              borderRadius: 1,
              fontSize: '0.7rem',
              height: 24,
              fontWeight: 500,
              backgroundColor: currentStatus === 'Active' ? '#FF7A00' :
                             currentStatus === 'Upcoming' ? '#F59E0B' : '#9CA3AF',
              color: 'white',
              '& .MuiChip-label': {
                textRendering: 'optimizeLegibility',
                WebkitFontSmoothing: 'antialiased',
              }
            }}
          />
        </Box>
      </Box>

      {/* Card Content */}
      <CardContent
        sx={{
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          '&:last-child': {
            paddingBottom: 2.5
          }
        }}
      >
        {/* Title - Increased to 3 lines to show full title */}
        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontWeight: 700,
            lineHeight: 1.3,
            mb: 1.5,
            minHeight: 60,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontSize: '1rem',
            color: 'text.primary',
            wordBreak: 'break-word',
            textRendering: 'optimizeLegibility',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          }}
        >
          {decodeText(event.title)}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.5,
            minHeight: 42,
            fontSize: '0.875rem',
            wordBreak: 'break-word',
            textRendering: 'optimizeLegibility',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          }}
        >
          {decodeText(event.description)}
        </Typography>

        {/* Event Details */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <Stack spacing={1}>
            {/* Time */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, minHeight: 24 }}>
              <AccessTime 
                sx={{ 
                  fontSize: '1rem', 
                  mt: 0.2,
                  color: 'text.secondary',
                  flexShrink: 0
                }} 
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  lineHeight: 1.4,
                  fontSize: '0.8125rem',
                  flex: 1,
                  minHeight: 20,
                  textRendering: 'optimizeLegibility',
                  WebkitFontSmoothing: 'antialiased',
                }}
              >
                {formatDate(event.startTime)}
              </Typography>
            </Box>

            {/* Location */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, minHeight: 40 }}>
              <LocationOn 
                sx={{ 
                  fontSize: '1rem', 
                  mt: 0.2,
                  color: 'text.secondary',
                  flexShrink: 0
                }} 
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  lineHeight: 1.4,
                  fontSize: '0.8125rem',
                  flex: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  minHeight: 36,
                  textRendering: 'optimizeLegibility',
                  WebkitFontSmoothing: 'antialiased',
                }}
              >
                {decodeText(event.location)}
              </Typography>
            </Box>

            {/* Host - Always visible with fixed height */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, minHeight: 24 }}>
              <Person 
                sx={{ 
                  fontSize: '1rem', 
                  mt: 0.2,
                  color: 'text.secondary',
                  flexShrink: 0
                }} 
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  lineHeight: 1.4,
                  fontSize: '0.8125rem',
                  flex: 1,
                  minHeight: 20,
                  textRendering: 'optimizeLegibility',
                  WebkitFontSmoothing: 'antialiased',
                }}
              >
                Host: {decodeText(event.hostName) || 'N/A'}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison để chỉ re-render khi event thực sự thay đổi
  return prevProps.event?.eventId === nextProps.event?.eventId &&
         prevProps.event?.title === nextProps.event?.title &&
         prevProps.event?.backgroundImage === nextProps.event?.backgroundImage &&
         prevProps.event?.startTime === nextProps.event?.startTime;
});

EventCard.displayName = 'EventCard';

export default EventCard;

