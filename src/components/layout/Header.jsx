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
  Favorite
} from '@mui/icons-material';

// Contexts & Services
import { useAuth } from '../../contexts/AuthContext';
import { walletAPI } from '../../services/apiClient';

// Components
import WishlistIcon from '../common/WishlistIcon';
import ThemeToggle from '../common/ThemeToggle';

const Header = ({ searchTerm, onSearchChange }) => {
  const { user, logout } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (user) {
      fetchWalletBalance();
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

  return (
    <AppBar position="sticky" elevation={0} sx={{ 
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      color: 'text.primary'
    }}>
      <Toolbar>
        {/* Logo */}
        <Typography 
          variant="h6" 
          component={Link} 
          to="/"
          sx={{ 
            flexGrow: 0,
            fontWeight: 700,
            textDecoration: 'none',
            color: 'inherit',
            mr: 4
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
                fontWeight: 600,
                textTransform: 'none',
                px: 2
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
                    fontWeight: 600,
                    textTransform: 'none',
                    px: 2
                  }}
                >
                  Dashboard
                </Button>
                <Button 
                  component={Link} 
                  to="/my-tickets" 
                  color="inherit"
                  sx={{ 
                    fontWeight: 600,
                    textTransform: 'none',
                    px: 2
                  }}
                >
                  My Tickets
                </Button>
                <Button 
                  component={Link} 
                  to="/wishlist" 
                  color="inherit"
                  sx={{ 
                    fontWeight: 600,
                    textTransform: 'none',
                    px: 2
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
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    opacity: 1
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => onSearchChange && onSearchChange('')}
                      edge="end"
                      size="small"
                      sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                      <Clear />
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
                  borderRadius: 3,
                  fontWeight: 600,
                  px: 2,
                  py: 1,
                  textTransform: 'none',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Tạo sự kiện
              </Button>
              
              {/* Wallet Balance */}
              <Chip
                icon={<Wallet />}
                label={balanceLoading ? "Loading..." : formatCurrency(walletBalance)}
                component={Link}
                to="/wallet"
                clickable
                color="primary"
                variant="outlined"
                sx={{ 
                  borderRadius: 3,
                  fontWeight: 600,
                  px: 2,
                  py: 1,
                  '&:hover': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    transform: 'scale(1.05)'
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
              <Button component={Link} to="/login" color="inherit">
                Login
              </Button>
              <Button 
                component={Link} 
                to="/register" 
                variant="contained" 
                sx={{ ml: 1 }}
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
