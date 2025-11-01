import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  Close as CloseIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { aiSuggestionAPI } from '../../services/aiSuggestionService';

const ContentGeneratorWidget = ({ eventTitle, eventCategory, eventType, onGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeField, setActiveField] = useState(null);

  const generateContent = async (field) => {
    setLoading(true);
    setError(null);
    setActiveField(field);

    try {
      const response = await aiSuggestionAPI.generateContent({
        title: eventTitle,
        category: eventCategory,
        eventType: eventType
      });

      // apiClient trả về { success, data: ContentGenerationResponse, message }
      if (response && response.data) {
        setGeneratedContent(response.data);
      }
      
      // Show preview dialog
      setDialogOpen(true);
    } catch (err) {
      console.error('Error generating content:', err);
      setError('Không thể tạo nội dung');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleApply = (field, content) => {
    if (onGenerated && content) {
      onGenerated(field, content);
    }
    setDialogOpen(false);
  };

  const getFieldLabel = (field) => {
    const labels = {
      description: 'Mô tả sự kiện',
      introduction: 'Giới thiệu ngắn gọn',
      terms: 'Điều khoản và điều kiện',
      specialExperience: 'Trải nghiệm đặc biệt'
    };
    return labels[field] || field;
  };

  const getContentForField = (field) => {
    if (!generatedContent) return '';
    
    const mapping = {
      description: generatedContent.description,
      introduction: generatedContent.introduction,
      terms: generatedContent.termsAndConditions,
      specialExperience: generatedContent.specialExperience
    };
    
    return mapping[field] || '';
  };

  return (
    <>
      <Card sx={{ mb: 2, border: '1px solid', borderColor: 'primary.light' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ p: 1, bgcolor: 'primary.main', borderRadius: 1 }}>
              <AIIcon sx={{ color: 'white' }} />
            </Box>
            <Typography variant="subtitle1" fontWeight="bold">
              AI Content Generator
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {['description', 'introduction', 'terms', 'specialExperience'].map((field) => (
              <Button
                key={field}
                variant="outlined"
                size="small"
                onClick={() => generateContent(field)}
                disabled={loading}
                startIcon={loading && activeField === field ? <CircularProgress size={16} /> : <AIIcon />}
              >
                {getFieldLabel(field)}
              </Button>
            ))}
          </Box>

          {loading && activeField && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Đang tạo {getFieldLabel(activeField)} bằng AI...
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              {activeField && getFieldLabel(activeField)}
            </Typography>
            <IconButton onClick={() => setDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {activeField && generatedContent && (
            <TextField
              fullWidth
              multiline
              rows={12}
              value={getContentForField(activeField)}
              onChange={() => {}}
              InputProps={{
                readOnly: true
              }}
              sx={{ mb: 2 }}
            />
          )}
          <Alert severity="success">
            Nội dung đã được tạo tự động. Bạn có thể chỉnh sửa trước khi áp dụng.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Hủy
          </Button>
          <Button
            startIcon={<CopyIcon />}
            onClick={() => {
              const content = activeField && getContentForField(activeField);
              if (content) {
                handleCopyToClipboard(content);
              }
            }}
          >
            Sao chép
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              const content = activeField && getContentForField(activeField);
              if (content && activeField) {
                handleApply(activeField, content);
              }
            }}
          >
            Áp dụng
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ContentGeneratorWidget;

