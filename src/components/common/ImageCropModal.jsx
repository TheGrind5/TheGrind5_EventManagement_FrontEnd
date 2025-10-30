import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Slider,
  Typography
} from '@mui/material';
import { ZoomIn, ZoomOut as ZoomOutIcon } from '@mui/icons-material';

const ImageCropModal = ({ open, onClose, imageSrc, aspectRatio, cropWidth, cropHeight, onCropComplete, fieldName }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = useCallback((crop) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteInternal = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      cropWidth,
      cropHeight
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.95
      );
    });
  };

  const createImage = (url) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });
  };

  const handleCrop = async () => {
    try {
      if (!croppedAreaPixels) {
        alert('Vui lòng chọn vùng cần crop');
        return;
      }
      
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([croppedImage], `cropped-${fieldName}-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });
      
      onCropComplete(file);
      handleClose();
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Có lỗi xảy ra khi crop ảnh: ' + error.message);
    }
  };

  const handleClose = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onClose();
  };

  const getFieldDisplayName = () => {
    switch (fieldName) {
      case 'eventImage':
        return 'Ảnh sự kiện';
      case 'backgroundImage':
        return 'Ảnh nền sự kiện';
      case 'organizerLogo':
        return 'Logo ban tổ chức';
      default:
        return 'Ảnh';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Crop {getFieldDisplayName()} ({cropWidth}x{cropHeight})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Di chuyển và zoom để chọn vùng mong muốn
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: 500,
            bgcolor: '#333',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteInternal}
            cropShape="rect"
            showGrid={true}
            restrictPosition={true}
            style={{
              containerStyle: {
                width: '100%',
                height: '100%',
                position: 'relative',
              },
            }}
          />
        </Box>
        
        <Box sx={{ mt: 3, px: 2 }}>
          <Typography variant="body2" gutterBottom>
            Zoom: {Math.round(zoom * 100)}%
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ZoomOutIcon color="action" />
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e, value) => onZoomChange(value)}
              sx={{ flex: 1 }}
            />
            <ZoomIn color="action" />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Hủy
        </Button>
        <Button onClick={handleCrop} variant="contained" color="primary">
          Xác nhận
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageCropModal;

