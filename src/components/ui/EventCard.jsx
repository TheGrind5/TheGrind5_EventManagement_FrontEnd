// React & Router
import React from 'react';
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

/**
 * EventCard Component - TicketBox Style
 * Displays event information in a clean, professional card
 * Consumes existing event objects without prop changes
 */
const EventCard = ({ event }) => {
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
  
  // Get event image
  const eventImage = event.eventDetails?.eventImage || event.eventImage || null;
  const imageUrl = eventImage
    ? (eventImage.startsWith('http') ? eventImage : `http://localhost:5000${eventImage}`)
    : null;

  return (
    <Card
      component={Link}
      to={`/event/${event.eventId}`}
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        transition: 'all 0.3s ease',
        textDecoration: 'none',
        color: 'inherit',
        cursor: 'pointer',
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 12px 24px rgba(0, 0, 0, 0.4)'
            : '0 12px 24px rgba(0, 0, 0, 0.12)',
          borderColor: 'primary.main',
          '& .event-image': {
            transform: 'scale(1.05)'
          }
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
        {!eventImage && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              width: '100%',
              background: 'linear-gradient(135deg, #3DBE29 0%, #2FA320 100%)',
              color: 'white'
            }}
          >
            <EventIcon sx={{ fontSize: 48, mb: 1, opacity: 0.9 }} />
            <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
              Sự Kiện
            </Typography>
          </Box>
        )}

        {/* Event Image */}
        {imageUrl && (
          <Box
            component="img"
            className="event-image"
            src={imageUrl}
            alt={event.title}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}

        {/* Overlay with chips */}
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            zIndex: 2,
          }}
        >
          <Chip
            label={event.category}
            size="small"
            sx={{
              fontWeight: 600,
              borderRadius: 1.5,
              fontSize: '0.75rem',
              height: 26,
              px: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              color: 'primary.main',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Chip
            label={getStatusText(currentStatus)}
            color={getStatusColor(currentStatus)}
            size="small"
            sx={{
              borderRadius: 1.5,
              fontSize: '0.75rem',
              height: 26,
              px: 1,
              fontWeight: 500,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
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
        {/* Title */}
        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontWeight: 700,
            lineHeight: 1.3,
            mb: 1.5,
            minHeight: 44,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontSize: '1rem',
            color: 'text.primary'
          }}
        >
          {event.title}
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
            fontSize: '0.875rem'
          }}
        >
          {event.description}
        </Typography>

        {/* Event Details */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <Stack spacing={1}>
            {/* Time */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <AccessTime 
                sx={{ 
                  fontSize: '1rem', 
                  mt: 0.2,
                  color: 'text.secondary'
                }} 
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  lineHeight: 1.4,
                  fontSize: '0.8125rem',
                  flex: 1
                }}
              >
                {formatDate(event.startTime)}
              </Typography>
            </Box>

            {/* Location */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <LocationOn 
                sx={{ 
                  fontSize: '1rem', 
                  mt: 0.2,
                  color: 'text.secondary'
                }} 
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  lineHeight: 1.4,
                  fontSize: '0.8125rem',
                  flex: 1
                }}
              >
                {event.location}
              </Typography>
            </Box>

            {/* Host */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Person 
                sx={{ 
                  fontSize: '1rem', 
                  mt: 0.2,
                  color: 'text.secondary'
                }} 
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  lineHeight: 1.4,
                  fontSize: '0.8125rem',
                  flex: 1
                }}
              >
                Host: {event.hostName || 'N/A'}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EventCard;

