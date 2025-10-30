import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Alert,
  Divider
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import StageEditor from './StageEditor';

const VirtualStageStep = ({ data, onChange, ticketTypes }) => {
  const [hasVirtualStage, setHasVirtualStage] = useState(data?.hasVirtualStage || false);
  const [layout, setLayout] = useState(data?.layout || null);

  const handleToggle = (event) => {
    const newValue = event.target.checked;
    setHasVirtualStage(newValue);
    
    if (!newValue) {
      setLayout(null);
    }
    
    onChange({
      ...data,
      hasVirtualStage: newValue,
      layout: newValue ? layout : null
    });
  };

  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout);
    onChange({
      ...data,
      hasVirtualStage: true,
      layout: newLayout
    });
  };

  return (
    <Box>
      <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
        Tính năng sân khấu ảo cho phép bạn tạo bản đồ 2D của venue để người mua vé có thể chọn khu vực một cách trực quan.
      </Alert>

      <FormControlLabel
        control={
          <Switch
            checked={hasVirtualStage}
            onChange={handleToggle}
            color="primary"
          />
        }
        label={
          <Typography variant="h6">
            Sử dụng sân khấu ảo 2D cho sự kiện này
          </Typography>
        }
        sx={{ mb: 3 }}
      />

      {hasVirtualStage && (
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Thiết kế Sân Khấu
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          {ticketTypes && ticketTypes.length > 0 ? (
            <StageEditor
              layout={layout}
              onChange={handleLayoutChange}
              ticketTypes={ticketTypes.map((ticket, index) => ({
                ...ticket,
                ticketTypeId: ticket.ticketTypeId || index + 1
              }))}
            />
          ) : (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Vui lòng thêm loại vé trước khi thiết kế sân khấu. Quay lại bước trước để thêm vé.
            </Alert>
          )}
        </Paper>
      )}

      {!hasVirtualStage && (
        <Paper sx={{ p: 3, mt: 2, bgcolor: 'grey.50' }}>
          <Typography variant="body2" color="text.secondary">
            Bạn có thể bật tính năng này sau bằng cách chỉnh sửa sự kiện.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default VirtualStageStep;

