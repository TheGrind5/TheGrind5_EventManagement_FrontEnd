// React & Router
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Material-UI Components
import { 
  Autocomplete, 
  TextField, 
  Popper, 
  Paper,
  Box,
  Typography,
  Avatar,
  CircularProgress,
  IconButton,
  ListSubheader
} from '@mui/material';

// Material-UI Icons
import { Event as EventIcon, LocationOn, AccessTime, Close as CloseIcon, History as HistoryIcon } from '@mui/icons-material';

// Services
import { eventsAPI } from '../../services/apiClient';

const SearchAutocomplete = ({ searchTerm, onSearchChange, onEventSelect, sx }) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const [randomSuggestions, setRandomSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);

  // Fetch all events for suggestions (cached)
  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        setLoading(true);
        // Fetch first page with max items to get all events for suggestions
        const response = await eventsAPI.getAll(1, 100);
        const payload = response.data;
        
        let eventsData = [];
        if (payload && Array.isArray(payload.data)) {
          eventsData = payload.data;
          setEvents(eventsData);
        } else if (Array.isArray(payload)) {
          eventsData = payload;
          setEvents(eventsData);
        }
        
        // Set random 5 suggestions once on load
        if (eventsData.length > 0) {
          const randomEvents = [...eventsData].sort(() => 0.5 - Math.random()).slice(0, 5);
          setRandomSuggestions(randomEvents);
        }
      } catch (err) {
        console.error('Error fetching events for search:', err);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch once on mount
    fetchAllEvents();
    
    // Load search history from localStorage
    const savedHistory = localStorage.getItem('eventSearchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (err) {
        console.error('Error parsing search history:', err);
      }
    }
  }, []);

  // Remove Vietnamese diacritics for better search
  const removeVietnameseDiacritics = (str) => {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };

  // Build absolute image URL from relative path
  const buildImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `http://localhost:5000${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  // Pre-normalize events data for faster search (cache normalized strings)
  const normalizedEvents = useMemo(() => {
    return events.map(event => ({
      ...event,
      _normalizedTitle: removeVietnameseDiacritics((event.title || '').toLowerCase()),
      _normalizedDescription: removeVietnameseDiacritics((event.description || '').toLowerCase()),
      _normalizedCategory: removeVietnameseDiacritics((event.category || '').toLowerCase()),
      _normalizedLocation: removeVietnameseDiacritics((event.location || '').toLowerCase())
    }));
  }, [events]);

  // Filter events based on input value - use useMemo for performance
  const filteredEvents = useMemo(() => {
    if (!inputValue || inputValue.trim() === '') {
      // If empty, prioritize search history over random suggestions
      if (searchHistory.length > 0) {
        return searchHistory.slice(0, 5); // Show last 5 viewed events
      }
      // If no history, return cached random 5 events
      return randomSuggestions;
    }

    // If has input, filter by search term (case-insensitive, Vietnamese diacritics-insensitive)
    const searchLower = removeVietnameseDiacritics(inputValue.toLowerCase().trim());
    
    // Fast search using pre-normalized data
    return normalizedEvents.filter(event => {
      return event._normalizedTitle.includes(searchLower) ||
             event._normalizedDescription.includes(searchLower) ||
             event._normalizedCategory.includes(searchLower) ||
             event._normalizedLocation.includes(searchLower);
    }).slice(0, 10); // Limit to 10 results
  }, [inputValue, normalizedEvents, randomSuggestions, searchHistory]);

  const handleEventSelect = useCallback((event, newValue) => {
    if (newValue && typeof newValue === 'object') {
      // Save to search history
      const eventId = newValue.eventId || newValue.id;
      setSearchHistory(prevHistory => {
        // Remove if already exists to avoid duplicates
        const filteredHistory = prevHistory.filter(item => (item.eventId || item.id) !== eventId);
        // Add to beginning and limit to 10 items
        const newHistory = [newValue, ...filteredHistory].slice(0, 10);
        // Save to localStorage
        localStorage.setItem('eventSearchHistory', JSON.stringify(newHistory));
        return newHistory;
      });
      
      // If selecting an event object, navigate to event detail
      if (onEventSelect) {
        onEventSelect(newValue);
      } else {
        navigate(`/event/${eventId}`);
      }
      setOpen(false);
      setInputValue('');
    }
  }, [onEventSelect, navigate]);

  const handleInputChange = useCallback((event, newInputValue, reason) => {
    setInputValue(newInputValue);
    
    // DON'T call onSearchChange here to avoid triggering HomePage fetch
    // SearchAutocomplete is standalone and only affects dropdown suggestions
    
    // Open dropdown when typing
    if (reason === 'input') {
      if (newInputValue !== '') {
        setOpen(true);
      } else {
        setOpen(false);
      }
    }
  }, []);
  
  // Memoize customPopper to prevent re-renders
  const customPopper = useCallback((props) => {
    // Get the anchor width to match the search input
    const anchorWidth = props.anchorEl?.offsetWidth;
    
    return (
      <Popper 
        {...props} 
        placement="bottom-start"
        style={{ 
          width: anchorWidth ? `${anchorWidth}px` : '100%',
          minWidth: 600
        }}
      />
    );
  }, []);

  // Handler to clear search history
  const handleClearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem('eventSearchHistory');
  }, []);

  // Custom ListboxComponent with header for search history
  const CustomListboxComponent = React.useMemo(() => {
    const ListboxWithHeader = React.forwardRef(({ children, ...other }, ref) => {
      const isShowingHistory = searchHistory.length > 0 && !inputValue;
      
      return (
        <Box ref={ref} {...other}>
          {isShowingHistory && (
            <ListSubheader 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5, 
                py: 0.5,
                px: 2,
                fontSize: '0.7rem',
                fontWeight: 500,
                textTransform: 'none',
                color: 'text.secondary',
                backgroundColor: 'transparent',
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}
            >
              <HistoryIcon sx={{ fontSize: '0.875rem' }} />
              Đã xem gần đây
            </ListSubheader>
          )}
          {children}
        </Box>
      );
    });
    
    ListboxWithHeader.displayName = 'ListboxWithHeader';
    
    return ListboxWithHeader;
  }, [searchHistory, inputValue]);

  return (
    <Autocomplete
      freeSolo
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      loading={loading}
      options={filteredEvents}
      getOptionLabel={(option) => {
        if (typeof option === 'string') return option;
        return option.title || '';
      }}
      onInputChange={handleInputChange}
      onChange={handleEventSelect}
      inputValue={inputValue}
      value={searchTerm}
      PopperComponent={customPopper}
      ListboxComponent={CustomListboxComponent}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Tìm kiếm sự kiện..."
          size="small"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {searchHistory.length > 0 && !inputValue && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearHistory();
                    }}
                    sx={{ mr: 0.5 }}
                    title="Xóa lịch sử tìm kiếm"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => {
        // Build proper image URL for event
        const rawImage = option.eventDetails?.backgroundImage || option.backgroundImage;
        const imageUrl = buildImageUrl(rawImage);
        
        return (
          <Box 
            component="li" 
            {...props} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              py: 1.5,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            <Avatar
              src={imageUrl}
              variant="rounded"
              sx={{ 
                width: 80, 
                height: 50, 
                objectFit: 'cover',
                bgcolor: 'primary.light',
                flexShrink: 0
              }}
              imgProps={{
                onError: (e) => {
                  e.currentTarget.style.display = 'none';
                }
              }}
            >
              <EventIcon />
            </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {option.title}
            </Typography>
            {option.category && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <EventIcon fontSize="inherit" />
                {option.category}
              </Typography>
            )}
            {option.location && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <LocationOn fontSize="inherit" />
                {option.location}
              </Typography>
            )}
            {option.startTime && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <AccessTime fontSize="inherit" />
                {new Date(option.startTime).toLocaleDateString('vi-VN')}
              </Typography>
            )}
          </Box>
        </Box>
        );
      }}
      filterOptions={(options, state) => {
        // Custom filtering - already filtered by getFilteredEvents
        return options;
      }}
      sx={sx || {
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
          backgroundColor: 'background.paper',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
          '&.Mui-focused': {
            backgroundColor: 'background.paper',
          }
        }
      }}
    />
  );
};

export default SearchAutocomplete;
