/**
 * EventCarousel Component - Carousel hiển thị danh sách sự kiện theo chủ đề
 * Style giống FPT Play: card 16:9, hover zoom, gradient overlay, badge
 */

import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

// Material-UI Icons
import { LocationOn, AccessTime, ChevronLeft, ChevronRight } from '@mui/icons-material';

// Theme Context
import { useTheme } from '../../contexts/ThemeContext';

const EventCarousel = ({ 
  title = "Sự kiện", 
  events = [], 
  icon = null,
  showAutoPlay = true 
}) => {
  const swiperRef = useRef(null);
  const { isDark } = useTheme();

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
          <h2 className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
          <span className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
            {events.length}
          </span>
        </div>

        {/* Navigation Buttons */}
        <div className="hidden md:flex gap-2">
          <button
            onClick={() => swiperRef.current?.slidePrev()}
            className={`w-10 h-10 rounded-full hover:bg-orange-500 border flex items-center justify-center transition-all duration-300 ${
              isDark 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-white border-gray-300 text-gray-900 hover:text-white'
            }`}
            aria-label="Previous"
          >
            <ChevronLeft />
          </button>
          <button
            onClick={() => swiperRef.current?.slideNext()}
            className={`w-10 h-10 rounded-full hover:bg-orange-500 border flex items-center justify-center transition-all duration-300 ${
              isDark 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-white border-gray-300 text-gray-900 hover:text-white'
            }`}
            aria-label="Next"
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
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
        >
          {events.map((event) => (
            <SwiperSlide key={event.id} className="!w-auto min-w-0">
              <Link
                to={`/event/${event.id}`}
                className="block group h-full"
              >
                {/* Event Card - Responsive và không bị cắt - Fixed height để đồng đều */}
                <div className={`relative w-full min-w-[240px] max-w-[320px] sm:w-[280px] md:w-[300px] lg:w-[320px] h-[520px] rounded-lg overflow-hidden border hover:border-orange-500 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl mb-2 flex flex-col ${
                  isDark 
                    ? 'bg-gray-900 border-gray-800' 
                    : 'bg-white border-gray-200'
                }`}>
                  {/* Image Container - 16:9 Aspect Ratio */}
                  <div className={`relative w-full aspect-video overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    {/* Skeleton Loading State */}
                    {!event.image && (
                      <div className={`absolute inset-0 animate-pulse flex items-center justify-center ${
                        isDark ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <div className={`w-16 h-16 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>📅</div>
                      </div>
                    )}

                    {/* Event Image với Lazy Load, Alt Text và Fallback */}
                    {event.image ? (
                      <img
                        src={event.image}
                        alt={event.title ? `Ảnh sự kiện: ${event.title}` : 'Ảnh sự kiện'}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
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
                              placeholder.className = 'error-placeholder absolute inset-0 bg-gray-700 flex items-center justify-center text-gray-500';
                              placeholder.setAttribute('aria-label', `Không thể tải ảnh cho sự kiện: ${event.title || 'N/A'}`);
                              placeholder.innerHTML = '<span class="text-4xl">📅</span>';
                              parent.appendChild(placeholder);
                            }
                          }
                        }}
                      />
                    ) : (
                      // Show placeholder immediately if no image URL
                      <div className={`absolute inset-0 flex items-center justify-center ${
                        isDark ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <span className={`text-4xl ${isDark ? 'text-gray-500' : 'text-gray-400'}`} aria-label={`Sự kiện: ${event.title || 'N/A'}`}>📅</span>
                      </div>
                    )}

                    {/* Gradient Overlay with Event Info on Hover */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 ${
                      isDark 
                        ? 'bg-gradient-to-t from-black/90 via-black/60 to-transparent' 
                        : 'bg-gradient-to-t from-black/80 via-black/50 to-transparent'
                    }`}>
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

                    {/* Badge - Top Left - Increased z-index */}
                    {event.badge && (
                      <div className="absolute top-3 left-3 z-20">
                        <span
                          className={`${getBadgeStyle(event.badge).bg} ${getBadgeStyle(event.badge).text} px-3 py-1 rounded-full text-xs font-bold uppercase shadow-lg`}
                        >
                          {event.badge}
                        </span>
                      </div>
                    )}

                    {/* Category Badge - Top Right - Increased z-index */}
                    {event.category && (
                      <div className="absolute top-3 right-3 z-20">
                        <span className="px-3 py-1 bg-black/70 backdrop-blur-sm text-white rounded-full text-xs font-medium">
                          {event.category}
                        </span>
                      </div>
                    )}

                    {/* Price Badge - Bottom Right - Only show if price is 0 (all free) - Increased z-index */}
                    {event.price === 0 && (
                      <div className="absolute bottom-3 right-3 z-20">
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
                  <div className={`p-5 flex-1 flex flex-col ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                    {/* Title - Bold hơn để nổi bật - Increased to 3 lines to show full title */}
                    <h3
                      className={`text-lg md:text-xl font-extrabold mb-4 line-clamp-3 group-hover:text-orange-400 transition-colors duration-300 leading-tight ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        fontWeight: 800,
                        minHeight: '80px', // Fixed height for 3 lines
                        lineHeight: '1.3',
                      }}
                    >
                      {event.title}
                    </h3>

                    {/* Event Details - Icons rõ ràng hơn và contrast tốt hơn */}
                    <div className="space-y-3 text-sm flex-1">
                      {/* Location - Icon lớn hơn và rõ ràng - Fixed height */}
                      <div className="flex items-start gap-2.5 min-h-[48px]">
                        <LocationOn 
                          className="text-orange-500 flex-shrink-0 mt-0.5" 
                          style={{ fontSize: 18 }}
                          aria-label="Địa điểm"
                        />
                        <span 
                          className={`line-clamp-2 font-semibold leading-relaxed flex-1 min-h-[40px] ${
                            isDark ? 'text-gray-100' : 'text-gray-700'
                          }`}
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {event.location || 'Chưa có địa điểm'}
                        </span>
                      </div>

                      {/* Time - Icon lớn hơn và rõ ràng - Fixed height */}
                      <div className="flex items-start gap-2.5 min-h-[24px]">
                        <AccessTime 
                          className="text-orange-500 flex-shrink-0 mt-0.5" 
                          style={{ fontSize: 18 }}
                          aria-label="Thời gian"
                        />
                        <span className={`font-semibold leading-relaxed min-h-[20px] ${
                          isDark ? 'text-gray-100' : 'text-gray-700'
                        }`}>
                          {formatDate(event.startTime)}
                        </span>
                      </div>
                    </div>

                    {/* Host - Always visible with fixed height for uniformity */}
                    <div className={`mt-auto pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} min-h-[32px]`}>
                      <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Host: <span className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                          {event.hostName || 'N/A'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default EventCarousel;

