// React & Router
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Material-UI Components
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton, 
  Menu, 
  MenuItem,
  Badge,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  useTheme,
  useMediaQuery
} from '@mui/material';

// Material-UI Icons
import { 
  Menu as MenuIcon, 
  AccountCircle, 
  Logout,
  Wallet,
  ConfirmationNumber as Ticket,
  Search,
  Clear,
  Favorite,
  Event as EventIcon
} from '@mui/icons-material';

// Contexts & Services
import { useAuth } from '../../contexts/AuthContext';
import { walletAPI, eventsAPI } from '../../services/apiClient';

// Components
import WishlistIcon from '../common/WishlistIcon';
import ThemeToggle from '../common/ThemeToggle';

const Header = ({ searchTerm, onSearchChange }) => {
  const { user, logout } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [ticketsMenuAnchor, setTicketsMenuAnchor] = useState(null);
  const [hasEvents, setHasEvents] = useState(false);
  const [checkingEvents, setCheckingEvents] = useState(true);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (user) {
      fetchWalletBalance();
      checkHasEvents();
    }
  }, [user]);

  const fetchWalletBalance = async () => {
    try {
      setBalanceLoading(true);
      const response = await walletAPI.getBalance();
      setWalletBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      // Don't show error to user in header, just log it
    } finally {
      setBalanceLoading(false);
    }
  };

  const checkHasEvents = async () => {
    try {
      setCheckingEvents(true);
      console.log('Checking for events...');
      const response = await eventsAPI.getMyEvents();
      console.log('Events API response:', response);
      console.log('Response data:', response.data);
      
      // Handle different response formats
      const eventsData = Array.isArray(response.data) ? response.data : [];
      console.log('Number of events:', eventsData.length);
      const hasEventsData = eventsData.length > 0;
      console.log('Has events result:', hasEventsData);
      setHasEvents(hasEventsData);
    } catch (error) {
      console.error('Error checking events:', error);
      setHasEvents(false);
    } finally {
      setCheckingEvents(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + '₫';
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleTicketsMenuOpen = (event) => {
    setTicketsMenuAnchor(event.currentTarget);
  };

  const handleTicketsMenuClose = () => {
    setTicketsMenuAnchor(null);
  };

  return (
    <AppBar position="sticky" elevation={0} sx={{ 
      background: theme.palette.mode === 'dark' 
        ? '#1A1A2E' 
        : '#FFFFFF',
      borderBottom: `1px solid ${theme.palette.divider}`,
      color: 'text.primary',
      boxShadow: 'none',
    }}>
      <Toolbar sx={{ minHeight: { xs: 60, md: 64 } }}>
        {/* Logo */}
        <Typography 
          variant="h6" 
          component={Link} 
          to="/"
          sx={{ 
            flexGrow: 0,
            fontWeight: 700,
            textDecoration: 'none',
            color: 'primary.main',
            mr: { xs: 2, md: 4 },
            fontSize: { xs: '1.1rem', md: '1.3rem' },
            letterSpacing: '-0.02em',
            transition: 'color 0.2s ease',
            '&:hover': {
              color: 'primary.dark',
            }
          }}
        >
          TheGrind5 Events
        </Typography>

        {/* Desktop Navigation */}
        {!isMobile && (
          <Box sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            gap: 3,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Button 
              component={Link} 
              to="/" 
              color="inherit"
              sx={{ 
                fontWeight: 500,
                textTransform: 'none',
                px: 2,
                color: 'text.primary',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(61, 190, 41, 0.08)' 
                    : 'rgba(61, 190, 41, 0.04)',
                  color: 'primary.main',
                }
              }}
            >
              Home
            </Button>
            {user && (
              <>
                <Button 
                  component={Link} 
                  to="/dashboard" 
                  color="inherit"
                  sx={{ 
                    fontWeight: 500,
                    textTransform: 'none',
                    px: 2,
                    color: 'text.primary',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(61, 190, 41, 0.08)' 
                        : 'rgba(61, 190, 41, 0.04)',
                      color: 'primary.main',
                    }
                  }}
                >
                  Dashboard
                </Button>
                <Box>
                  <Button 
                    onClick={handleTicketsMenuOpen}
                    color="inherit"
                    sx={{ 
                      fontWeight: 500,
                      textTransform: 'none',
                      px: 2,
                      color: 'text.primary',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(61, 190, 41, 0.08)' 
                          : 'rgba(61, 190, 41, 0.04)',
                        color: 'primary.main',
                      }
                    }}
                    endIcon={<Ticket />}
                  >
                    My Tickets
                  </Button>
                  <Menu
                    anchorEl={ticketsMenuAnchor}
                    open={Boolean(ticketsMenuAnchor)}
                    onClose={handleTicketsMenuClose}
                    MenuListProps={{
                      'aria-labelledby': 'tickets-button',
                      onMouseLeave: handleTicketsMenuClose
                    }}
                    PaperProps={{
                      sx: {
                        mt: 1,
                        minWidth: 200,
                        borderRadius: 2
                      }
                    }}
                  >
                    <MenuItem 
                      onClick={() => { handleTicketsMenuClose(); }} 
                      component={Link} 
                      to="/my-tickets"
                    >
                      <Ticket sx={{ mr: 1 }} />
                      My Tickets
                    </MenuItem>
                    {!checkingEvents && hasEvents && (
                      <MenuItem 
                        onClick={() => { handleTicketsMenuClose(); }} 
                        component={Link} 
                        to="/my-events"
                      >
                        <EventIcon sx={{ mr: 1 }} />
                        My Events
                      </MenuItem>
                    )}
                  </Menu>
                </Box>
                <Button 
                  component={Link} 
                  to="/wishlist" 
                  color="inherit"
                  sx={{ 
                    fontWeight: 500,
                    textTransform: 'none',
                    px: 2,
                    color: 'text.primary',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(61, 190, 41, 0.08)' 
                        : 'rgba(61, 190, 41, 0.04)',
                      color: 'primary.main',
                    }
                  }}
                >
                  Wishlist
                </Button>
              </>
            )}
          </Box>
        )}

        {/* Search Bar */}
        {!isMobile && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            mx: 3,
            minWidth: 300,
            maxWidth: 400
          }}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm sự kiện..."
              value={searchTerm || ''}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : '#F9FAFB',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.08)'
                      : '#F3F4F6',
                  },
                  '&.Mui-focused': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.08)'
                      : '#FFFFFF',
                  }
                },
                '& .MuiInputBase-input': {
                  color: 'text.primary',
                  fontSize: '0.875rem',
                  '&::placeholder': {
                    color: 'text.secondary',
                    opacity: 0.7,
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => onSearchChange && onSearchChange('')}
                      edge="end"
                      size="small"
                      sx={{ color: 'text.secondary' }}
                    >
                      <Clear fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        )}

        {/* Right side actions */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          ml: 'auto'
        }}>
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {user ? (
            <>
              {/* Wishlist Icon */}
              <WishlistIcon />
              
              {/* Create Event Button */}
              <Button
                component={Link}
                to="/create-event"
                variant="contained"
                sx={{
                  borderRadius: 2,
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(61, 190, 41, 0.25)',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Tạo sự kiện
              </Button>
              
              {/* Wallet Balance */}
              <Chip
                icon={<Wallet sx={{ fontSize: '1.1rem' }} />}
                label={balanceLoading ? "Loading..." : formatCurrency(walletBalance)}
                component={Link}
                to="/wallet"
                clickable
                color="primary"
                variant="outlined"
                sx={{ 
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  px: 1.5,
                  height: 36,
                  borderColor: theme.palette.mode === 'dark' 
                    ? 'rgba(61, 190, 41, 0.3)' 
                    : 'rgba(61, 190, 41, 0.5)',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    borderColor: 'primary.main',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 8px rgba(61, 190, 41, 0.2)',
                  },
                  transition: 'all 0.2s ease'
                }}
              />
              
              {/* User Menu */}
              <IconButton
                onClick={handleUserMenuOpen}
                size="large"
                edge="end"
                aria-label="account of current user"
                color="inherit"
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'scale(1.1)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <Avatar 
                  src={user?.avatar || undefined}
                  sx={{ 
                    width: 36, 
                    height: 36, 
                    bgcolor: 'primary.main',
                    fontWeight: 700,
                    fontSize: '1rem'
                  }}
                  imgProps={{ onError: (e) => { e.currentTarget.src = ''; } }}
                >
                  {!user?.avatar && (user?.fullName?.charAt(0) || 'U')}
                </Avatar>
              </IconButton>
              
              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 200,
                    borderRadius: 2,
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 8px 30px rgba(0, 0, 0, 0.3)' 
                      : '0 8px 30px rgba(0, 0, 0, 0.08)'
                  }
                }}
              >
                <MenuItem onClick={handleUserMenuClose} component={Link} to="/profile">
                  <AccountCircle sx={{ mr: 1 }} />
                  Profile
                </MenuItem>
                <MenuItem onClick={handleUserMenuClose} component={Link} to="/my-tickets">
                  <Ticket sx={{ mr: 1 }} />
                  My Tickets
                </MenuItem>
                <MenuItem onClick={handleUserMenuClose} component={Link} to="/wishlist">
                  <Favorite sx={{ mr: 1 }} />
                  Wishlist
                </MenuItem>
                <MenuItem onClick={() => { handleUserMenuClose(); logout(); }}>
                  <Logout sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button 
                component={Link} 
                to="/login" 
                color="inherit"
                sx={{
                  fontWeight: 500,
                  px: 2.5,
                  color: 'text.primary',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.04)',
                  }
                }}
              >
                Login
              </Button>
              <Button 
                component={Link} 
                to="/register" 
                variant="contained" 
                sx={{ 
                  ml: 1,
                  fontWeight: 600,
                  px: 3,
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(61, 190, 41, 0.25)',
                  }
                }}
              >
                Register
              </Button>
            </>
          )}

          {/* Mobile Search & Menu */}
          {isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Mobile Search */}
              <TextField
                placeholder="Tìm kiếm..."
                value={searchTerm || ''}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                size="small"
                sx={{
                  width: 120,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      border: '2px solid rgba(255, 255, 255, 0.5)'
                    }
                  },
                  '& .MuiInputBase-input': {
                    color: 'white',
                    fontSize: '0.875rem',
                    '&::placeholder': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      opacity: 1
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => onSearchChange && onSearchChange('')}
                        edge="end"
                        size="small"
                        sx={{ color: 'rgba(255, 255, 255, 0.7)', p: 0.5 }}
                      >
                        <Clear sx={{ fontSize: '0.875rem' }} />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              
              {/* Mobile Menu Button */}
              <IconButton
                size="large"
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
