/**
 * HeroEvents Component - Full-width Hero Banner với Carousel
 * Style giống FPT Play với Framer Motion animations
 * FIXED: No overlapping content, smooth transitions, proper image loading
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

// Material-UI Icons
import { LocationOn, AccessTime, ChevronLeft, ChevronRight } from '@mui/icons-material';

const HeroEvents = ({ events = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const thumbnailSwiperRef = useRef(null);

  // Get current event
  const currentEvent = events[currentIndex] || events[0];
  
  // Fallback image URL
  const fallbackImage = 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1920&h=1080&fit=crop';

  // Get image URL with fallback - Use backgroundImage (1280x720) as main display image
  const getImageUrl = useCallback((event) => {
    if (!event) return fallbackImage;
    
    // Get backgroundImage (1280x720) - main display image for all pages
    // eventImage (720x958) is saved but not displayed
    const imageUrl = event.image || 
                     event.backgroundImage ||
                     event.eventDetails?.backgroundImage ||
                     '';
    
    // If no image found, use fallback
    if (!imageUrl || imageUrl.trim() === '') {
      return fallbackImage;
    }
    
    // If it's already a full URL (http/https), use it directly
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // If it's a relative path starting with '/', prepend base URL
    if (imageUrl.startsWith('/')) {
      return `http://localhost:5000${imageUrl}`;
    }
    
    // If it doesn't start with '/', might still be a relative path
    return `http://localhost:5000/${imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl}`;
  }, []);

  // Handle image load
  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
    setImageError(false);
  }, []);

  // Handle image error
  const handleImageError = useCallback((e) => {
    setImageError(true);
    setImageLoading(false);
    if (e.target.src !== fallbackImage && !e.target.src.includes('placeholder')) {
      e.target.src = fallbackImage;
      setTimeout(() => {
        setImageError(false);
        setImageLoading(true);
      }, 100);
    }
  }, []);

  // Reset image state when slide changes
  useEffect(() => {
    if (currentEvent) {
      setImageLoading(true);
      setImageError(false);
    }
  }, [currentIndex, currentEvent]);

  // Format date helper - Format ngày/tháng/năm
  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa có thời gian';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Badge color mapping
  const getBadgeStyle = (badge) => {
    switch (badge) {
      case 'Hot':
        return 'bg-red-500';
      case 'New':
        return 'bg-blue-500';
      case 'Free':
        return 'bg-green-500';
      case 'Sắp diễn ra':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Handle slide change with proper transition flow - FIXED: Simplified without Swiper dependency
  const changeSlide = useCallback((newIndex) => {
    if (newIndex === currentIndex || isTransitioning || newIndex < 0 || newIndex >= events.length) {
      return;
    }
    
    setIsTransitioning(true);
    
    // Wait for fade out (300ms)
    setTimeout(() => {
      setCurrentIndex(newIndex);
      
      // Sync thumbnail slider
      if (thumbnailSwiperRef.current) {
        thumbnailSwiperRef.current.slideTo(newIndex);
      }
      
      // Wait for fade in (300ms)
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 300);
  }, [currentIndex, isTransitioning, events.length]);

  // Navigation handlers - FIXED: Direct index manipulation instead of Swiper
  const handlePrev = useCallback(() => {
    if (!isTransitioning && events.length > 0) {
      const newIndex = currentIndex === 0 ? events.length - 1 : currentIndex - 1;
      changeSlide(newIndex);
    }
  }, [isTransitioning, events.length, currentIndex, changeSlide]);

  const handleNext = useCallback(() => {
    if (!isTransitioning && events.length > 0) {
      const newIndex = currentIndex === events.length - 1 ? 0 : currentIndex + 1;
      changeSlide(newIndex);
    }
  }, [isTransitioning, events.length, currentIndex, changeSlide]);

  const handleThumbnailClick = useCallback((index) => {
    if (!isTransitioning && index !== currentIndex && events.length > 0) {
      changeSlide(index);
    }
  }, [currentIndex, isTransitioning, events.length, changeSlide]);
  
  // Auto-advance slides
  useEffect(() => {
    if (events.length <= 1 || isTransitioning) return;
    
    const interval = setInterval(() => {
      handleNext();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [events.length, isTransitioning, handleNext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsTransitioning(false);
      setImageLoading(false);
    };
  }, []);

  if (!events || events.length === 0) {
    return null;
  }

  const imageUrl = getImageUrl(currentEvent);

  return (
    <div className="relative w-full h-[85vh] min-h-[600px] max-h-[900px] overflow-hidden">
      {/* Background Image Layer - Changes with currentEvent */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
        {/* Loading Skeleton */}
        {imageLoading && !imageError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </motion.div>
        )}

        {/* Actual Image - FPT Play Style with smooth transitions */}
        <AnimatePresence mode="wait">
          <motion.img
            key={`bg-image-${currentIndex}`}
            src={imageUrl || fallbackImage}
            alt={currentEvent?.title ? `Hero banner: ${currentEvent.title}` : 'Event hero banner'}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ 
              opacity: imageLoading || isTransitioning ? 0 : 1,
              scale: imageLoading || isTransitioning ? 1.1 : 1,
            }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="eager"
            decoding="async"
            style={{
              minHeight: '100%',
              minWidth: '100%',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        </AnimatePresence>

        {/* Error Fallback */}
        {imageError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center"
          >
            <div className="text-center text-white/50">
              <div className="text-6xl mb-4">📅</div>
              <p className="text-lg">Không thể tải ảnh sự kiện</p>
            </div>
          </motion.div>
        )}

        {/* Dark Gradient Overlay - FPT Play Style (from bottom rgba(0,0,0,0.9) to top rgba(0,0,0,0.3)) */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.3) 100%)',
          }}
        />

        {/* Additional Blur Overlay for better text readability */}
        <div className="absolute inset-0 backdrop-blur-sm z-0" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Navigation Buttons */}
        <button
          onClick={handlePrev}
          disabled={isTransitioning || events.length <= 1}
          className="absolute top-1/2 left-4 z-30 transform -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous slide"
        >
          <ChevronLeft className="text-white" />
        </button>
        
        <button
          onClick={handleNext}
          disabled={isTransitioning || events.length <= 1}
          className="absolute top-1/2 right-4 z-30 transform -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next slide"
        >
          <ChevronRight className="text-white" />
        </button>

        {/* Hero Content - Main Banner with AnimatePresence to prevent overlapping */}
        <div className="flex-1 flex items-center justify-center px-4 md:px-8 lg:px-16 py-8 relative">
          <AnimatePresence mode="wait">
            {!isTransitioning && currentEvent && (
              <motion.div
                key={`hero-content-${currentIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center w-full h-full px-4 md:px-8 lg:px-16"
              >
                {/* Content Wrapper */}
                <div className="relative max-w-6xl mx-auto text-center px-4 md:px-8 w-full">
                  {/* Badge - Chỉ hiển thị một badge */}
                  {currentEvent.badge && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.1, duration: 0.3 }}
                              className="mb-6 inline-block"
                            >
                              <span
                                className={`${getBadgeStyle(currentEvent.badge)} text-white px-5 py-2 rounded-full text-sm font-bold uppercase tracking-wide shadow-2xl`}
                              >
                                {currentEvent.badge}
                              </span>
                            </motion.div>
                          )}

                          {/* Title - Large, bold white text (48-64px) */}
                          <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.4 }}
                            className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-10 leading-[1.1] px-4"
                            style={{
                              textShadow: '2px 2px 8px rgba(0,0,0,0.8), 0px 0px 6px rgba(0,0,0,0.6)',
                              WebkitTextStroke: '1px rgba(0,0,0,0.3)',
                              letterSpacing: '-0.02em',
                            }}
                          >
                            {currentEvent.title || 'Sự kiện'}
                          </motion.h1>

                          {/* Two Info Cards Side by Side - Campus and Time */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25, duration: 0.4 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 max-w-xl mx-auto px-4"
                          >
                            {/* Campus Card - với pin icon */}
                            <div className="flex flex-col items-center gap-1 px-4 py-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg hover:border-orange-500/50 transition-all duration-300">
                              <LocationOn className="text-orange-400 text-2xl" />
                              <span className="text-xs text-white/60 uppercase tracking-wide mb-0.5 font-semibold">Campus</span>
                              <span
                                className="font-bold text-white text-xs md:text-sm text-center leading-tight"
                                style={{ 
                                  textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                                  color: 'rgba(255, 255, 255, 1)'
                                }}
                              >
                                {currentEvent.campus || currentEvent.location || 'Chưa có campus'}
                              </span>
                            </div>

                            {/* Time Card - với clock icon */}
                            <div className="flex flex-col items-center gap-1 px-4 py-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg hover:border-orange-500/50 transition-all duration-300">
                              <AccessTime className="text-orange-400 text-2xl" />
                              <span className="text-xs text-white/60 uppercase tracking-wide mb-0.5 font-semibold">Thời gian</span>
                              <span
                                className="font-bold text-white text-xs md:text-sm text-center leading-tight"
                                style={{ 
                                  textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                                  color: 'rgba(255, 255, 255, 1)'
                                }}
                              >
                                {formatDate(currentEvent.startTime)}
                              </span>
                            </div>
                          </motion.div>

                          {/* Single CTA - Chi tiết */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.4 }}
                            className="flex flex-wrap items-center justify-center gap-4 md:gap-6 px-4"
                          >
                            <Link
                              to={`/event/${currentEvent.id || currentEvent.eventId}`}
                              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm md:text-base rounded-lg transition-all duration-300 transform hover:scale-110 active:scale-105 shadow-xl hover:shadow-2xl min-w-[140px] text-center focus:outline-none focus:ring-4 focus:ring-orange-500/30"
                              style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}
                            >
                              📖 Chi tiết
                            </Link>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
        </div>

        {/* Thumbnail Navigation at Bottom - Showing other events */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pb-6 md:pb-10">
          <div className="max-w-7xl mx-auto px-4">
            <Swiper
              modules={[Navigation]}
              spaceBetween={12}
              slidesPerView="auto"
              freeMode
              watchSlidesProgress
              onSwiper={(swiper) => {
                thumbnailSwiperRef.current = swiper;
              }}
              className="thumbnail-swiper"
              breakpoints={{
                320: {
                  slidesPerView: 3,
                  spaceBetween: 8,
                },
                640: {
                  slidesPerView: 4,
                  spaceBetween: 10,
                },
                1024: {
                  slidesPerView: 6,
                  spaceBetween: 12,
                },
              }}
            >
              {events.map((event, index) => (
                <SwiperSlide
                  key={event.id || index}
                  className={`cursor-pointer transition-all duration-300 ${
                    index === currentIndex ? 'opacity-100 scale-105' : 'opacity-60 hover:opacity-90'
                  }`}
                  onClick={() => handleThumbnailClick(index)}
                  style={{ width: 'auto' }}
                >
                  <div className="relative w-24 h-16 md:w-32 md:h-20 rounded-lg overflow-hidden border-2 border-white/30 hover:border-orange-500 transition-all duration-300">
                    <img
                      src={getImageUrl(event)}
                      alt={event.title ? `Thumbnail sự kiện: ${event.title}` : 'Thumbnail sự kiện'}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = fallbackImage;
                      }}
                    />
                    {/* Active Indicator */}
                    {index === currentIndex && (
                      <div className="absolute inset-0 border-2 border-orange-500 rounded-lg" />
                    )}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .thumbnail-swiper .swiper-slide {
          width: auto;
        }
      `}</style>
    </div>
  );
};

export default HeroEvents;
