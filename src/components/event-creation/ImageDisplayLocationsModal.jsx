import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Paper,
  Divider
} from '@mui/material';
import {
  Image as ImageIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const ImageDisplayLocationsModal = ({ open, onClose, images }) => {
  const { eventImage, backgroundImage, organizerLogo } = images || {};

  const imageLocations = [
    {
      name: 'Ảnh sự kiện chính',
      field: 'eventImage',
      image: eventImage,
      description: 'Ảnh này sẽ hiển thị ở:',
      locations: [
        'Card sự kiện trên trang chủ',
        'Header của trang chi tiết sự kiện',
        'Thumbnail trong danh sách sự kiện',
        'Social media khi chia sẻ'
      ],
      recommendedSize: '720x958 px',
      format: 'JPG, PNG (tối ưu: JPG)'
    },
    {
      name: 'Ảnh nền sự kiện',
      field: 'backgroundImage',
      image: backgroundImage,
      description: 'Ảnh này sẽ hiển thị ở:',
      locations: [
        'Nền trang chi tiết sự kiện',
        'Hero banner trên trang event',
        'Background overlay khi xem ticket'
      ],
      recommendedSize: '1280x720 px',
      format: 'JPG, PNG'
    },
    {
      name: 'Logo ban tổ chức',
      field: 'organizerLogo',
      image: organizerLogo,
      description: 'Logo sẽ hiển thị ở:',
      locations: [
        'Trang chi tiết sự kiện (cùng với thông tin organizer)',
        'Email thông báo',
        'Ticket PDF (nếu có)',
        'Xác nhận đơn hàng'
      ],
      recommendedSize: '275x275 px',
      format: 'PNG (nền trong suốt) hoặc JPG'
    }
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ImageIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Vị trí hiển thị các ảnh
          </Typography>
        </Box>
        <Button
          onClick={onClose}
          sx={{ minWidth: 'auto', p: 0.5 }}
          color="inherit"
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, px: 3 }}>
        <Grid container spacing={3}>
          {imageLocations.map((item, index) => (
            <Grid item xs={12} md={4} key={item.field}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: item.image ? '2px solid' : '1px solid',
                  borderColor: item.image ? 'success.main' : 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                {/* Image Preview */}
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: 200,
                    bgcolor: 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}
                >
                  {item.image ? (
                    <>
                      <CardMedia
                        component="img"
                        image={`http://localhost:5000${item.image}`}
                        alt={item.name}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'success.main',
                          borderRadius: '50%',
                          p: 0.5
                        }}
                      >
                        <CheckCircleIcon sx={{ color: 'white', fontSize: 20 }} />
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <ImageIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Chưa có ảnh
                      </Typography>
                    </Box>
                  )}
                </Box>

                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    {item.name}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Kích thước đề xuất:</strong> {item.recommendedSize}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Định dạng:</strong> {item.format}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    {item.description}
                  </Typography>

                  <Box component="ul" sx={{ m: 0, pl: 2, mb: 2 }}>
                    {item.locations.map((location, idx) => (
                      <li key={idx}>
                        <Typography variant="body2" color="text.secondary">
                          {location}
                        </Typography>
                      </li>
                    ))}
                  </Box>

                  {item.image && (
                    <Box
                      sx={{
                        mt: 'auto',
                        pt: 2,
                        borderTop: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Paper
                        sx={{
                          p: 1,
                          bgcolor: 'success.light',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                        <Typography variant="caption" color="success.dark">
                          Đã upload
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Additional Tips */}
        <Paper
          sx={{
            mt: 3,
            p: 2,
            bgcolor: 'info.light',
            borderLeft: '4px solid',
            borderColor: 'info.main'
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            💡 Lưu ý:
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            <li>
              <Typography variant="body2">
                Nên sử dụng ảnh chất lượng cao để hiển thị đẹp trên mọi thiết bị
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                File ảnh nên dưới 5MB để tối ưu tốc độ tải trang
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Ảnh sẽ được tự động resize nhưng vẫn nên upload đúng kích thước đề xuất
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Logo nên có nền trong suốt (PNG) để hiển thị tốt trên mọi nền màu
              </Typography>
            </li>
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Đã hiểu
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageDisplayLocationsModal;

