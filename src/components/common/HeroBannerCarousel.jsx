import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBackIos,
  ArrowForwardIos,
  Event
} from '@mui/icons-material';

/**
 * Hero Banner Carousel Component - Cân đối và đẹp hơn
 * Loại bỏ peek effect, center carousel, opacity đồng đều
 */
const HeroBannerCarousel = ({ events = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const featuredEvents = events.slice(0, 5);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Clean description - loại bỏ JSON, settings, raw data
  const getCleanDescription = (description) => {
    if (!description) return '';
    
    // Loại bỏ các block chứa JSON
    let clean = description
      .replace(/\{["\w\s,:\[\]{}]+\}/g, '') // Remove JSON objects
      .replace(/Event Settings:.*$/gm, '') // Remove "Event Settings:" và mọi thứ sau
      .replace(/Allow Refund.*$/gm, '') // Remove payment info
      .replace(/Payment Method.*$/gm, '') // Remove payment method
      .replace(/Bank Account.*$/gm, '') // Remove bank account
      .replace(/Tax Info.*$/gm, '') // Remove tax info
      .trim();
    
    // Loại bỏ các dòng trống thừa
    clean = clean.split('\n').filter(line => line.trim()).join(' ');
    
    // Giới hạn length
    if (clean.length > 120) {
      clean = clean.substring(0, 120) + '...';
    }
    
    return clean;
  };

  useEffect(() => {
    if (featuredEvents.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredEvents.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [featuredEvents.length]);

  if (!featuredEvents || featuredEvents.length === 0) {
    return null;
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredEvents.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length);
  };

  const handleDotClick = (index) => {
    setCurrentIndex(index);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        height: { xs: 400, md: 500 }, // Tăng height để đẹp hơn
        overflow: 'hidden',
        borderRadius: 4,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        mb: 6,
        maxWidth: '100%',
        mx: 'auto'
      }}
    >
      {/* Slides Container - LOẠI BỎ PEEK EFFECT */}
      <Box
        sx={{
          display: 'flex',
          height: '100%',
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: `translateX(-${currentIndex * 100}%)`, // 100% mỗi slide
          width: '100%'
        }}
      >
        {featuredEvents.map((event, index) => {
          const eventImage = event?.eventDetails?.eventImage || event?.eventImage || null;
          const imageUrl = eventImage 
            ? (eventImage.startsWith('http') ? eventImage : `http://localhost:5000${eventImage}`)
            : null;

          const isActive = index === currentIndex;
          
          return (
            <Box
              key={index}
              sx={{
                minWidth: '100%', // Full width cho mỗi slide
                flexShrink: 0,
                height: '100%',
                position: 'relative',
                opacity: 1 // Luôn opacity 1 - không fade
              }}
            >
              {/* Background Image */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1
                }}
              >
                {/* Placeholder nếu không có ảnh */}
                {!imageUrl && (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Box sx={{ textAlign: 'center', color: 'white' }}>
                      <Event sx={{ fontSize: 80, mb: 2, opacity: 0.9 }} />
                      <Typography variant="h4" fontWeight={700}>
                        Sự Kiện Nổi Bật
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Ảnh sự kiện */}
                {imageUrl && (
                  <Box
                    component="img"
                    src={imageUrl}
                    alt={event.title}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}

                {/* Gradient Overlay - nhẹ hơn để không quá tối */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)',
                  }}
                />
              </Box>

              {/* Content - Center và cân đối */}
              <Container
                maxWidth="lg"
                sx={{
                  position: 'relative',
                  zIndex: 2,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center', // Center content
                  py: 4,
                  px: { xs: 3, md: 6 }
                }}
              >
                {/* Simple Design - Chỉ hình và nút ở góc */}
                <Box 
                  sx={{ 
                    position: 'relative',
                    width: '100%',
                    height: '100%'
                  }}
                >
                  {/* Action Button - Ở góc dưới trái */}
                  <Button
                    component={Link}
                    to={`/event/${event.eventId}`}
                    variant="contained"
                    sx={{
                      position: 'absolute',
                      bottom: { xs: 16, md: 24 },
                      left: { xs: 16, md: 32 },
                      zIndex: 10,
                      bgcolor: 'white',
                      color: 'primary.main',
                      fontWeight: 700,
                      px: { xs: 2.5, md: 4 },
                      py: { xs: 1, md: 1.5 },
                      borderRadius: 3,
                      fontSize: { xs: '0.875rem', md: '1rem' },
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                      '&:hover': {
                        bgcolor: 'grey.100',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 25px rgba(0,0,0,0.4)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Xem Chi Tiết
                  </Button>
                </Box>
              </Container>
            </Box>
          );
        })}
      </Box>

      {/* Navigation Buttons - Đẹp hơn */}
      {featuredEvents.length > 1 && (
        <>
          {/* Previous Button */}
          <IconButton
            onClick={handlePrevious}
            sx={{
              position: 'absolute',
              left: { xs: 16, md: 32 },
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 3,
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              width: 48,
              height: 48,
              '&:hover': {
                bgcolor: 'white',
                transform: 'translateY(-50%) scale(1.15)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
              },
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
            }}
          >
            <ArrowBackIos sx={{ ml: 0.5 }} />
          </IconButton>

          {/* Next Button */}
          <IconButton
            onClick={handleNext}
            sx={{
              position: 'absolute',
              right: { xs: 16, md: 32 },
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 3,
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              width: 48,
              height: 48,
              '&:hover': {
                bgcolor: 'white',
                transform: 'translateY(-50%) scale(1.15)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
              },
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
            }}
          >
            <ArrowForwardIos />
          </IconButton>

          {/* Dots Indicator - Lớn và dễ thấy hơn */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 3,
              display: 'flex',
              gap: 1.5,
              bgcolor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(10px)',
              px: 2,
              py: 1,
              borderRadius: 3
            }}
          >
            {featuredEvents.map((_, index) => (
              <Box
                key={index}
                onClick={() => handleDotClick(index)}
                sx={{
                  width: index === currentIndex ? 32 : 12,
                  height: 12,
                  borderRadius: 6,
                  bgcolor: index === currentIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.4s ease',
                  '&:hover': {
                    bgcolor: 'white',
                    transform: 'scale(1.1)'
                  }
                }}
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
};

export default HeroBannerCarousel;