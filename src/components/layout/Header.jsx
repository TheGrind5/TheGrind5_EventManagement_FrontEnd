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
  CircularProgress,
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
  Event as EventIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';

// Contexts & Services
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { walletAPI, eventsAPI } from '../../services/apiClient';
import { subscriptionHelpers } from '../../services/subscriptionService';
import { useNavigate } from 'react-router-dom';

// Components
import WishlistIcon from '../common/WishlistIcon';
import NotificationIcon from '../common/NotificationIcon';
import ThemeToggle from '../common/ThemeToggle';
import SearchAutocomplete from '../common/SearchAutocomplete';

const Header = ({ searchTerm, onSearchChange, onDropdownOpenChange }) => {
  const { user, logout } = useAuth();
  const { openLoginModal, openRegisterModal } = useModal();
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [dashboardMenuAnchor, setDashboardMenuAnchor] = useState(null);
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
      setWalletBalance(response.data.balance || 0);
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

  const handleDashboardMenuOpen = (event) => {
    setDashboardMenuAnchor(event.currentTarget);
  };

  const handleDashboardMenuClose = () => {
    setDashboardMenuAnchor(null);
  };

  return (
    <AppBar position="sticky" elevation={0} sx={{ 
      background: theme.palette.mode === 'dark' 
        ? '#000000' 
        : '#FFFFFF',
      borderBottom: `1px solid ${theme.palette.divider}`,
      color: 'text.primary',
      boxShadow: 'none',
      zIndex: theme.zIndex.appBar,
      width: '100%',
      maxWidth: '100vw',
      overflowX: 'hidden',
      left: 0,
      right: 0
    }}>
      <Toolbar sx={{ 
        minHeight: { xs: 70, md: 72 }, 
        height: { xs: 70, md: 72 },
        px: { xs: 2, md: 4 },
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        {/* Logo */}
        <Box
          component={Link}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexGrow: 0,
            textDecoration: 'none',
            mr: { xs: 2, md: 4 },
            transition: 'opacity 0.2s ease',
            '&:hover': {
              opacity: 0.8,
            }
          }}
        >
          <Box
            component="img"
            src="/brand-logo.png"
            alt="FUTicket Logo"
            sx={{
              height: { xs: 32, md: 40 },
              width: 'auto',
              objectFit: 'contain',
            }}
          />
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              color: 'primary.main',
              fontSize: { xs: '1.3rem', md: '1.6rem' },
              letterSpacing: '-0.02em',
            }}
          >
            FUTicket
          </Typography>
        </Box>

        {/* Desktop Navigation */}
        {!isMobile && (
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            alignItems: 'center',
            flexShrink: 0
          }}>
            <Button 
              component={Link} 
              to="/" 
              color="inherit"
              sx={{ 
                fontWeight: 600,
                textTransform: 'none',
                px: 2.5,
                py: 1,
                color: 'text.primary',
                fontSize: '0.95rem',
                borderRadius: 1.5,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 122, 0, 0.12)' 
                    : 'rgba(255, 122, 0, 0.08)',
                  color: 'primary.main',
                }
              }}
            >
              Home
            </Button>
            {user && (
              <>
                {/* Dashboard Button - Dropdown chỉ khi có sự kiện, nút thường khi chưa có sự kiện */}
                {!checkingEvents && hasEvents ? (
                  <Box>
                    <Button 
                      onClick={handleDashboardMenuOpen}
                      color="inherit"
                      sx={{ 
                        fontWeight: 600,
                        textTransform: 'none',
                        px: 2.5,
                        py: 1,
                        color: 'text.primary',
                        fontSize: '0.95rem',
                        borderRadius: 1.5,
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 122, 0, 0.12)' 
                            : 'rgba(255, 122, 0, 0.08)',
                          color: 'primary.main',
                        }
                      }}
                    >
                      Dashboard
                    </Button>
                    <Menu
                      anchorEl={dashboardMenuAnchor}
                      open={Boolean(dashboardMenuAnchor)}
                      onClose={handleDashboardMenuClose}
                      MenuListProps={{
                        'aria-labelledby': 'dashboard-button',
                        onMouseLeave: handleDashboardMenuClose
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
                        onClick={() => { handleDashboardMenuClose(); }} 
                        component={Link} 
                        to="/dashboard"
                      >
                        <DashboardIcon sx={{ mr: 1 }} />
                        Dashboard
                      </MenuItem>
                      <MenuItem 
                        onClick={() => { handleDashboardMenuClose(); }} 
                        component={Link} 
                        to="/host-dashboard"
                      >
                        <EventIcon sx={{ mr: 1 }} />
                        Host Dashboard
                      </MenuItem>
                    </Menu>
                  </Box>
                ) : (
                  <Button 
                    component={Link}
                    to="/dashboard"
                    color="inherit"
                    sx={{ 
                      fontWeight: 600,
                      textTransform: 'none',
                      px: 2.5,
                      py: 1,
                      color: 'text.primary',
                      fontSize: '0.95rem',
                      borderRadius: 1.5,
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 122, 0, 0.12)' 
                          : 'rgba(255, 122, 0, 0.08)',
                        color: 'primary.main',
                      }
                    }}
                  >
                    Dashboard
                  </Button>
                )}
                <Button 
                  component={Link} 
                  to="/my-tickets" 
                  color="inherit"
                  sx={{ 
                    fontWeight: 600,
                    textTransform: 'none',
                    px: 2.5,
                    py: 1,
                    color: 'text.primary',
                    fontSize: '0.95rem',
                    borderRadius: 1.5,
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 122, 0, 0.12)' 
                        : 'rgba(255, 122, 0, 0.08)',
                      color: 'primary.main',
                    }
                  }}
                >
                  My Tickets
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
            mx: 2,
            width: { md: 300, lg: 350 },
            maxWidth: 400,
            flex: '0 1 auto',
            flexShrink: 0
          }}>
            <SearchAutocomplete
              searchTerm={searchTerm}
              onSearchChange={onSearchChange}
              onDropdownOpenChange={onDropdownOpenChange}
              sx={{
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: theme.palette.mode === 'dark'
                    ? '#1A1A1A'
                    : '#F8F8F8',
                  border: '1px solid transparent',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? '#242424'
                      : '#EBEBEB',
                    border: `1px solid ${theme.palette.mode === 'dark' ? '#2A2A2A' : '#E0E0E0'}`
                  },
                  '&.Mui-focused': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? '#242424'
                      : '#FFFFFF',
                    border: `1px solid ${theme.palette.primary.main}`,
                  },
                  '& fieldset': {
                    border: 'none',
                  }
                },
                '& .MuiInputBase-input': {
                  color: 'text.primary',
                  fontSize: '0.9rem',
                  py: 1,
                  '&::placeholder': {
                    color: 'text.secondary',
                    opacity: 0.7,
                  }
                }
              }}
            />
          </Box>
        )}

        {/* Right side actions */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          ml: 'auto',
          flexShrink: 0
        }}>
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {user ? (
            <>
              {/* Notification Icon */}
              <NotificationIcon />
              
              {/* Wishlist Icon */}
              <WishlistIcon />
              
              {/* Create Event Button */}
              <Button
                variant="contained"
                onClick={async (e) => {
                  e.preventDefault();
                  // Use helper function to check subscription and navigate
                  await subscriptionHelpers.checkSubscriptionAndNavigate(navigate, user);
                }}
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  px: 2.5,
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  boxShadow: 'none',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    boxShadow: '0 6px 20px rgba(255, 122, 0, 0.3)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Tạo sự kiện
              </Button>
              
              {/* Wallet Balance */}
              <Chip
                icon={
                  balanceLoading ? (
                    <CircularProgress 
                      size={16} 
                      thickness={4}
                      sx={{ 
                        color: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 122, 0, 0.8)' 
                          : 'rgba(255, 122, 0, 0.9)',
                      }} 
                    />
                  ) : (
                    <Wallet sx={{ fontSize: '1.2rem' }} />
                  )
                }
                label={balanceLoading ? "Đang tải..." : formatCurrency(walletBalance)}
                component={Link}
                to="/wallet"
                clickable
                color="primary"
                variant="outlined"
                disabled={balanceLoading}
                sx={{ 
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  px: 2,
                  height: 40,
                  borderWidth: 2,
                  borderColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 122, 0, 0.4)' 
                    : 'rgba(255, 122, 0, 0.6)',
                  opacity: balanceLoading ? 0.7 : 1,
                  '&:hover': {
                    backgroundColor: balanceLoading ? 'transparent' : 'primary.main',
                    color: balanceLoading ? 'inherit' : 'white',
                    borderColor: balanceLoading 
                      ? (theme.palette.mode === 'dark' ? 'rgba(255, 122, 0, 0.4)' : 'rgba(255, 122, 0, 0.6)')
                      : 'primary.main',
                    transform: balanceLoading ? 'none' : 'translateY(-2px)',
                    boxShadow: balanceLoading ? 'none' : '0 6px 12px rgba(255, 122, 0, 0.25)',
                  },
                  transition: 'all 0.2s ease',
                  cursor: balanceLoading ? 'wait' : 'pointer'
                }}
              />
              
              {/* User Menu */}
              <IconButton
                onClick={handleUserMenuOpen}
                edge="end"
                aria-label="account of current user"
                color="inherit"
                sx={{
                  width: 44,
                  height: 44,
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.04)',
                    transform: 'scale(1.05)'
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
                    fontSize: '0.95rem'
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
                onClick={openLoginModal}
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
                Đăng nhập
              </Button>
              <Button 
                onClick={openRegisterModal}
                variant="contained" 
                sx={{ 
                  ml: 1,
                  fontWeight: 600,
                  px: 3,
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(255, 122, 0, 0.25)',
                  }
                }}
              >
                Đăng ký
              </Button>
            </>
          )}

          {/* Mobile Search & Menu */}
          {isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Mobile Search */}
              <Box sx={{ width: 120 }}>
                <SearchAutocomplete
                  searchTerm={searchTerm}
                  onSearchChange={onSearchChange}
                />
              </Box>
              
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
