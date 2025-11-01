import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  Star as StarIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import EventCard from '../ui/EventCard';
import { aiSuggestionAPI } from '../../services/aiSuggestionService';

const EventRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [reasoning, setReasoning] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // apiClient trả về { success, data: EventRecommendationResponse, message }
      // EventRecommendationResponse: { events: [], reasoning: "" }
      const response = await aiSuggestionAPI.getEventRecommendations();
      
      console.log('EventRecommendations response:', response);
      
      // Kiểm tra và lấy data từ response
      if (response && response.data) {
        const recommendationData = response.data;
        const events = recommendationData.events || [];
        const reasoning = recommendationData.reasoning || '';
        
        console.log('Extracted events:', events);
        console.log('Extracted reasoning:', reasoning);
        
        setRecommendations(events);
        setReasoning(reasoning);
      } else {
        console.error('Invalid response structure:', response);
        setError('Phản hồi từ server không đúng định dạng');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      console.error('Error details:', {
        message: err?.message,
        response: err?.response,
        responseData: err?.response?.data,
        status: err?.response?.status,
        code: err?.code
      });
      
      // Xử lý các loại lỗi khác nhau
      let errorMessage = 'Không thể tải gợi ý sự kiện';
      
      if (err?.code === 'ECONNREFUSED' || err?.code === 'ERR_NETWORK') {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy không.';
      } else if (err?.response?.status === 401) {
        errorMessage = 'Bạn cần đăng nhập để sử dụng tính năng này.';
      } else if (err?.response?.status === 403) {
        errorMessage = 'Chỉ khách hàng (Customer) mới có thể xem gợi ý sự kiện.';
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
          border: '1px solid',
          borderColor: 'primary.light'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ p: 1, bgcolor: 'primary.main', borderRadius: 2 }}>
            <AIIcon sx={{ color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Gợi ý dành cho bạn
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Dựa trên sở thích và lịch sử của bạn
            </Typography>
          </Box>
        </Box>

        {reasoning && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">{reasoning}</Typography>
          </Alert>
        )}
      </Paper>

      <Grid container spacing={3}>
        {recommendations.map((event) => (
          <Grid item xs={12} sm={6} md={4} key={event.eventId}>
            <Box sx={{ position: 'relative' }}>
              <EventCard event={event} />
              {event.similarityScore > 0 && (
                <Chip
                  icon={<StarIcon />}
                  label={`${Math.round(event.similarityScore * 100)}% phù hợp`}
                  size="small"
                  color="primary"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 1
                  }}
                />
              )}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default EventRecommendations;

