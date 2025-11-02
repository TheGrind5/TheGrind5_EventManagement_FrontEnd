/**
 * EventCarousel Component - Carousel hiển thị danh sách sự kiện theo chủ đề
 * Style giống FPT Play: card 16:9, hover zoom, gradient overlay, badge
 * Memoized để tránh re-render không cần thiết và cải thiện performance
 */

import React, { useRef, memo } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

// Material-UI
import { useTheme } from '@mui/material/styles';

// Material-UI Icons
import { LocationOn, AccessTime, ChevronLeft, ChevronRight } from '@mui/icons-material';

const EventCarousel = memo(({ 
  title = "Sự kiện", 
  events = [], 
  icon = null,
  showAutoPlay = true 
}) => {
  const swiperRef = useRef(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Format date helper
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format price
  const formatPrice = (price) => {
    if (price === 0) return "Miễn phí";
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Badge color mapping
  const getBadgeStyle = (badge) => {
    switch (badge) {
      case 'Hot':
        return { bg: 'bg-red-500', text: 'text-white' };
      case 'New':
        return { bg: 'bg-blue-500', text: 'text-white' };
      case 'Free':
        return { bg: 'bg-orange-500', text: 'text-white' };  // Đổi từ green sang orange
      case 'Sắp diễn ra':
        return { bg: 'bg-orange-500', text: 'text-white' };
      default:
        return { bg: 'bg-gray-500', text: 'text-white' };
    }
  };

  if (!events || events.length === 0) {
    return null;
  }

  return (
    <div className="mb-16 md:mb-20">
      {/* Section Header - Cải thiện spacing */}
      <div className="flex items-center justify-between mb-8 px-4 md:px-0">
        <div className="flex items-center gap-3">
          {icon && <span className="text-orange-500">{icon}</span>}
          <h2 
            className="text-2xl md:text-3xl font-bold"
            style={{ color: isDark ? '#FFFFFF' : '#0D0D0D' }}
          >
            {title}
          </h2>
          <span 
            className="px-3 py-1 rounded-full text-sm"
            style={{
              backgroundColor: isDark ? '#262626' : '#F3F4F6',
              color: isDark ? '#D1D5DB' : '#6B7280'
            }}
          >
            {events.length}
          </span>
        </div>

        {/* Navigation Buttons */}
        <div className="hidden md:flex gap-2">
          <button
            onClick={() => swiperRef.current?.slidePrev()}
            className="w-10 h-10 rounded-full hover:bg-orange-500 border flex items-center justify-center transition-all duration-300"
            style={{
              backgroundColor: isDark ? '#262626' : '#F3F4F6',
              borderColor: isDark ? '#404040' : '#E5E7EB',
              color: isDark ? '#FFFFFF' : '#0D0D0D'
            }}
            aria-label="Previous"
          >
            <ChevronLeft />
          </button>
          <button
            onClick={() => swiperRef.current?.slideNext()}
            className="w-10 h-10 rounded-full hover:bg-orange-500 border flex items-center justify-center transition-all duration-300"
            style={{
              backgroundColor: isDark ? '#262626' : '#F3F4F6',
              borderColor: isDark ? '#404040' : '#E5E7EB',
              color: isDark ? '#FFFFFF' : '#0D0D0D'
            }}
            aria-label="Next"
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative" style={{ overflow: 'visible', paddingBottom: '24px' }}>
        <Swiper
          modules={[Navigation, Autoplay]}
          spaceBetween={24}
          slidesPerView="auto"
          autoplay={showAutoPlay ? {
            delay: 4000,
            disableOnInteraction: false,
          } : false}
          loop={events.length > 4}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          style={{ overflow: 'visible', paddingBottom: '24px' }}
          breakpoints={{
            320: {
              slidesPerView: 1.2,
              spaceBetween: 12,
            },
            480: {
              slidesPerView: 1.5,
              spaceBetween: 16,
            },
            640: {
              slidesPerView: 2,
              spaceBetween: 20,
            },
            768: {
              slidesPerView: 2.5,
              spaceBetween: 24,
            },
            1024: {
              slidesPerView: 3.5,
              spaceBetween: 28,
            },
            1280: {
              slidesPerView: 4.5,
              spaceBetween: 32,
            },
            1536: {
              slidesPerView: 5,
              spaceBetween: 36,
            },
          }}
          className="event-carousel"
          wrapperClass="event-carousel-wrapper"
        >
          {events.map((event) => (
            <SwiperSlide 
              key={event.id} 
              className="!w-auto min-w-0"
              style={{ 
                height: 'auto',
                display: 'flex',
                alignItems: 'stretch'
              }}
            >
              <Link
                to={`/event/${event.id}`}
                className="block group h-full"
                style={{ 
                  width: '100%',
                  height: '100%',
                  display: 'flex'
                }}
              >
                {/* Event Card - Responsive và không bị cắt */}
                <div 
                  className="relative w-full min-w-[240px] max-w-[320px] sm:w-[280px] md:w-[300px] lg:w-[320px] rounded-lg overflow-hidden border transition-all duration-300 mb-2 flex flex-col h-full"
                  style={{
                    backgroundColor: isDark ? '#1A1A1A' : '#FAFAFA',
                    borderColor: isDark ? '#2A2A2A' : '#E5E7EB',
                    minHeight: '480px',
                    position: 'relative',
                    zIndex: 1,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.borderColor = '#FF7A00';
                    e.currentTarget.style.boxShadow = isDark 
                      ? '0 12px 40px rgba(0, 0, 0, 0.3)' 
                      : '0 12px 40px rgba(0, 0, 0, 0.15)';
                    e.currentTarget.style.zIndex = '10';
                    e.currentTarget.style.transition = 'all 0.2s ease';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = isDark ? '#2A2A2A' : '#E5E7EB';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.zIndex = '1';
                    e.currentTarget.style.transition = 'all 0.2s ease';
                  }}
                >
                  {/* Image Container - 16:9 Aspect Ratio */}
                  <div 
                    className="relative w-full aspect-video overflow-hidden"
                    style={{
                      backgroundColor: isDark ? '#262626' : '#E5E5E5'
                    }}
                  >
                    {/* Skeleton Loading State */}
                    {!event.image && (
                      <div 
                        className="absolute inset-0 animate-pulse flex items-center justify-center"
                        style={{
                          backgroundColor: isDark ? '#404040' : '#D1D5DB',
                          color: isDark ? '#9CA3AF' : '#6B7280'
                        }}
                      >
                        <div className="w-16 h-16">📅</div>
                      </div>
                    )}

                    {/* Event Image với Lazy Load, Alt Text và Fallback - Optimized */}
                    {event.image ? (
                      <img
                        src={event.image}
                        alt={event.title ? `Ảnh sự kiện: ${event.title}` : 'Ảnh sự kiện'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                        style={{
                          willChange: 'transform',
                          imageRendering: 'crisp-edges'
                        }}
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          const placeholderUrl = 'https://via.placeholder.com/640x360/1a1a1a/ffffff?text=Event+Image';
                          if (e.target.src !== placeholderUrl) {
                            e.target.src = placeholderUrl;
                          } else {
                            // If placeholder also fails, show calendar icon
                            e.target.style.display = 'none';
                            const parent = e.target.parentElement;
                            if (parent && !parent.querySelector('.error-placeholder')) {
                            const placeholder = document.createElement('div');
                            placeholder.className = 'error-placeholder absolute inset-0 flex items-center justify-center';
                            placeholder.style.backgroundColor = isDark ? '#404040' : '#D1D5DB';
                            placeholder.style.color = isDark ? '#9CA3AF' : '#6B7280';
                            placeholder.setAttribute('aria-label', `Không thể tải ảnh cho sự kiện: ${event.title || 'N/A'}`);
                            placeholder.innerHTML = '<span class="text-4xl">📅</span>';
                            parent.appendChild(placeholder);
                            }
                          }
                        }}
                      />
                    ) : (
                      // Show placeholder immediately if no image URL
                      <div 
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                          backgroundColor: isDark ? '#404040' : '#D1D5DB'
                        }}
                      >
                        <span 
                          className="text-4xl" 
                          style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                          aria-label={`Sự kiện: ${event.title || 'N/A'}`}
                        >
                          📅
                        </span>
                      </div>
                    )}

                    {/* Gradient Overlay with Event Info on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      {/* Event Info Overlay - Shows on hover */}
                      <div className="transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <h4 className="text-white font-bold text-lg mb-2 line-clamp-2">{event.title}</h4>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-center gap-2 text-gray-200">
                            <LocationOn style={{ fontSize: 16 }} />
                            <span className="line-clamp-1">{event.location || 'Chưa có địa điểm'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-200">
                            <AccessTime style={{ fontSize: 16 }} />
                            <span>{formatDate(event.startTime)}</span>
                          </div>
                          {event.hostName && (
                            <div className="flex items-center gap-2 text-gray-300 text-xs">
                              <span>Host: {event.hostName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Badge - Top Left */}
                    <div className="absolute top-3 left-3 z-10">
                      <span
                        className={`${getBadgeStyle(event.badge).bg} ${getBadgeStyle(event.badge).text} px-3 py-1 rounded-full text-xs font-bold uppercase shadow-lg`}
                      >
                        {event.badge}
                      </span>
                    </div>

                    {/* Category Badge - Top Right */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className="px-3 py-1 bg-black/70 backdrop-blur-sm text-white rounded-full text-xs font-medium">
                        {event.category}
                      </span>
                    </div>

                    {/* Price Badge - Bottom Right - Only show if price is 0 (all free) */}
                    {event.price === 0 && (
                      <div className="absolute bottom-3 right-3 z-10">
                        <span 
                          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-lg text-sm font-bold shadow-lg transition-all duration-200 cursor-default"
                          role="button"
                          tabIndex={0}
                          aria-label="Giá vé: Miễn phí"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          Miễn phí
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Content - Cải thiện padding và spacing */}
                  <div 
                    className="p-5 flex-1 flex flex-col"
                    style={{
                      backgroundColor: isDark ? '#1A1A1A' : '#FAFAFA'
                    }}
                  >
                    {/* Title - Bold hơn để nổi bật */}
                    <h3
                      className="text-lg md:text-xl font-extrabold mb-4 line-clamp-2 group-hover:text-orange-400 transition-colors duration-300 leading-tight"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        fontWeight: 800,
                        color: isDark ? '#FFFFFF' : '#0D0D0D'
                      }}
                    >
                      {event.title}
                    </h3>

                    {/* Event Details - Icons rõ ràng hơn và contrast tốt hơn */}
                    <div className="space-y-3 text-sm flex-1">
                      {/* Location - Icon lớn hơn và rõ ràng */}
                      <div className="flex items-start gap-2.5">
                        <LocationOn 
                          className="text-orange-500 flex-shrink-0 mt-0.5" 
                          style={{ fontSize: 18 }}
                          aria-label="Địa điểm"
                        />
                        <span 
                          className="line-clamp-2 font-semibold leading-relaxed flex-1"
                          style={{ color: isDark ? '#E5E7EB' : '#374151' }}
                        >
                          {event.location || 'Chưa có địa điểm'}
                        </span>
                      </div>

                      {/* Time - Icon lớn hơn và rõ ràng */}
                      <div className="flex items-start gap-2.5">
                        <AccessTime 
                          className="text-orange-500 flex-shrink-0 mt-0.5" 
                          style={{ fontSize: 18 }}
                          aria-label="Thời gian"
                        />
                        <span 
                          className="font-semibold leading-relaxed"
                          style={{ color: isDark ? '#E5E7EB' : '#374151' }}
                        >
                          {formatDate(event.startTime)}
                        </span>
                      </div>
                    </div>

                    {/* Host (optional) */}
                    {event.hostName && (
                      <div 
                        className="mt-3 pt-3 border-t"
                        style={{ borderColor: isDark ? '#404040' : '#E5E7EB' }}
                      >
                        <span 
                          className="text-xs"
                          style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                        >
                          Host: <span 
                            className="font-medium"
                            style={{ color: isDark ? '#E5E7EB' : '#374151' }}
                          >
                            {event.hostName}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      
      {/* Custom Styles for overflow handling */}
      <style>{`
        .event-carousel {
          overflow: visible !important;
        }
        .event-carousel-wrapper {
          overflow: visible !important;
        }
        .event-carousel .swiper-wrapper {
          overflow: visible !important;
        }
        .event-carousel .swiper-slide {
          overflow: visible !important;
          height: auto !important;
        }
      `}</style>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison để chỉ re-render khi props thực sự thay đổi
  return prevProps.title === nextProps.title &&
         prevProps.showAutoPlay === nextProps.showAutoPlay &&
         prevProps.events?.length === nextProps.events?.length &&
         prevProps.events?.every((event, index) => 
           event.id === nextProps.events?.[index]?.id &&
           event.image === nextProps.events?.[index]?.image
         );
});

EventCarousel.displayName = 'EventCarousel';

export default EventCarousel;

