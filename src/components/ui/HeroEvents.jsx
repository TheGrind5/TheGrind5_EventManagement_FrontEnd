/**
 * HeroEvents Component - Full-width Hero Banner với Carousel
 * Style giống FPT Play với Framer Motion animations
 * FIXED: No overlapping content, smooth transitions, proper image loading
 * Memoized để tránh re-render không cần thiết và cải thiện performance
 */

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// Swiper imports removed (thumbnails moved to right-side vertical list)

// Material-UI Icons
import { LocationOn, AccessTime, ChevronLeft, ChevronRight } from '@mui/icons-material';

const HeroEvents = memo(({ events = [] }) => {
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
        return 'bg-orange-500';  // Đổi từ green sang orange
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
  
  // Auto-advance slides - Tăng delay để giảm CPU usage
  useEffect(() => {
    if (events.length <= 1 || isTransitioning) return;
    
    const interval = setInterval(() => {
      handleNext();
    }, 6000); // Tăng từ 5000ms lên 6000ms để giảm tải
    
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
    <div className="relative w-full aspect-video max-h-[75vh] min-h-[420px] overflow-hidden" style={{ width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
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
            transition={{ duration: 0.3, ease: "easeInOut" }}
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

        {/* Removed global dark overlay to keep banner clear and bright */}

        {/* Additional Blur Overlay for better text readability */}
        {/* Removed global blur to make banner clearer */}

        {/* Left content area: soft gradient only (no global blur) */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: 'rgba(0,0,0,0.25)',
            WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 52%, rgba(0,0,0,0.75) 64%, rgba(0,0,0,0.35) 78%, rgba(0,0,0,0) 92%)',
            maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 52%, rgba(0,0,0,0.75) 64%, rgba(0,0,0,0.35) 78%, rgba(0,0,0,0) 92%)'
          }}
        />

        {/* Top under header: soft gradient only */}
        <div
          className="absolute top-0 left-0 right-0 z-0 pointer-events-none"
          style={{
            height: '104px',
            background: 'rgba(0,0,0,0.45)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0.4) 80%, rgba(0,0,0,0) 100%)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0.4) 80%, rgba(0,0,0,0) 100%)'
          }}
        />

        {/* Bottom near filter bar: soft gradient only */}
        <div
          className="absolute bottom-0 left-0 right-0 z-0 pointer-events-none"
          style={{
            height: '104px',
            background: 'rgba(0,0,0,0.4)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0.4) 80%, rgba(0,0,0,0) 100%)',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0.4) 80%, rgba(0,0,0,0) 100%)'
          }}
        />
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

        {/* Hero Content - Left-bottom focus area */}
        <div className="flex-1 px-4 md:px-8 lg:px-16 py-8 relative">
          <AnimatePresence mode="wait">
            {!isTransitioning && currentEvent && (
              <motion.div
                key={`hero-content-${currentIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="relative w-full h-full"
              >
                {/* Content Wrapper - anchor bottom-left */}
                <div className="relative mx-auto w-full h-full">
                  <div className="absolute bottom-10 left-4 md:left-8 lg:left-16 max-w-2xl">
                    {/* LEFT COLUMN - Event Info (smaller sizes) */}
                    <div className="w-full space-y-4">
                  {/* Badge - Chỉ hiển thị một badge */}
                  {currentEvent.badge && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.1, duration: 0.3 }}
                              className="mb-1 inline-block"
                            >
                              <span
                                className={`${getBadgeStyle(currentEvent.badge)} text-white px-5 py-2 rounded-full text-sm font-bold uppercase tracking-wide shadow-2xl`}
                              >
                                {currentEvent.badge}
                              </span>
                            </motion.div>
                          )}

                          {/* Title - Large, bold white text (reduced one step per breakpoint) */}
                          <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.4 }}
                            className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black text-white leading-[1.1]"
                            style={{
                              textShadow: '2px 2px 8px rgba(0,0,0,0.8), 0px 0px 6px rgba(0,0,0,0.6)',
                              WebkitTextStroke: '1px rgba(0,0,0,0.3)',
                              letterSpacing: '-0.02em',
                            }}
                          >
                            {currentEvent.title || 'Sự kiện'}
                          </motion.h1>

                          {/* Info Cards - Vertical stack (compact) */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25, duration: 0.4 }}
                            className="space-y-2"
                          >
                            {/* Campus Card - compact, auto width */}
                            <div className="inline-flex w-auto items-center whitespace-nowrap gap-3 px-3 py-2 bg-black/35 border border-white/10 rounded-lg hover:bg-black/50 transition-all duration-300">
															<div className="p-1.5 bg-orange-500/20 rounded-lg">
																<LocationOn className="text-orange-400 text-xl" />
															</div>
															<div className="flex-1">
																<div className="text-[10px] md:text-[11px] text-white/70 uppercase tracking-wide mb-0.5 font-semibold">Campus</div>
																<div
																	className="font-bold text-white text-sm leading-tight whitespace-nowrap"
																	style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}
																>
																	{currentEvent.campus || 'Chưa có campus'}
																</div>
															</div>
														</div>

                            {/* Time Card - compact, auto width */}
                            <div className="inline-flex w-auto items-center whitespace-nowrap gap-3 px-3 py-2 bg-black/35 border border-white/10 rounded-lg hover:bg-black/50 transition-all duration-300">
															<div className="p-1.5 bg-orange-500/20 rounded-lg">
																<AccessTime className="text-orange-400 text-xl" />
															</div>
															<div className="flex-1">
																<div className="text-[10px] md:text-[11px] text-white/70 uppercase tracking-wide mb-0.5 font-semibold">Thời gian</div>
																<div
																	className="font-bold text-white text-sm leading-tight whitespace-nowrap"
																	style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}
																>
																	{formatDate(currentEvent.startTime)}
																</div>
															</div>
														</div>
                          </motion.div>

                          {/* CTA - compact primary button */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                            className="flex items-center gap-3 pt-1"
                          >
                            <Link
                              to={`/event/${currentEvent.id || currentEvent.eventId}`}
                              className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-sm rounded-xl transition-all duration-300 shadow-lg shadow-orange-500/30 focus:outline-none focus:ring-4 focus:ring-orange-500/30"
                              style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}
                            >
                              📖 Chi tiết
                            </Link>
                          </motion.div>
                    </div>
                  </div>

                  {/* Thumbnails - bottom (smaller) */}
                  <div className="absolute bottom-6 right-6 z-20">
                    <div className="flex items-center gap-2">
                      {events.slice(0, 5).map((event, index) => (
                        <button
                          key={event.id || index}
                          onClick={() => handleThumbnailClick(index)}
                          className={`w-16 h-10 md:w-20 md:h-12 rounded-lg overflow-hidden transition-all ${index === currentIndex ? 'ring-2 ring-orange-500 scale-105' : 'opacity-70 hover:opacity-100'}`}
                          aria-label={`Thumbnail ${index + 1}`}
                        >
                          <img
                            src={getImageUrl(event)}
                            alt={event.title ? `Thumbnail sự kiện: ${event.title}` : 'Thumbnail sự kiện'}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => { e.target.src = fallbackImage; }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
        </div>

        {/* Bottom thumbnails implemented above; no separate carousel */}
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .thumbnail-swiper .swiper-slide {
          width: auto;
        }
      `}</style>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison để chỉ re-render khi events thực sự thay đổi
  return prevProps.events?.length === nextProps.events?.length &&
         prevProps.events?.every((event, index) => 
           event.id === nextProps.events?.[index]?.id &&
           event.image === nextProps.events?.[index]?.image &&
           event.title === nextProps.events?.[index]?.title
         );
});

HeroEvents.displayName = 'HeroEvents';

export default HeroEvents;
