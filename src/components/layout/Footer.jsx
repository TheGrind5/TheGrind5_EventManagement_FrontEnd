// React & Router
import React from 'react';
import { Link } from 'react-router-dom';

// Material-UI Components
import {
  Box,
  Container,
  Grid,
  Typography,
  Stack,
  IconButton,
  Divider,
  useTheme
} from '@mui/material';

// Material-UI Icons
import {
  Facebook,
  Twitter,
  Instagram,
  LinkedIn,
  YouTube,
  Email,
  Phone,
  LocationOn
} from '@mui/icons-material';

/**
 * Footer Component - TicketBox Style
 * Professional footer with links, contact info, and social media
 */
const Footer = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    about: [
      { label: 'Về chúng tôi', path: '/about' },
      { label: 'Cách thức hoạt động', path: '/how-it-works' },
      { label: 'Tuyển dụng', path: '/careers' },
      { label: 'Báo chí', path: '/press' },
    ],
    support: [
      { label: 'Trung tâm trợ giúp', path: '/help' },
      { label: 'Liên hệ', path: '/contact' },
      { label: 'Điều khoản sử dụng', path: '/terms' },
      { label: 'Chính sách bảo mật', path: '/privacy' },
    ],
    organizers: [
      { label: 'Tạo sự kiện', path: '/create-event' },
      { label: 'Hướng dẫn tổ chức', path: '/organizer-guide' },
      { label: 'Công cụ quản lý', path: '/dashboard' },
      { label: 'Báo cáo & phân tích', path: '/analytics' },
    ],
  };

  const socialLinks = [
    { icon: <Facebook />, url: '#', label: 'Facebook' },
    { icon: <Twitter />, url: '#', label: 'Twitter' },
    { icon: <Instagram />, url: '#', label: 'Instagram' },
    { icon: <LinkedIn />, url: '#', label: 'LinkedIn' },
    { icon: <YouTube />, url: '#', label: 'YouTube' },
  ];

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: theme.palette.mode === 'dark'
          ? '#0A0A0A'
          : '#FFFFFF',
        borderTop: `1px solid ${theme.palette.divider}`,
        pt: 6,
        pb: 3,
        mt: 8
      }}
    >
      <Container maxWidth="xl">
        {/* Main Footer Content */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          {/* Company Info */}
          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Box
                  component="img"
                  src="/brand-logo.png"
                  alt="FUTicket Logo"
                  sx={{
                    height: 40,
                    width: 'auto',
                    objectFit: 'contain',
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: 'primary.main',
                    fontSize: '1.6rem',
                    letterSpacing: '-0.02em'
                  }}
                >
                  FUTicket
                </Typography>
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 320, lineHeight: 1.6 }}
              >
                Nền tảng tổ chức và tham gia sự kiện hàng đầu Việt Nam. 
                Khám phá và đăng ký tham gia những sự kiện thú vị nhất.
              </Typography>
              
              {/* Contact Info */}
              <Stack spacing={1} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    support@thegrind5.com
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Phone sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    1900 xxxx
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Hồ Chí Minh, Việt Nam
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Grid>

          {/* About Links */}
          <Grid item xs={6} sm={4} md={2}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                mb: 2,
                color: 'text.primary'
              }}
            >
              Về chúng tôi
            </Typography>
            <Stack spacing={1.5}>
              {footerLinks.about.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{ textDecoration: 'none' }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'primary.main',
                      },
                      transition: 'color 0.2s ease',
                      fontSize: '0.875rem'
                    }}
                  >
                    {link.label}
                  </Typography>
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Support Links */}
          <Grid item xs={6} sm={4} md={2}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                mb: 2,
                color: 'text.primary'
              }}
            >
              Hỗ trợ
            </Typography>
            <Stack spacing={1.5}>
              {footerLinks.support.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{ textDecoration: 'none' }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'primary.main',
                      },
                      transition: 'color 0.2s ease',
                      fontSize: '0.875rem'
                    }}
                  >
                    {link.label}
                  </Typography>
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Organizer Links */}
          <Grid item xs={6} sm={4} md={2}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                mb: 2,
                color: 'text.primary'
              }}
            >
              Dành cho BTC
            </Typography>
            <Stack spacing={1.5}>
              {footerLinks.organizers.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{ textDecoration: 'none' }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'primary.main',
                      },
                      transition: 'color 0.2s ease',
                      fontSize: '0.875rem'
                    }}
                  >
                    {link.label}
                  </Typography>
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Social Media */}
          <Grid item xs={6} sm={12} md={2}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                mb: 2,
                color: 'text.primary'
              }}
            >
              Kết nối với chúng tôi
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {socialLinks.map((social) => (
                <IconButton
                  key={social.label}
                  href={social.url}
                  aria-label={social.label}
                  sx={{
                    color: 'text.secondary',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    '&:hover': {
                      color: 'primary.main',
                      borderColor: 'primary.main',
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(61, 190, 41, 0.08)'
                        : 'rgba(61, 190, 41, 0.04)',
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  {social.icon}
                </IconButton>
              ))}
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Bottom Bar */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: '0.8125rem' }}
          >
            © {currentYear} FUTicket. All rights reserved.
          </Typography>
          
          <Stack direction="row" spacing={3}>
            <Link to="/terms" style={{ textDecoration: 'none' }}>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.8125rem',
                  '&:hover': {
                    color: 'primary.main',
                  },
                  transition: 'color 0.2s ease'
                }}
              >
                Điều khoản
              </Typography>
            </Link>
            <Link to="/privacy" style={{ textDecoration: 'none' }}>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.8125rem',
                  '&:hover': {
                    color: 'primary.main',
                  },
                  transition: 'color 0.2s ease'
                }}
              >
                Bảo mật
              </Typography>
            </Link>
            <Link to="/cookies" style={{ textDecoration: 'none' }}>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.8125rem',
                  '&:hover': {
                    color: 'primary.main',
                  },
                  transition: 'color 0.2s ease'
                }}
              >
                Cookies
              </Typography>
            </Link>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;

