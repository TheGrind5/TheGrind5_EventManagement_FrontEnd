import React from 'react';
import { Box, Stack, Typography, Button, Chip } from '@mui/material';
import { AccessTime, LocationOn, Event as EventIcon } from '@mui/icons-material';

/**
 * EventTicket
 * A modern, premium ticket-style component inspired by TicketBox.
 * Left: information (dark, green accents). Right: poster banner. Perforated divider between.
 */
const EventTicket = ({
  title,
  timeText,
  locationText,
  priceText,
  imageSrc,
  onBuy,
  ctaText = 'Mua vé ngay',
  category,
  status,
}) => {
  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: 'transparent',
        display: 'flex',
        justifyContent: 'center',
        fontFamily: `"Inter","Poppins",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif`,
      }}
    >
      <Box
        role="region"
        aria-label="Event ticket"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.05fr 1.4fr' },
          alignItems: 'stretch',
          width: 'min(1120px, 100%)',
          borderRadius: '20px',
          overflow: 'visible',
          position: 'relative',
          boxShadow: '0 30px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          backgroundColor: '#2b2b2b',
          color: '#fff',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            left: -16,
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: 'rgb(24,24,28)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            right: -16,
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: 'rgb(24,24,28)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
          },
        }}
      >
        {/* Left: Info area */}
        <Box
          sx={{
            p: { xs: 2, md: 3 },
            pr: { md: 2 },
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            color: 'rgba(255,255,255,0.9)',
            background:
              'radial-gradient(1400px 260px at -10% 10%, rgba(66,245,146,0.08), transparent 50%), radial-gradient(800px 220px at 30% 120%, rgba(255,165,0,0.06), transparent 60%)',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            {category && (
              <Chip
                label={category}
                size="small"
                sx={{
                  bgcolor: 'rgba(66,245,146,0.14)',
                  color: '#39d98a',
                  border: '1px solid rgba(66,245,146,0.3)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                }}
              />
            )}
          </Stack>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: -0.2,
              textShadow: '0 2px 14px rgba(0,0,0,0.35)',
            }}
          >
            {title}
          </Typography>

          <Stack spacing={1.25}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <EventIcon sx={{ color: '#39d98a' }} />
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {timeText}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <LocationOn sx={{ color: 'rgba(255,255,255,0.72)' }} />
              <Typography variant="body1">{locationText}</Typography>
            </Stack>
          </Stack>

          <Box sx={{ height: 1, borderTop: '1px solid rgba(255,255,255,0.08)', my: 1 }} />

          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Stack spacing={0.25}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                Giá từ
              </Typography>
              <Typography
                variant="h5"
                sx={{ color: '#39d98a', fontWeight: 800, letterSpacing: 0.2 }}
              >
                {priceText}
              </Typography>
            </Stack>
            <Button
              onClick={status === 'Closed' ? undefined : onBuy}
              disabled={status === 'Closed'}
              size="large"
              sx={{
                px: 3,
                py: 1.25,
                borderRadius: 2,
                fontWeight: 800,
                color: status === 'Closed' ? 'rgba(255,255,255,0.5)' : '#0e0e10',
                background: status === 'Closed'
                  ? 'linear-gradient(90deg, #666666 0%, #555555 50%, #444444 100%)'
                  : 'linear-gradient(90deg, #42f592 0%, #2fe580 50%, #21d773 100%)',
                boxShadow: status === 'Closed'
                  ? '0 4px 12px rgba(0, 0, 0, 0.2)'
                  : '0 12px 28px rgba(66,245,146,0.22), inset 0 1px 0 rgba(255,255,255,0.25)',
                textTransform: 'none',
                cursor: status === 'Closed' ? 'not-allowed' : 'pointer',
                '&:hover': {
                  filter: status === 'Closed' ? 'none' : 'brightness(0.98)',
                  boxShadow: status === 'Closed'
                    ? '0 4px 12px rgba(0, 0, 0, 0.2)'
                    : '0 14px 32px rgba(66,245,146,0.28)',
                  background: status === 'Closed'
                    ? 'linear-gradient(90deg, #666666 0%, #555555 50%, #444444 100%)'
                    : 'linear-gradient(90deg, #46ff98 0%, #35ee87 50%, #28e07b 100%)',
                },
              }}
            >
              {status === 'Closed' ? 'Sự kiện đã kết thúc' : ctaText}
            </Button>
          </Stack>
        </Box>

        {/* Center perforated divider (only on desktop) */}
        <Box
          aria-hidden
          sx={{
            display: { xs: 'none', md: 'block' },
            background:
              'repeating-linear-gradient(180deg, transparent, transparent 8px, rgba(255,255,255,0.06) 8px, rgba(255,255,255,0.06) 16px)',
            position: 'relative',
          }}
        >
          {/* notch circles */}
          <Box
            sx={{
              position: 'absolute',
              left: -10,
              top: -10,
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: 'rgb(24,24,28)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              left: -10,
              bottom: -10,
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: 'rgb(24,24,28)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
            }}
          />
        </Box>

        {/* Right: Poster banner */}
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            bgcolor: 'black',
          }}
        >
          <Box
            component="img"
            src={imageSrc}
            alt={title}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              filter: 'saturate(1.02) contrast(1.02)',
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          {/* soft rim light */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default EventTicket;


