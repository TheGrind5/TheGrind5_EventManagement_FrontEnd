import React, { useCallback, memo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Divider
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';

const DateTimeTicketStep = ({ data, onChange }) => {
  const validateTicketName = (name) => {
    if (!name || name.trim().length < 2) {
      return 'Tên loại vé phải có ít nhất 2 ký tự';
    }
    
    if (name.trim().length > 100) {
      return 'Tên loại vé không được quá 100 ký tự';
    }
    
    // Kiểm tra ký tự không phù hợp
    const invalidChars = ['<', '>', '&', '"', "'", '\\', '/', ';', '=', '(', ')', '[', ']', '{', '}'];
    if (invalidChars.some(char => name.includes(char))) {
      return 'Tên loại vé chứa ký tự không hợp lệ';
    }
    
    // Kiểm tra nội dung không phù hợp
    const inappropriateWords = ['cặc', 'lỏ', 'địt', 'đụ', 'đéo', 'chó', 'lồn', 'buồi', 'cứt'];
    const lowerName = name.toLowerCase();
    if (inappropriateWords.some(word => lowerName.includes(word))) {
      return 'Tên loại vé chứa nội dung không phù hợp. Vui lòng sử dụng tên phù hợp.';
    }
    
    return null; // Không có lỗi
  };

  const handleInputChange = useCallback((field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  }, [data, onChange]);

  const handleTicketTypeChange = useCallback((index, field, value) => {
    const newTicketTypes = [...data.ticketTypes];
    newTicketTypes[index] = {
      ...newTicketTypes[index],
      [field]: value
    };
    
    handleInputChange('ticketTypes', newTicketTypes);
  }, [data.ticketTypes, handleInputChange]);

  const addTicketType = useCallback(() => {
    const newTicketType = {
      typeName: '',
      price: 0,
      quantity: 0,
      minOrder: 1,
      maxOrder: 10,
      saleStart: new Date().toISOString(),
      saleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    };
    
    handleInputChange('ticketTypes', [...data.ticketTypes, newTicketType]);
  }, [data.ticketTypes, handleInputChange]);

  const removeTicketType = useCallback((index) => {
    const newTicketTypes = data.ticketTypes.filter((_, i) => i !== index);
    handleInputChange('ticketTypes', newTicketTypes);
  }, [data.ticketTypes, handleInputChange]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Thời gian và loại vé
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Date and Time Section */}
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Thời gian sự kiện
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Thời gian bắt đầu"
                  value={data.startTime ? new Date(data.startTime) : null}
                  onChange={(newValue) => {
                    handleInputChange('startTime', newValue ? newValue.toISOString() : '');
                  }}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Thời gian kết thúc"
                  value={data.endTime ? new Date(data.endTime) : null}
                  onChange={(newValue) => {
                    handleInputChange('endTime', newValue ? newValue.toISOString() : '');
                  }}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>
            </Grid>
          </Card>

          {/* Ticket Types Section */}
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Loại vé
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={addTicketType}
              >
                Thêm loại vé
              </Button>
            </Box>

            {data.ticketTypes.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <Typography variant="body1">
                  Chưa có loại vé nào. Nhấn "Thêm loại vé" để bắt đầu.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {data.ticketTypes.map((ticket, index) => (
                  <Card key={index} variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Loại vé {index + 1}
                        </Typography>
                        <IconButton
                          color="error"
                          onClick={() => removeTicketType(index)}
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Tên loại vé"
                            value={ticket.typeName}
                            onChange={(e) => handleTicketTypeChange(index, 'typeName', e.target.value)}
                            fullWidth
                            required
                            placeholder="VD: Vé thường, Vé VIP"
                            error={!!validateTicketName(ticket.typeName)}
                            helperText={validateTicketName(ticket.typeName)}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Giá vé (VND)"
                            type="number"
                            value={ticket.price}
                            onChange={(e) => handleTicketTypeChange(index, 'price', parseInt(e.target.value) || 0)}
                            fullWidth
                            required
                            inputProps={{ min: 0 }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Số lượng vé"
                            type="number"
                            value={ticket.quantity}
                            onChange={(e) => handleTicketTypeChange(index, 'quantity', parseInt(e.target.value) || 0)}
                            fullWidth
                            required
                            inputProps={{ min: 1 }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Đơn hàng tối thiểu"
                            type="number"
                            value={ticket.minOrder}
                            onChange={(e) => handleTicketTypeChange(index, 'minOrder', parseInt(e.target.value) || 1)}
                            fullWidth
                            required
                            inputProps={{ min: 1 }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Đơn hàng tối đa"
                            type="number"
                            value={ticket.maxOrder}
                            onChange={(e) => handleTicketTypeChange(index, 'maxOrder', parseInt(e.target.value) || 10)}
                            fullWidth
                            inputProps={{ min: 1 }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Card>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default memo(DateTimeTicketStep);
