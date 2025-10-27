import React, { useState } from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Slider,
  Alert
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const StageViewer = ({ layout, ticketTypes, onAreaClick }) => {
  const [selectedArea, setSelectedArea] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const [zoom, setZoom] = useState(1);

  if (!layout || !layout.hasVirtualStage || !layout.areas || layout.areas.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Sự kiện này không có sân khấu ảo
        </Typography>
      </Paper>
    );
  }

  const handleAreaClick = (area) => {
    setSelectedArea(area);
    setDialogOpen(true);
    setQuantity(0);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedArea(null);
    setQuantity(0);
  };

  const handleConfirmSelection = () => {
    if (quantity > 0 && selectedArea && onAreaClick) {
      onAreaClick({
        area: selectedArea,
        quantity: quantity
      });
    }
    handleDialogClose();
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  const handleZoomChange = (event, newValue) => {
    setZoom(newValue);
  };

  const ticketType = selectedArea?.ticketTypeId 
    ? ticketTypes?.find(t => t?.ticketTypeId === selectedArea.ticketTypeId)
    : null;

  const canvasWidth = layout.canvasWidth || 1000;
  const canvasHeight = layout.canvasHeight || 700;

  return (
    <Box>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Chọn Khu Vực</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton size="small" onClick={handleZoomOut}>
              <ZoomOutIcon />
            </IconButton>
            <Slider
              value={zoom}
              onChange={handleZoomChange}
              min={0.5}
              max={2}
              step={0.1}
              sx={{ width: 150 }}
            />
            <IconButton size="small" onClick={handleZoomIn}>
              <ZoomInIcon />
            </IconButton>
            <IconButton size="small" onClick={handleResetZoom}>
              <RefreshIcon />
            </IconButton>
            <Typography variant="body2" color="text.secondary">
              {Math.round(zoom * 100)}%
            </Typography>
          </Box>
        </Box>

        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
          Bấm vào khu vực để chọn vé. Bạn chỉ có thể chọn vé trong 1 khu vực.
        </Alert>

        <Box
          sx={{
            border: '2px solid #e0e0e0',
            borderRadius: 2,
            overflow: 'auto',
            bgcolor: '#f5f5f5',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`
          }}
        >
          <Stage
            width={canvasWidth}
            height={canvasHeight}
          >
            <Layer>
              {layout.areas.map((area) => {
                const ticketInfo = ticketTypes?.find(t => t?.ticketTypeId === area.ticketTypeId);
                // Handle both lowercase and uppercase coordinate properties
                const getCoordX = (c) => c.x !== undefined ? c.x : c.X;
                const getCoordY = (c) => c.y !== undefined ? c.y : c.Y;
                
                return (
                  <Group key={area.id}>
                    <Rect
                      x={Math.min(...area.coordinates.map(getCoordX))}
                      y={Math.min(...area.coordinates.map(getCoordY))}
                      width={Math.max(...area.coordinates.map(getCoordX)) - Math.min(...area.coordinates.map(getCoordX))}
                      height={Math.max(...area.coordinates.map(getCoordY)) - Math.min(...area.coordinates.map(getCoordY))}
                      fill={area.color}
                      opacity={0.6}
                      stroke="#fff"
                      strokeWidth={2}
                      onClick={() => handleAreaClick(area)}
                      onMouseEnter={(e) => {
                        e.target.opacity(0.8);
                      }}
                      onMouseLeave={(e) => {
                        e.target.opacity(0.6);
                      }}
                    />
                    <Text
                      x={Math.min(...area.coordinates.map(getCoordX)) + 10}
                      y={Math.min(...area.coordinates.map(getCoordY)) + 10}
                      text={area.name}
                      fontSize={14}
                      fill="#000"
                      fontStyle="bold"
                    />
                    {ticketInfo && (
                      <Text
                        x={Math.min(...area.coordinates.map(getCoordX)) + 10}
                        y={Math.min(...area.coordinates.map(getCoordY)) + 30}
                        text={`${ticketInfo.price?.toLocaleString('vi-VN')} ₫`}
                        fontSize={12}
                        fill="#000"
                      />
                    )}
                  </Group>
                );
              })}
            </Layer>
          </Stage>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Hãy chọn khu vực bạn muốn ngồi/đứng
        </Typography>
      </Paper>

      {/* Selection Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedArea?.name}
        </DialogTitle>
        <DialogContent>
          {ticketType ? (
            <Box>
              <Typography variant="body1" gutterBottom color="primary" fontWeight="bold">
                Loại vé: {ticketType.typeName}
              </Typography>
              <Typography variant="h6" color="primary" gutterBottom>
                Giá: {ticketType.price?.toLocaleString('vi-VN')} ₫
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedArea.isStanding ? 'Khu vực đứng' : 'Khu vực ngồi'}
              </Typography>
              
              {selectedArea.capacity && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Sức chứa: {selectedArea.capacity} người
                </Typography>
              )}
              
              <TextField
                fullWidth
                type="number"
                label="Số lượng vé"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                inputProps={{ min: 0, max: ticketType.quantity }}
                sx={{ mt: 2 }}
              />
              
              <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                Tổng tiền: {(quantity * ticketType.price).toLocaleString('vi-VN')} ₫
              </Typography>
            </Box>
          ) : (
            <Alert severity="warning">
              Khu vực này chưa được liên kết với loại vé nào
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Hủy</Button>
          <Button 
            onClick={handleConfirmSelection} 
            variant="contained"
            disabled={!ticketType || quantity <= 0}
          >
            Xác Nhận
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StageViewer;
