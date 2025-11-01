import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Stack,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  AutoAwesome as AIIcon,
  History as HistoryIcon,
  ChatBubble as ChatIcon,
  Event as EventIcon,
  AttachMoney as PricingIcon,
  Description as ContentIcon
} from '@mui/icons-material';
import { aiSuggestionAPI } from '../../services/aiSuggestionService';

const AIHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await aiSuggestionAPI.getHistory();
      // apiClient trả về { success, data: List<AISuggestionHistoryResponse>, message }
      if (response && response.data) {
        setHistory(Array.isArray(response.data) ? response.data : []);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error('Error fetching AI history:', err);
      setError('Không thể tải lịch sử AI');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'ChatbotQA':
        return <ChatIcon />;
      case 'EventRecommendation':
        return <EventIcon />;
      case 'PricingSuggestion':
        return <PricingIcon />;
      case 'ContentGeneration':
        return <ContentIcon />;
      default:
        return <AIIcon />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'ChatbotQA':
        return 'Chatbot Q&A';
      case 'EventRecommendation':
        return 'Gợi ý sự kiện';
      case 'PricingSuggestion':
        return 'Gợi ý giá vé';
      case 'ContentGeneration':
        return 'Tạo nội dung';
      default:
        return type;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'ChatbotQA':
        return 'primary';
      case 'EventRecommendation':
        return 'success';
      case 'PricingSuggestion':
        return 'warning';
      case 'ContentGeneration':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseJsonSafely = (jsonString) => {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch {
      return null;
    }
  };

  const renderHistoryItem = (item) => {
    const requestData = parseJsonSafely(item.requestData);
    const responseData = parseJsonSafely(item.responseData);

    return (
      <Accordion key={item.suggestionId}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}>
            <Box sx={{ color: `${getTypeColor(item.suggestionType)}.main` }}>
              {getTypeIcon(item.suggestionType)}
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {getTypeLabel(item.suggestionType)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDate(item.createdAt)}
              </Typography>
            </Box>
            <Chip
              label={getTypeLabel(item.suggestionType)}
              size="small"
              color={getTypeColor(item.suggestionType)}
              icon={getTypeIcon(item.suggestionType)}
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            {requestData && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Yêu cầu:
                  </Typography>
                  {item.suggestionType === 'ChatbotQA' && requestData.question && (
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2">{requestData.question}</Typography>
                    </Paper>
                  )}
                  {item.suggestionType === 'PricingSuggestion' && (
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2">
                        <strong>Danh mục:</strong> {requestData.category || 'N/A'}
                        <br />
                        <strong>Địa điểm:</strong> {requestData.location || 'N/A'}
                        <br />
                        <strong>Thời gian:</strong>{' '}
                        {requestData.startTime
                          ? new Date(requestData.startTime).toLocaleString('vi-VN')
                          : 'N/A'}
                      </Typography>
                    </Paper>
                  )}
                  {item.suggestionType === 'ContentGeneration' && (
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2">
                        <strong>Tiêu đề:</strong> {requestData.title || 'N/A'}
                        <br />
                        <strong>Danh mục:</strong> {requestData.category || 'N/A'}
                        <br />
                        <strong>Loại:</strong> {requestData.eventType || 'N/A'}
                      </Typography>
                    </Paper>
                  )}
                  {item.suggestionType === 'EventRecommendation' && (
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2">
                        Gợi ý sự kiện dựa trên lịch sử và sở thích của bạn
                      </Typography>
                    </Paper>
                  )}
                </Box>
              </>
            )}

            {responseData && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Phản hồi:
                  </Typography>
                  {item.suggestionType === 'ChatbotQA' && (
                    <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {responseData.answer || JSON.stringify(responseData, null, 2)}
                      </Typography>
                      {responseData.relatedLinks && responseData.relatedLinks.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Liên kết liên quan:
                          </Typography>
                          {responseData.relatedLinks.map((link, idx) => (
                            <Chip
                              key={idx}
                              label={link}
                              size="small"
                              sx={{ ml: 0.5, mt: 0.5 }}
                            />
                          ))}
                        </Box>
                      )}
                    </Paper>
                  )}
                  {item.suggestionType === 'EventRecommendation' && responseData.events && (
                    <Paper sx={{ p: 2, bgcolor: 'success.50' }}>
                      <Typography variant="body2">
                        Đã gợi ý {responseData.events.length} sự kiện
                      </Typography>
                      {responseData.reasoning && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          {responseData.reasoning}
                        </Typography>
                      )}
                    </Paper>
                  )}
                  {item.suggestionType === 'PricingSuggestion' && responseData.suggestedPrices && (
                    <Paper sx={{ p: 2, bgcolor: 'warning.50' }}>
                      <Typography variant="body2">
                        Đã đề xuất {responseData.suggestedPrices.length} mức giá
                      </Typography>
                      {responseData.analysis && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          {responseData.analysis}
                        </Typography>
                      )}
                    </Paper>
                  )}
                  {item.suggestionType === 'ContentGeneration' && (
                    <Paper sx={{ p: 2, bgcolor: 'info.50' }}>
                      <Typography variant="body2">
                        {responseData.description && '✓ Mô tả'}
                        {responseData.introduction && ' • Giới thiệu'}
                        {responseData.termsAndConditions && ' • Điều khoản'}
                        {responseData.specialExperience && ' • Trải nghiệm'}
                      </Typography>
                    </Paper>
                  )}
                </Box>
              </>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>
    );
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

  if (history.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <HistoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Chưa có lịch sử AI
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lịch sử các gợi ý và tương tác AI của bạn sẽ hiển thị tại đây
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <HistoryIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>
          Lịch sử AI
        </Typography>
        <Chip label={`${history.length} mục`} color="primary" />
      </Box>

      <Stack spacing={2}>
        {history.map((item) => renderHistoryItem(item))}
      </Stack>
    </Box>
  );
};

export default AIHistory;

