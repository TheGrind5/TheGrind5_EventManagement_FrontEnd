import React, { useState, useEffect, useRef } from 'react';
import {
  Fab,
  Drawer,
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  CircularProgress,
  Avatar
} from '@mui/material';
import {
  SmartToy as AIIcon,
  Close as CloseIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { aiSuggestionAPI } from '../../services/aiSuggestionService';

const AIChatbot = ({ eventId = null }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = {
      text: inputValue,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      // apiClient trả về { success, data: ChatbotResponse, message }
      // ChatbotResponse: { answer: "", relatedLinks: [] }
      const response = await aiSuggestionAPI.askChatbot(inputValue, eventId);
      
      console.log('AIChatbot response:', response);
      
      // Kiểm tra và lấy data từ response
      if (response && response.data) {
        const chatbotData = response.data;
        const answer = chatbotData.answer || 'Xin lỗi, tôi không thể trả lời câu hỏi này.';
        const relatedLinks = chatbotData.relatedLinks || [];
        
        console.log('Extracted answer:', answer);
        console.log('Extracted relatedLinks:', relatedLinks);
        
        const botMessage = {
          text: answer,
          isBot: true,
          timestamp: new Date(),
          relatedLinks: relatedLinks
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        console.error('Invalid response structure:', response);
        throw new Error('Phản hồi từ server không đúng định dạng');
      }
    } catch (error) {
      console.error('AIChatbot error:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response,
        responseData: error?.response?.data,
        status: error?.response?.status,
        code: error?.code
      });
      
      // Xử lý các loại lỗi khác nhau
      let errorText = 'Xin lỗi, tôi gặp sự cố. Vui lòng thử lại sau.';
      
      if (error?.code === 'ECONNREFUSED' || error?.code === 'ERR_NETWORK') {
        errorText = 'Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy không.';
      } else if (error?.response?.status === 401) {
        errorText = 'Bạn cần đăng nhập để sử dụng AI Assistant.';
      } else if (error?.response?.data?.message) {
        errorText = error.response.data.message;
      } else if (error?.message) {
        errorText = error.message;
      }
      
      const errorMessage = {
        text: errorText,
        isBot: true,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <Fab
        color="primary"
        aria-label="Chat với AI"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5568d3 0%, #65368d 100%)'
          }
        }}
      >
        <AIIcon />
      </Fab>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 400 },
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default'
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ bgcolor: '#667eea' }}>
            <AIIcon />
          </Avatar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            AI Assistant
          </Typography>
          <IconButton onClick={() => setOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, bgcolor: 'background.default' }}>
          {messages.length === 0 && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4, opacity: 0.8 }}>
              Xin chào! Tôi là AI Assistant của TheGrind5. Tôi có thể giúp bạn với:
              <br />• Thông tin sự kiện
              <br />• Hướng dẫn mua vé
              <br />• Thanh toán và hoàn tiền
              <br />• Quản lý ví điện tử
            </Typography>
          )}
          
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: message.isBot ? 'flex-start' : 'flex-end',
                mb: 2
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  maxWidth: '75%',
                  bgcolor: message.isBot
                    ? message.isError
                      ? 'error.dark'
                      : 'grey.800'
                    : 'primary.dark',
                  color: message.isBot ? 'grey.100' : 'white',
                  borderRadius: 2,
                  boxShadow: 1
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {message.text}
                </Typography>
                {message.relatedLinks && message.relatedLinks.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {message.relatedLinks.map((link, linkIndex) => (
                      <Typography key={linkIndex} variant="caption" sx={{ display: 'block', opacity: 0.7 }}>
                        {link}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Paper>
            </Box>
          ))}

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'grey.800', borderRadius: 2 }}>
                <CircularProgress size={16} sx={{ color: 'grey.300' }} />
              </Paper>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Nhập câu hỏi..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={!inputValue.trim() || loading}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Drawer>
    </>
  );
};

export default AIChatbot;

