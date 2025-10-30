import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Grid,
  Typography,
  IconButton,
  Divider,
  Chip,
  Slider,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Save as SaveIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Add as AddIcon
} from '@mui/icons-material';

const StageEditor = ({ layout, onChange, ticketTypes }) => {
  const [areas, setAreas] = useState(layout?.areas || []);
  const [selectedArea, setSelectedArea] = useState(null);
  const [drawingMode, setDrawingMode] = useState('rectangle');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentRect, setCurrentRect] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);
  
  const stageRef = useRef();
  const stageWidth = 1000;
  const stageHeight = 700;

  // Extended colors palette
  const colors = [
    '#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe',
    '#43e97b', '#fa709a', '#fee140', '#fa8bff', '#2bd2ff',
    '#ffecd2', '#fcb69f', '#ff9a9e', '#fecfef', '#C084FC',
    '#22D3EE', '#FBBF24', '#FB7185', '#34D399', '#818CF8'
  ];

  useEffect(() => {
    if (layout?.areas) {
      setAreas(layout.areas);
    }
  }, [layout]);

  useEffect(() => {
    console.log('Selected area changed:', selectedArea);
  }, [selectedArea]);

  useEffect(() => {
    console.log('Ticket types:', ticketTypes);
  }, [ticketTypes]);

  const handleStageClick = (e) => {
    const stage = e.target.getStage();
    if (e.target === stage) {
      // Clicked on empty space
      if (drawingMode === 'rectangle' && !isDrawing && !previewMode) {
        const pos = stage.getPointerPosition();
        setStartPos(pos);
        setIsDrawing(true);
        setCurrentRect({
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0
        });
      }
    }
  };

  const handleStageMouseMove = (e) => {
    if (isDrawing && startPos && drawingMode === 'rectangle' && !previewMode) {
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      setCurrentRect({
        x: Math.min(startPos.x, pos.x),
        y: Math.min(startPos.y, pos.y),
        width: Math.abs(pos.x - startPos.x),
        height: Math.abs(pos.y - startPos.y)
      });
    }
  };

  const handleStageMouseUp = () => {
    if (isDrawing && currentRect && currentRect.width > 10 && currentRect.height > 10 && !previewMode) {
      const newArea = {
        id: `area_${Date.now()}`,
        name: `Khu vực ${areas.length + 1}`,
        shape: 'rectangle',
        coordinates: [
          { x: currentRect.x, y: currentRect.y },
          { x: currentRect.x + currentRect.width, y: currentRect.y },
          { x: currentRect.x + currentRect.width, y: currentRect.y + currentRect.height },
          { x: currentRect.x, y: currentRect.y + currentRect.height }
        ],
        color: colors[areas.length % colors.length],
        ticketTypeId: null,
        isStanding: false,
        capacity: null,
        label: ''
      };
      
      setAreas([...areas, newArea]);
      onChange({
        ...layout,
        hasVirtualStage: true,
        canvasWidth: stageWidth,
        canvasHeight: stageHeight,
        areas: [...areas, newArea]
      });
    }
    
    setIsDrawing(false);
    setStartPos(null);
    setCurrentRect(null);
  };

  const handleAreaClick = (area) => {
    if (!previewMode) {
      console.log('Area clicked:', area);
      // Clone the area object to avoid reference issues
      setSelectedArea({ ...area });
    }
  };

  const handleAreaDragEnd = (areaId, newPos) => {
    if (previewMode) return;
    
    const updatedAreas = areas.map(area => {
      if (area.id === areaId) {
        // Calculate the offset from the original position
        const minX = Math.min(...area.coordinates.map(c => c.x));
        const minY = Math.min(...area.coordinates.map(c => c.y));
        const offsetX = newPos.x - minX;
        const offsetY = newPos.y - minY;
        
        // Update all coordinates with the offset
        return {
          ...area,
          coordinates: area.coordinates.map(coord => ({
            x: coord.x + offsetX,
            y: coord.y + offsetY
          }))
        };
      }
      return area;
    });
    
    setAreas(updatedAreas);
    onChange({
      ...layout,
      hasVirtualStage: true,
      canvasWidth: stageWidth,
      canvasHeight: stageHeight,
      areas: updatedAreas
    });
  };

  const handleUpdateArea = () => {
    if (!selectedArea) return;
    
    const updatedAreas = areas.map(area => 
      area.id === selectedArea.id ? selectedArea : area
    );
    
    setAreas(updatedAreas);
    onChange({
      ...layout,
      hasVirtualStage: true,
      canvasWidth: stageWidth,
      canvasHeight: stageHeight,
      areas: updatedAreas
    });
    
    setSelectedArea(null);
  };

  const handleDeleteArea = (areaId) => {
    const filteredAreas = areas.filter(area => area.id !== areaId);
    setAreas(filteredAreas);
    onChange({
      ...layout,
      hasVirtualStage: true,
      canvasWidth: stageWidth,
      canvasHeight: stageHeight,
      areas: filteredAreas
    });
    
    if (selectedArea?.id === areaId) {
      setSelectedArea(null);
    }
  };

  const handleReset = () => {
    setAreas([]);
    setSelectedArea(null);
    onChange({
      hasVirtualStage: true,
      canvasWidth: stageWidth,
      canvasHeight: stageHeight,
      areas: []
    });
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

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Stage Canvas */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Sân Khấu</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <ToggleButtonGroup
                  value={previewMode ? 'preview' : 'edit'}
                  exclusive
                  onChange={(e, value) => setPreviewMode(value === 'preview')}
                  size="small"
                >
                  <ToggleButton value="edit">
                    <EditIcon fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="preview">
                    <VisibilityIcon fontSize="small" />
                  </ToggleButton>
                </ToggleButtonGroup>
                
                {!previewMode && (
                  <>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => setDrawingMode('rectangle')}
                      disabled={drawingMode === 'rectangle'}
                    >
                      Vẽ
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleReset}
                    >
                      Xóa Tất Cả
                    </Button>
                  </>
                )}
              </Box>
            </Box>
            
            {/* Zoom Controls */}
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton size="small" onClick={handleZoomOut}>
                <ZoomOutIcon />
              </IconButton>
              <Slider
                value={zoom}
                onChange={handleZoomChange}
                min={0.5}
                max={2}
                step={0.1}
                sx={{ width: 200 }}
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
            
            <Box
              sx={{
                border: '2px solid #e0e0e0',
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: '#f5f5f5',
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                width: `${stageWidth}px`,
                height: `${stageHeight}px`
              }}
            >
              <Stage
                ref={stageRef}
                width={stageWidth}
                height={stageHeight}
                onClick={handleStageClick}
                onMouseMove={handleStageMouseMove}
                onMouseUp={handleStageMouseUp}
              >
                <Layer>
                  {/* Draw existing areas */}
                  {areas.map((area) => {
                    const minX = Math.min(...area.coordinates.map(c => c.x));
                    const minY = Math.min(...area.coordinates.map(c => c.y));
                    const maxX = Math.max(...area.coordinates.map(c => c.x));
                    const maxY = Math.max(...area.coordinates.map(c => c.y));
                    const width = maxX - minX;
                    const height = maxY - minY;
                    
                    return (
                      <Group key={area.id}>
                        <Rect
                          x={minX}
                          y={minY}
                          width={width}
                          height={height}
                          fill={area.color}
                          opacity={selectedArea?.id === area.id ? 0.8 : 0.5}
                          stroke={selectedArea?.id === area.id ? '#000' : '#fff'}
                          strokeWidth={selectedArea?.id === area.id ? 3 : 1}
                          onClick={() => handleAreaClick(area)}
                          draggable={!previewMode}
                          onDragEnd={(e) => {
                            const node = e.target;
                            handleAreaDragEnd(area.id, {
                              x: node.x(),
                              y: node.y()
                            });
                          }}
                        />
                        <Text
                          x={minX + 10}
                          y={minY + 10}
                          text={area.name}
                          fontSize={14}
                          fill="#000"
                          fontStyle="bold"
                        />
                      </Group>
                    );
                  })}
                  
                  {/* Draw current rectangle being drawn */}
                  {currentRect && !previewMode && (
                    <Rect
                      x={currentRect.x}
                      y={currentRect.y}
                      width={currentRect.width}
                      height={currentRect.height}
                      fill="#e0e0e0"
                      opacity={0.5}
                      stroke="#000"
                      strokeWidth={2}
                      dash={[5, 5]}
                    />
                  )}
                </Layer>
              </Stage>
            </Box>
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {previewMode ? 'Chế độ xem trước - Không thể chỉnh sửa' : (drawingMode === 'rectangle' ? 'Bấm và kéo để vẽ khu vực mới' : 'Chọn công cụ vẽ')}
            </Typography>
          </Paper>
        </Grid>

        {/* Properties Panel */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Thuộc Tính Khu Vực
            </Typography>
            
            {selectedArea ? (
              <Box>
                <TextField
                  fullWidth
                  label="Tên Khu Vực"
                  value={selectedArea.name}
                  onChange={(e) => setSelectedArea({ ...selectedArea, name: e.target.value })}
                  sx={{ mb: 2 }}
                />
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Loại Vé</InputLabel>
                  <Select
                    key={`select-${selectedArea.id}-${selectedArea.ticketTypeId}`}
                    value={selectedArea.ticketTypeId !== null && selectedArea.ticketTypeId !== undefined 
                      ? String(selectedArea.ticketTypeId)
                      : ''}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setSelectedArea(prevArea => {
                        const ticketTypeId = newValue !== '' ? Number(newValue) : null;
                        const updatedArea = { 
                          ...prevArea, 
                          ticketTypeId: ticketTypeId
                        };
                        console.log('Updated area with ticketTypeId:', updatedArea);
                        return updatedArea;
                      });
                    }}
                    label="Loại Vé"
                  >
                    <MenuItem value="">Không liên kết</MenuItem>
                    {ticketTypes && ticketTypes.map((ticket) => {
                      const ticketId = ticket?.ticketTypeId;
                      console.log('MenuItem ticket:', ticket, 'ID:', ticketId);
                      return (
                        <MenuItem key={ticketId} value={String(ticketId)}>
                          {ticket.typeName} - {ticket.price?.toLocaleString('vi-VN')} ₫
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
                
                {/* Color Picker */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Màu sắc
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {colors.map((color) => (
                      <Tooltip key={color} title={color}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: color,
                            borderRadius: 1,
                            border: selectedArea.color === color ? '3px solid #000' : '1px solid #ccc',
                            cursor: 'pointer',
                            '&:hover': {
                              transform: 'scale(1.1)',
                              boxShadow: 2
                            }
                          }}
                          onClick={() => setSelectedArea({ ...selectedArea, color })}
                        />
                      </Tooltip>
                    ))}
                  </Box>
                  <TextField
                    fullWidth
                    type="color"
                    value={selectedArea.color}
                    onChange={(e) => setSelectedArea({ ...selectedArea, color: e.target.value })}
                    sx={{ mt: 1 }}
                  />
                </Box>
                
                <TextField
                  fullWidth
                  type="number"
                  label="Sức chứa (tùy chọn)"
                  value={selectedArea.capacity || ''}
                  onChange={(e) => setSelectedArea({ ...selectedArea, capacity: e.target.value ? parseInt(e.target.value) : null })}
                  sx={{ mb: 2 }}
                />
                
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleUpdateArea}
                  sx={{ mb: 2 }}
                >
                  Lưu Thay Đổi
                </Button>
                
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDeleteArea(selectedArea.id)}
                >
                  Xóa Khu Vực
                </Button>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Chọn một khu vực trên sân khấu để chỉnh sửa
              </Typography>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              Danh Sách Khu Vực ({areas.length})
            </Typography>
            
            {areas.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Chưa có khu vực nào
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {areas.map((area) => (
                  <Chip
                    key={area.id}
                    label={area.name}
                    onClick={() => handleAreaClick(area)}
                    color={selectedArea?.id === area.id ? 'primary' : 'default'}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StageEditor;
