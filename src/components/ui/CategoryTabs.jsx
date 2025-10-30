// React
import React from 'react';

// Material-UI Components
import { 
  Box, 
  Tabs, 
  Tab, 
  Container,
  useTheme,
  useMediaQuery 
} from '@mui/material';

// Material-UI Icons
import {
  MusicNote,
  SportsBasketball,
  School,
  Business,
  TheaterComedy,
  Celebration,
  Category as CategoryIcon
} from '@mui/icons-material';

/**
 * CategoryTabs Component - TicketBox Style
 * Displays event categories as horizontal tabs
 * Wired to existing category filter state
 */
const CategoryTabs = ({ categories = [], selectedCategory, onCategoryChange }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Icon mapping for common categories
  const getCategoryIcon = (category) => {
    const lowerCategory = category?.toLowerCase() || '';
    
    if (lowerCategory.includes('music') || lowerCategory.includes('nhạc')) {
      return <MusicNote />;
    } else if (lowerCategory.includes('sport') || lowerCategory.includes('thể thao')) {
      return <SportsBasketball />;
    } else if (lowerCategory.includes('workshop') || lowerCategory.includes('hội thảo')) {
      return <School />;
    } else if (lowerCategory.includes('business') || lowerCategory.includes('doanh nghiệp')) {
      return <Business />;
    } else if (lowerCategory.includes('comedy') || lowerCategory.includes('hài kịch')) {
      return <TheaterComedy />;
    } else if (lowerCategory.includes('festival') || lowerCategory.includes('lễ hội')) {
      return <Celebration />;
    }
    return <CategoryIcon />;
  };

  const handleChange = (event, newValue) => {
    onCategoryChange(newValue);
  };

  // Don't render if no categories
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.mode === 'dark' 
          ? '#000000' 
          : '#FFFFFF',
        borderBottom: `1px solid ${theme.palette.divider}`,
        position: 'sticky',
        top: { xs: 60, md: 64 }, // Stick below header
        zIndex: 10,
      }}
    >
      <Container maxWidth="xl">
        <Tabs
          value={selectedCategory}
          onChange={handleChange}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons={isMobile ? 'auto' : false}
          allowScrollButtonsMobile
          sx={{
            minHeight: 48,
            '& .MuiTabs-indicator': {
              height: 2,
              backgroundColor: 'primary.main',
            },
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              color: 'text.secondary',
              px: isMobile ? 2 : 2.5,
              '&:hover': {
                color: 'primary.main',
              },
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 600,
              },
            },
            '& .MuiTabs-scrollButtons': {
              color: 'text.secondary',
              '&.Mui-disabled': {
                opacity: 0.3,
              },
            },
          }}
        >
          {/* All Categories Tab */}
          <Tab 
            value="all" 
            label="Tất cả"
            icon={<CategoryIcon sx={{ fontSize: '1.1rem' }} />}
            iconPosition="start"
          />
          
          {/* Dynamic Category Tabs */}
          {categories.map((category) => (
            <Tab
              key={category}
              value={category}
              label={category}
              icon={getCategoryIcon(category)}
              iconPosition="start"
              sx={{
                '& .MuiTab-iconWrapper': {
                  marginRight: 1,
                  marginBottom: 0,
                },
              }}
            />
          ))}
        </Tabs>
      </Container>
    </Box>
  );
};

export default CategoryTabs;

