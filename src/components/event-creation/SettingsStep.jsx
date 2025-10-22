import React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid
} from '@mui/material';

const SettingsStep = ({ data, onChange }) => {
  const handleInputChange = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Cài đặt sự kiện
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Event Settings */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Cài đặt sự kiện
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái sự kiện</InputLabel>
                <Select
                  value={data.eventStatus || 'Draft'}
                  label="Trạng thái sự kiện"
                  onChange={(e) => handleInputChange('eventStatus', e.target.value)}
                >
                  <MenuItem value="Draft">Bản nháp</MenuItem>
                  <MenuItem value="Published">Đã xuất bản</MenuItem>
                  <MenuItem value="Cancelled">Đã hủy</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Mức độ ưu tiên</InputLabel>
                <Select
                  value={data.priority || 'Normal'}
                  label="Mức độ ưu tiên"
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                >
                  <MenuItem value="Low">Thấp</MenuItem>
                  <MenuItem value="Normal">Bình thường</MenuItem>
                  <MenuItem value="High">Cao</MenuItem>
                  <MenuItem value="Urgent">Khẩn cấp</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Card>

        {/* Registration Settings */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Cài đặt đăng ký
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Số lượng người tham gia tối đa"
                type="number"
                value={data.maxAttendees || ''}
                onChange={(e) => handleInputChange('maxAttendees', parseInt(e.target.value) || 0)}
                fullWidth
                placeholder="VD: 100"
                helperText="Để trống nếu không giới hạn"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Thời gian đăng ký trước (giờ)"
                type="number"
                value={data.registrationDeadline || ''}
                onChange={(e) => handleInputChange('registrationDeadline', parseInt(e.target.value) || 0)}
                fullWidth
                placeholder="VD: 24"
                helperText="Số giờ trước khi sự kiện bắt đầu"
              />
            </Grid>
          </Grid>
        </Card>

        {/* Notification Settings */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Cài đặt thông báo
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email liên hệ"
                type="email"
                value={data.contactEmail || ''}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                fullWidth
                placeholder="VD: contact@example.com"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Số điện thoại liên hệ"
                value={data.contactPhone || ''}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                fullWidth
                placeholder="VD: 0123456789"
              />
            </Grid>
          </Grid>
        </Card>

        {/* Additional Settings */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Cài đặt bổ sung
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Ghi chú nội bộ"
                value={data.internalNotes || ''}
                onChange={(e) => handleInputChange('internalNotes', e.target.value)}
                fullWidth
                multiline
                rows={3}
                placeholder="Ghi chú chỉ dành cho ban tổ chức..."
                helperText="Ghi chú này chỉ hiển thị cho ban tổ chức"
              />
            </Grid>
          </Grid>
        </Card>
      </Box>
    </Box>
  );
};

export default SettingsStep;
