import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { aiSuggestionAPI } from '../../services/aiSuggestionService';

const PricingSuggestionWidget = ({ eventCategory, eventStartTime, eventLocation, onApplyPricing }) => {
  const [suggestions, setSuggestions] = useState(null);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const handleGetSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await aiSuggestionAPI.getSuggestedPricing({
        category: eventCategory,
        startTime: eventStartTime,
        location: eventLocation
      });

      // apiClient trả về { success, data: PricingSuggestionResponse, message }
      if (response && response.data) {
        setSuggestions(response.data.suggestedPrices || []);
        setAnalysis(response.data.analysis || '');
      }
      setExpanded(true);
    } catch (err) {
      console.error('Error getting pricing suggestions:', err);
      setError('Không thể lấy gợi ý giá vé');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPricing = (ticketType) => {
    if (onApplyPricing) {
      onApplyPricing({
        typeName: ticketType.ticketType,
        price: ticketType.recommendedPrice
      });
    }
    setExpanded(false);
  };

  if (!eventCategory && !eventStartTime && !eventLocation) {
    return null;
  }

  return (
    <Card sx={{ mb: 2, border: '1px solid', borderColor: 'primary.light' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ p: 1, bgcolor: 'primary.main', borderRadius: 1 }}>
            <AIIcon sx={{ color: 'white' }} />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              AI Pricing Suggestion
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Nhận gợi ý giá vé tối ưu
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            onClick={handleGetSuggestions}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <AIIcon />}
          >
            {loading ? 'Đang tải...' : 'Lấy gợi ý'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {analysis && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">{analysis}</Typography>
          </Alert>
        )}

        {expanded && suggestions && suggestions.length > 0 && (
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
              Đề xuất giá:
            </Typography>
            <Grid container spacing={2}>
              {suggestions.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'primary.light',
                      borderRadius: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {item.ticketType}
                      </Typography>
                      <Chip
                        label="AI"
                        size="small"
                        color="primary"
                        sx={{ height: 20, fontSize: '0.65rem' }}
                      />
                    </Box>
                    
                    <Typography variant="h6" color="primary.main" sx={{ mb: 0.5 }}>
                      {new Intl.NumberFormat('vi-VN').format(item.recommendedPrice)} ₫
                    </Typography>
                    
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      {item.minPrice.toLocaleString('vi-VN')} - {item.maxPrice.toLocaleString('vi-VN')} ₫
                    </Typography>

                    {item.reasoning && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.75rem' }}>
                        {item.reasoning}
                      </Typography>
                    )}

                    <Button
                      fullWidth
                      variant="contained"
                      size="small"
                      onClick={() => handleApplyPricing(item)}
                      startIcon={<CheckIcon />}
                    >
                      Áp dụng
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <IconButton onClick={() => setExpanded(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PricingSuggestionWidget;

