import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Checkbox,
  FormGroup,
  MenuItem,
  FormHelperText,
  Alert,
  useTheme
} from '@mui/material';
import {
  Email,
  Phone,
  TextFields,
  Numbers,
  CalendarToday,
  List,
  CheckBox
} from '@mui/icons-material';

/**
 * QuestionnaireForm Component
 * Display dynamic questionnaire based on event questions
 * 
 * @param {array} questions - Array of EventQuestion objects
 * @param {function} onAnswersChange - Callback when answers change
 * @param {object} initialAnswers - Initial answers object {questionId: answer}
 */
const QuestionnaireForm = ({ questions = [], onAnswersChange, initialAnswers = {} }) => {
  const theme = useTheme();
  const [answers, setAnswers] = useState(initialAnswers);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    // Call parent when answers change
    if (onAnswersChange) {
      onAnswersChange(answers);
    }
  }, [answers, onAnswersChange]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    // Validate on change
    const question = questions.find(q => q.questionId === questionId);
    if (question && question.isRequired && !value) {
      setErrors(prev => ({ ...prev, [questionId]: 'Câu trả lời bắt buộc' }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const handleBlur = (questionId) => {
    setTouched(prev => ({ ...prev, [questionId]: true }));
    
    // Validate required field
    const question = questions.find(q => q.questionId === questionId);
    if (question && question.isRequired && !answers[questionId]) {
      setErrors(prev => ({ ...prev, [questionId]: 'Câu trả lời bắt buộc' }));
    }
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone) => {
    return /^[0-9]{10,11}$/.test(phone.replace(/[\s\-]/g, ''));
  };

  const renderQuestion = (question) => {
    const questionType = question.questionType?.toLowerCase() || 'text';
    const hasError = errors[question.questionId] && touched[question.questionId];
    const showError = hasError && touched[question.questionId];

    const commonProps = {
      error: showError,
      helperText: showError ? errors[question.questionId] : '',
      required: question.isRequired,
      fullWidth: true
    };

    switch (questionType) {
      case 'email':
        return (
          <TextField
            key={question.questionId}
            type="email"
            label={question.questionText}
            placeholder={question.placeholder || 'nhap@email.com'}
            value={answers[question.questionId] || ''}
            onChange={(e) => {
              handleAnswerChange(question.questionId, e.target.value);
              if (e.target.value && !validateEmail(e.target.value)) {
                setErrors(prev => ({ ...prev, [question.questionId]: 'Email không hợp lệ' }));
              }
            }}
            onBlur={() => handleBlur(question.questionId)}
            InputProps={{
              startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            {...commonProps}
          />
        );

      case 'phone':
        return (
          <TextField
            key={question.questionId}
            type="tel"
            label={question.questionText}
            placeholder={question.placeholder || '0123456789'}
            value={answers[question.questionId] || ''}
            onChange={(e) => {
              handleAnswerChange(question.questionId, e.target.value);
              if (e.target.value && !validatePhone(e.target.value)) {
                setErrors(prev => ({ ...prev, [question.questionId]: 'Số điện thoại không hợp lệ' }));
              }
            }}
            onBlur={() => handleBlur(question.questionId)}
            InputProps={{
              startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            {...commonProps}
          />
        );

      case 'number':
        return (
          <TextField
            key={question.questionId}
            type="number"
            label={question.questionText}
            placeholder={question.placeholder || 'Nhập số'}
            value={answers[question.questionId] || ''}
            onChange={(e) => handleAnswerChange(question.questionId, e.target.value)}
            onBlur={() => handleBlur(question.questionId)}
            InputProps={{
              startAdornment: <Numbers sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            {...commonProps}
          />
        );

      case 'date':
        return (
          <TextField
            key={question.questionId}
            type="date"
            label={question.questionText}
            value={answers[question.questionId] || ''}
            onChange={(e) => handleAnswerChange(question.questionId, e.target.value)}
            onBlur={() => handleBlur(question.questionId)}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            {...commonProps}
          />
        );

      case 'radio':
        try {
          const options = JSON.parse(question.options || '[]');
          return (
            <FormControl key={question.questionId} error={showError} fullWidth>
              <FormLabel 
                required={question.isRequired}
                sx={{ 
                  mb: 1,
                  fontWeight: 600,
                  color: showError ? 'error.main' : 'text.primary'
                }}
              >
                {question.questionText}
              </FormLabel>
              <RadioGroup
                value={answers[question.questionId] || ''}
                onChange={(e) => handleAnswerChange(question.questionId, e.target.value)}
              >
                {options.map((option, index) => (
                  <FormControlLabel
                    key={index}
                    value={option}
                    control={<Radio />}
                    label={option}
                  />
                ))}
              </RadioGroup>
              {showError && (
                <FormHelperText>{errors[question.questionId]}</FormHelperText>
              )}
            </FormControl>
          );
        } catch (e) {
          console.error('Error parsing radio options:', e);
          return null;
        }

      case 'checkbox':
        try {
          const options = JSON.parse(question.options || '[]');
          const selectedValues = Array.isArray(answers[question.questionId]) 
            ? answers[question.questionId] 
            : [];
          
          return (
            <FormControl key={question.questionId} error={showError} fullWidth>
              <FormLabel 
                required={question.isRequired}
                sx={{ 
                  mb: 1,
                  fontWeight: 600,
                  color: showError ? 'error.main' : 'text.primary'
                }}
              >
                {question.questionText}
              </FormLabel>
              <FormGroup>
                {options.map((option, index) => (
                  <FormControlLabel
                    key={index}
                    control={
                      <Checkbox
                        checked={selectedValues.includes(option)}
                        onChange={(e) => {
                          const newValues = e.target.checked
                            ? [...selectedValues, option]
                            : selectedValues.filter(v => v !== option);
                          handleAnswerChange(question.questionId, newValues);
                        }}
                      />
                    }
                    label={option}
                  />
                ))}
              </FormGroup>
              {showError && (
                <FormHelperText>{errors[question.questionId]}</FormHelperText>
              )}
            </FormControl>
          );
        } catch (e) {
          console.error('Error parsing checkbox options:', e);
          return null;
        }

      case 'dropdown':
        try {
          const options = JSON.parse(question.options || '[]');
          return (
            <TextField
              key={question.questionId}
              select
              label={question.questionText}
              value={answers[question.questionId] || ''}
              onChange={(e) => handleAnswerChange(question.questionId, e.target.value)}
              onBlur={() => handleBlur(question.questionId)}
              InputProps={{
                startAdornment: <List sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              {...commonProps}
            >
              <MenuItem value="">Chọn...</MenuItem>
              {options.map((option, index) => (
                <MenuItem key={index} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          );
        } catch (e) {
          console.error('Error parsing dropdown options:', e);
          return null;
        }

      default: // 'text'
        return (
          <TextField
            key={question.questionId}
            type="text"
            label={question.questionText}
            placeholder={question.placeholder || 'Nhập câu trả lời của bạn'}
            value={answers[question.questionId] || ''}
            onChange={(e) => handleAnswerChange(question.questionId, e.target.value)}
            onBlur={() => handleBlur(question.questionId)}
            InputProps={{
              startAdornment: <TextFields sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            {...commonProps}
          />
        );
    }
  };

  if (!questions || questions.length === 0) {
    return (
      <Alert severity="info">
        Không có câu hỏi nào cho sự kiện này
      </Alert>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Bảng câu hỏi
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Vui lòng trả lời tất cả các câu hỏi bắt buộc (có dấu *)
      </Typography>

      {questions.map((question, index) => (
        <Box key={question.questionId}>
          {renderQuestion(question)}
        </Box>
      ))}
    </Box>
  );
};

export default QuestionnaireForm;

