import React, { useState, useCallback, memo } from 'react';
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
  Button,
  Grid,
  RadioGroup,
  FormControlLabel,
  Radio,
  InputAdornment,
  useTheme
} from '@mui/material';
import { CloudUpload, Image, Folder } from '@mui/icons-material';
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css';
import { eventsAPI } from '../../services/apiClient';
import DebouncedTextField from '../common/DebouncedTextField';

const EventInfoStep = ({ data, onChange }) => {
  const theme = useTheme();
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  

  const handleInputChange = useCallback((field, value) => {
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
    
    onChange({
      ...data,
      [field]: value
    });
  }, [data, errors, onChange]);

  const validateField = (field, value) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'venueName':
        if (!value || value.trim().length === 0) {
          newErrors.venueName = 'Tên địa điểm không được để trống';
        } else if (value.length < 3) {
          newErrors.venueName = 'Tên địa điểm phải có ít nhất 3 ký tự';
        } else {
          delete newErrors.venueName;
        }
        break;
        
      case 'province':
        if (!value || value.trim().length === 0) {
          newErrors.province = 'Vui lòng chọn tỉnh/thành';
        } else {
          delete newErrors.province;
        }
        break;
        
      case 'streetAddress':
        if (!value || value.trim().length === 0) {
          newErrors.streetAddress = 'Số nhà, đường không được để trống';
        } else if (value.length < 5) {
          newErrors.streetAddress = 'Địa chỉ phải có ít nhất 5 ký tự';
        } else {
          delete newErrors.streetAddress;
        }
        break;
        
      case 'location':
        if (data.eventMode === 'Online' && (!value || value.trim().length === 0)) {
          newErrors.location = 'Link sự kiện không được để trống';
        } else if (data.eventMode === 'Online' && value && !value.match(/^https?:\/\/.+/)) {
          newErrors.location = 'Link phải bắt đầu bằng http:// hoặc https://';
        } else {
          delete newErrors.location;
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldBlur = (field, value) => {
    validateField(field, value);
  };

  const handleImageUpload = async (file, field) => {
    try {
      setUploading(true);
      const response = await eventsAPI.uploadImage(file);
      handleInputChange(field, response.data.imageUrl);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload ảnh thất bại: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const categories = [
    'Entertainment',
    'Business',
    'Technology',
    'Art',
    'Education',
    'Sports',
    'Health',
    'Food',
    'Music',
    'Fashion'
  ];

  const provinces = [
    'Hà Nội',
    'TP. Hồ Chí Minh',
    'Đà Nẵng',
    'Hải Phòng',
    'Cần Thơ',
    'An Giang',
    'Bà Rịa - Vũng Tàu',
    'Bắc Giang',
    'Bắc Kạn',
    'Bạc Liêu',
    'Bắc Ninh',
    'Bến Tre',
    'Bình Định',
    'Bình Dương',
    'Bình Phước',
    'Bình Thuận',
    'Cà Mau',
    'Cao Bằng',
    'Đắk Lắk',
    'Đắk Nông',
    'Điện Biên',
    'Đồng Nai',
    'Đồng Tháp',
    'Gia Lai',
    'Hà Giang',
    'Hà Nam',
    'Hà Tĩnh',
    'Hải Dương',
    'Hậu Giang',
    'Hòa Bình',
    'Hưng Yên',
    'Khánh Hòa',
    'Kiên Giang',
    'Kon Tum',
    'Lai Châu',
    'Lâm Đồng',
    'Lạng Sơn',
    'Lào Cai',
    'Long An',
    'Nam Định',
    'Nghệ An',
    'Ninh Bình',
    'Ninh Thuận',
    'Phú Thọ',
    'Phú Yên',
    'Quảng Bình',
    'Quảng Nam',
    'Quảng Ngãi',
    'Quảng Ninh',
    'Quảng Trị',
    'Sóc Trăng',
    'Sơn La',
    'Tây Ninh',
    'Thái Bình',
    'Thái Nguyên',
    'Thanh Hóa',
    'Thừa Thiên Huế',
    'Tiền Giang',
    'Trà Vinh',
    'Tuyên Quang',
    'Vĩnh Long',
    'Vĩnh Phúc',
    'Yên Bái'
  ];

  // Dữ liệu quận/huyện theo tỉnh (cập nhật 2025)
  const getDistrictsByProvince = (province) => {
    const districtsData = {
      'Hà Nội': [
        'Quận Ba Đình', 'Quận Hoàn Kiếm', 'Quận Tây Hồ', 'Quận Long Biên', 'Quận Cầu Giấy',
        'Quận Đống Đa', 'Quận Hai Bà Trưng', 'Quận Hoàng Mai', 'Quận Thanh Xuân', 'Huyện Sóc Sơn',
        'Huyện Đông Anh', 'Huyện Gia Lâm', 'Quận Nam Từ Liêm', 'Huyện Thanh Trì', 'Quận Bắc Từ Liêm',
        'Huyện Mê Linh', 'Quận Hà Đông', 'Thị xã Sơn Tây', 'Huyện Ba Vì', 'Huyện Phúc Thọ',
        'Huyện Đan Phượng', 'Huyện Hoài Đức', 'Huyện Quốc Oai', 'Huyện Thạch Thất', 'Huyện Chương Mỹ',
        'Huyện Thanh Oai', 'Huyện Thường Tín', 'Huyện Phú Xuyên', 'Huyện Ứng Hòa', 'Huyện Mỹ Đức'
      ],
      'TP. Hồ Chí Minh': [
        'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8',
        'Quận 9', 'Quận 10', 'Quận 11', 'Quận 12', 'Quận Thủ Đức', 'Quận Gò Vấp', 'Quận Bình Thạnh',
        'Quận Tân Bình', 'Quận Tân Phú', 'Quận Phú Nhuận', 'Quận Huyện Bình Tân', 'Huyện Củ Chi',
        'Huyện Hóc Môn', 'Huyện Bình Chánh', 'Huyện Nhà Bè', 'Huyện Cần Giờ'
      ],
      'Đà Nẵng': [
        'Quận Hải Châu', 'Quận Thanh Khê', 'Quận Sơn Trà', 'Quận Ngũ Hành Sơn', 'Quận Liên Chiểu',
        'Quận Cẩm Lệ', 'Huyện Hòa Vang', 'Huyện Hoàng Sa'
      ],
      'Hải Phòng': [
        'Quận Hồng Bàng', 'Quận Ngô Quyền', 'Quận Lê Chân', 'Quận Hải An', 'Quận Kiến An',
        'Quận Đồ Sơn', 'Quận Dương Kinh', 'Huyện Thuỷ Nguyên', 'Huyện An Dương', 'Huyện An Lão',
        'Huyện Kiến Thuỵ', 'Huyện Tiên Lãng', 'Huyện Vĩnh Bảo', 'Huyện Cát Hải', 'Huyện Bạch Long Vĩ'
      ],
      'Cần Thơ': [
        'Quận Ninh Kiều', 'Quận Ô Môn', 'Quận Bình Thuỷ', 'Quận Cái Răng', 'Quận Thốt Nốt',
        'Huyện Vĩnh Thạnh', 'Huyện Cờ Đỏ', 'Huyện Phong Điền', 'Huyện Thới Lai'
      ],
      'Bắc Giang': [
        'Thành phố Bắc Giang', 'Huyện Yên Thế', 'Huyện Tân Yên', 'Huyện Lạng Giang', 'Huyện Lục Nam',
        'Huyện Lục Ngạn', 'Huyện Sơn Động', 'Huyện Yên Dũng', 'Huyện Việt Yên', 'Huyện Hiệp Hòa'
      ]
    };
    return districtsData[province] || [];
  };

  // Dữ liệu phường/xã theo quận/huyện (cập nhật 2025)
  const getWardsByDistrict = (district) => {
    const wardsData = {
      // Hà Nội
      'Quận Ba Đình': ['Phường Phúc Xá', 'Phường Trúc Bạch', 'Phường Vĩnh Phú', 'Phường Cống Vị', 'Phường Liễu Giai', 'Phường Nguyễn Trung Trực', 'Phường Quán Thánh', 'Phường Ngọc Hà', 'Phường Điện Biên', 'Phường Đội Cấn', 'Phường Ngọc Khánh', 'Phường Kim Mã', 'Phường Giảng Võ', 'Phường Thành Công'],
      'Quận Hoàn Kiếm': ['Phường Phúc Tân', 'Phường Đồng Xuân', 'Phường Hàng Mã', 'Phường Hàng Buồm', 'Phường Hàng Đào', 'Phường Hàng Bồ', 'Phường Cửa Đông', 'Phường Lý Thái Tổ', 'Phường Hàng Bạc', 'Phường Hàng Gai', 'Phường Chương Dương Độ', 'Phường Hàng Trống', 'Phường Cửa Nam', 'Phường Hàng Bông', 'Phường Lý Thái Tổ', 'Phường Hàng Tre', 'Phường Tràng Tiền'],
      
      // TP. Hồ Chí Minh
      'Quận 1': ['Phường Tân Định', 'Phường Đa Kao', 'Phường Bến Nghé', 'Phường Bến Thành', 'Phường Nguyễn Thái Bình', 'Phường Phạm Ngũ Lão', 'Phường Cầu Ông Lãnh', 'Phường Cô Giang', 'Phường Nguyễn Cư Trinh', 'Phường Cầu Kho'],
      
      // Đà Nẵng
      'Quận Hải Châu': ['Phường Thạch Thang', 'Phường Hải Châu I', 'Phường Hải Châu II', 'Phường Phước Ninh', 'Phường Hòa Thuận Tây', 'Phường Hòa Thuận Đông', 'Phường Nam Dương', 'Phường Bình Hiên', 'Phường Bình Thuận', 'Phường Hòa Cường Bắc', 'Phường Hòa Cường Nam'],
      
      // Bắc Giang
      'Thành phố Bắc Giang': ['Phường Trần Nguyên Hãn', 'Phường Ngô Quyền', 'Phường Hoàng Văn Thụ', 'Phường Trần Phú', 'Phường Lê Lợi', 'Phường Đa Mai', 'Phường Dĩnh Kế', 'Phường Xương Giang', 'Phường Thọ Xương', 'Phường Song Mai', 'Xã Đồng Sơn', 'Xã Song Khê', 'Xã Tân Mỹ'],
      'Huyện Lục Ngạn': ['Thị trấn Chũ', 'Xã Biển Động', 'Xã Biên Sơn', 'Xã Cấm Sơn', 'Xã Đèo Gia', 'Xã Đồng Cốc', 'Xã Giáp Sơn', 'Xã Hộ Đáp', 'Xã Hồng Giang', 'Xã Kiên Lao', 'Xã Kiên Thành', 'Xã Kim Sơn', 'Xã Mỹ An', 'Xã Nam Dương', 'Xã Nghĩa Hồ', 'Xã Phì Điền', 'Xã Phong Minh', 'Xã Phong Vân', 'Xã Phú Nhuận', 'Xã Phượng Sơn', 'Xã Quý Sơn', 'Xã Sơn Hải', 'Xã Tân Hoa', 'Xã Tân Lập', 'Xã Tân Mộc', 'Xã Tân Quang', 'Xã Tân Sơn', 'Xã Thanh Hải', 'Xã Trù Hựu', 'Xã Vô Tranh', 'Xã Yên Đức'],
      'Huyện Yên Thế': ['Thị trấn Bố Hạ', 'Thị trấn Cầu Gồ', 'Xã An Thượng', 'Xã Bố Hạ', 'Xã Canh Nậu', 'Xã Đồng Kỳ', 'Xã Đồng Lạc', 'Xã Đồng Tiến', 'Xã Đồng Vương', 'Xã Hương Vĩ', 'Xã Tam Hiệp', 'Xã Tam Tiến', 'Xã Tân Hiệp', 'Xã Tân Sỏi', 'Xã Tiến Thắng', 'Xã Xuân Lương'],
      'Huyện Tân Yên': ['Thị trấn Cao Thượng', 'Thị trấn Nhã Nam', 'Xã An Dương', 'Xã Cao Thượng', 'Xã Cao Xá', 'Xã Đại Hóa', 'Xã Hợp Đức', 'Xã Lam Cốt', 'Xã Lan Giới', 'Xã Liên Chung', 'Xã Liên Sơn', 'Xã Ngọc Châu', 'Xã Ngọc Lý', 'Xã Ngọc Thiện', 'Xã Ngọc Vân', 'Xã Nhã Nam', 'Xã Phúc Hòa', 'Xã Phúc Sơn', 'Xã Quang Tiến', 'Xã Quế Nham', 'Xã Song Vân', 'Xã Tân Trung', 'Xã Việt Lập', 'Xã Việt Ngọc', 'Xã Việt Yên'],
      'Huyện Lạng Giang': ['Thị trấn Vôi', 'Xã Bắc Lý', 'Xã Bình Sơn', 'Xã Cao Đức', 'Xã Đại Lâm', 'Xã Đào Mỹ', 'Xã Dương Đức', 'Xã Hương Lạc', 'Xã Hương Sơn', 'Xã Kép', 'Xã Mỹ Hà', 'Xã Mỹ Thái', 'Xã Nghĩa Hưng', 'Xã Phi Mô', 'Xã Quang Thịnh', 'Xã Tân Dĩnh', 'Xã Tân Hưng', 'Xã Tân Thanh', 'Xã Tân Thịnh', 'Xã Thái Đào', 'Xã Tiên Lục', 'Xã Xuân Hương', 'Xã Yên Mỹ'],
      'Huyện Lục Nam': ['Thị trấn Đồi Ngô', 'Xã Bình Sơn', 'Xã Cẩm Lý', 'Xã Chu Điện', 'Xã Cương Sơn', 'Xã Đông Hưng', 'Xã Đông Phú', 'Xã Huyền Sơn', 'Xã Khám Lạng', 'Xã Lan Mẫu', 'Xã Lục Sơn', 'Xã Nghĩa Phương', 'Xã Phương Sơn', 'Xã Tam Dị', 'Xã Thanh Lâm', 'Xã Tiên Hưng', 'Xã Tiên Nha', 'Xã Trường Giang', 'Xã Trường Sơn', 'Xã Vô Tranh', 'Xã Vũ Xá', 'Xã Yên Sơn'],
      'Huyện Sơn Động': ['Thị trấn An Châu', 'Xã An Châu', 'Xã An Lạc', 'Xã An Lập', 'Xã Bồng Am', 'Xã Cẩm Đàn', 'Xã Chiên Sơn', 'Xã Dương Hưu', 'Xã Giáo Liêm', 'Xã Hữu Sản', 'Xã Lệ Viễn', 'Xã Long Sơn', 'Xã Phúc Thắng', 'Xã Quế Sơn', 'Xã Thạch Sơn', 'Xã Thanh Luận', 'Xã Thanh Sơn', 'Xã Tuấn Đạo', 'Xã Tuấn Mậu', 'Xã Vân Sơn', 'Xã Vĩnh Khương', 'Xã Yên Định'],
      'Huyện Yên Dũng': ['Thị trấn Neo', 'Xã Cảnh Thụy', 'Xã Đồng Phúc', 'Xã Đồng Tâm', 'Xã Đồng Việt', 'Xã Đức Giang', 'Xã Hương Gián', 'Xã Lãng Sơn', 'Xã Lão Hộ', 'Xã Nham Sơn', 'Xã Nội Hoàng', 'Xã Quỳnh Sơn', 'Xã Tân An', 'Xã Tân Dân', 'Xã Tân Liễu', 'Xã Tân Mỹ', 'Xã Thắng Cương', 'Xã Tiến Dũng', 'Xã Tiền Phong', 'Xã Trí Yên', 'Xã Tư Mại', 'Xã Xuân Phú', 'Xã Yên Lư'],
      'Huyện Việt Yên': ['Thị trấn Bích Động', 'Xã Bích Sơn', 'Xã Hoàng Ninh', 'Xã Hương Mai', 'Xã Huyền Sơn', 'Xã Minh Đức', 'Xã Nghĩa Trung', 'Xã Ninh Sơn', 'Xã Quảng Minh', 'Xã Quang Châu', 'Xã Thượng Lan', 'Xã Tiên Sơn', 'Xã Trung Sơn', 'Xã Vân Hà', 'Xã Vân Trung', 'Xã Việt Tiến'],
      'Huyện Hiệp Hòa': ['Thị trấn Thắng', 'Xã Bắc Lý', 'Xã Châu Minh', 'Xã Đại Thành', 'Xã Danh Thắng', 'Xã Đoan Bái', 'Xã Đông Lỗ', 'Xã Đồng Tân', 'Xã Đức Thắng', 'Xã Hòa Sơn', 'Xã Hòa Thắng', 'Xã Hùng Sơn', 'Xã Hương Lâm', 'Xã Lương Phong', 'Xã Mai Đình', 'Xã Mai Trung', 'Xã Ngọc Sơn', 'Xã Quang Minh', 'Xã Thái Sơn', 'Xã Thanh Vân', 'Xã Thường Thắng', 'Xã Xuân Cẩm']
    };
    return wardsData[district] || [];
  };

  // const quillModules = {
  //   toolbar: [
  //     [{ 'header': [1, 2, 3, false] }],
  //     ['bold', 'italic', 'underline'],
  //     [{ 'color': [] }, { 'background': [] }],
  //     [{ 'align': [] }],
  //     [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  //     ['link', 'image'],
  //     ['clean']
  //   ],
  // };

  // const quillFormats = [
  //   'header', 'bold', 'italic', 'underline',
  //   'color', 'background', 'align',
  //   'list', 'bullet', 'link', 'image'
  // ];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
        Thông tin sự kiện
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Upload hình ảnh */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Image color="primary" />
            Upload hình ảnh <span style={{ color: 'red' }}>*</span>
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Button 
              variant="text" 
              color="primary" 
              sx={{ textDecoration: 'underline' }}
              onClick={() => {
                // TODO: Implement image display locations modal
                alert('Chức năng xem vị trí hiển thị ảnh sẽ được thêm sau');
              }}
            >
              Xem vị trí hiển thị các ảnh
            </Button>
          </Box>

          <Grid container spacing={3}>
            {/* Event Image */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  height: 200, 
                  cursor: 'pointer',
                  border: '2px dashed',
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover'
                  }
                }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleImageUpload(file, 'eventImage');
                    }
                  };
                  input.click();
                }}
              >
                {data.eventImage ? (
                  <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                    <img
                      src={`http://localhost:5000${data.eventImage}`}
                      alt="Event Image Preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        minWidth: 'auto',
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        padding: 0
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInputChange('eventImage', '');
                      }}
                    >
                      ×
                    </Button>
                  </Box>
                ) : (
                  <CardContent sx={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Thêm ảnh sự kiện để hiển thị ở các vị trí khác (720x958)
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ mt: 2 }}
                      disabled={uploading}
                      onClick={(e) => {
                        e.stopPropagation();
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleImageUpload(file, 'eventImage');
                          }
                        };
                        input.click();
                      }}
                    >
                      {uploading ? 'Đang upload...' : 'Chọn ảnh'}
                    </Button>
                  </CardContent>
                )}
              </Card>
            </Grid>

            {/* Background Image */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  height: 200, 
                  cursor: 'pointer',
                  border: '2px dashed',
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover'
                  }
                }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleImageUpload(file, 'backgroundImage');
                    }
                  };
                  input.click();
                }}
              >
                {data.backgroundImage ? (
                  <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                    <img
                      src={`http://localhost:5000${data.backgroundImage}`}
                      alt="Background Image Preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        minWidth: 'auto',
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        padding: 0
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInputChange('backgroundImage', '');
                      }}
                    >
                      ×
                    </Button>
                  </Box>
                ) : (
                  <CardContent sx={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Thêm ảnh nền sự kiện (1280x720)
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ mt: 2 }}
                      disabled={uploading}
                      onClick={(e) => {
                        e.stopPropagation();
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleImageUpload(file, 'backgroundImage');
                          }
                        };
                        input.click();
                      }}
                    >
                      {uploading ? 'Đang upload...' : 'Chọn ảnh'}
                    </Button>
                  </CardContent>
                )}
              </Card>
            </Grid>
          </Grid>
        </Card>

        {/* Tên sự kiện */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            Tên sự kiện <span style={{ color: 'red' }}>*</span>
          </Typography>
          
          <DebouncedTextField
            label="Tên sự kiện"
            value={data.title}
            onChange={(value) => handleInputChange('title', value)}
            fullWidth
            required
            variant="outlined"
            placeholder="Nhập tên sự kiện của bạn"
            inputProps={{ maxLength: 100 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Typography variant="caption" color="text.secondary">
                    {data.title?.length || 0}/100
                  </Typography>
                </InputAdornment>
              ),
            }}
          />
        </Card>

        {/* Địa chỉ sự kiện */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            Địa chỉ sự kiện <span style={{ color: 'red' }}>*</span>
          </Typography>
          
          <RadioGroup
            value={data.eventMode}
            onChange={(e) => handleInputChange('eventMode', e.target.value)}
            sx={{ mb: 3 }}
          >
            <FormControlLabel 
              value="Offline" 
              control={<Radio />} 
              label="Sự kiện Offline" 
            />
            <FormControlLabel 
              value="Online" 
              control={<Radio />} 
              label="Sự kiện Online" 
            />
          </RadioGroup>

          {data.eventMode === 'Offline' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Tên địa điểm */}
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Tên địa điểm <span style={{ color: 'red' }}>*</span>
                </Typography>
                <DebouncedTextField
                  value={data.venueName}
                  onChange={(value) => handleInputChange('venueName', value)}
                  onBlur={(e) => handleFieldBlur('venueName', e.target.value)}
                  fullWidth
                  required
                  placeholder="Tên địa điểm (VD: Trung tâm Hội nghị Quốc gia, Nhà hát lớn Hà Nội)"
                  inputProps={{ maxLength: 80 }}
                  error={!!errors.venueName}
                  helperText={errors.venueName}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography variant="caption" color="text.secondary">
                          {data.venueName?.length || 0}/80
                        </Typography>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Địa chỉ chi tiết */}
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Địa chỉ chi tiết <span style={{ color: 'red' }}>*</span>
                </Typography>
                
                
                <Grid container spacing={2}>
                  {/* Tỉnh/Thành */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required error={!!errors.province}>
                      <InputLabel id="province-label">Tỉnh/Thành *</InputLabel>
                      <Select
                        key={`province-${data.province || 'empty'}`}
                        labelId="province-label"
                        value={data.province || ''}
                        label="Tỉnh/Thành *"
                        onChange={(e) => {
                          const selectedProvince = e.target.value;
                          const newData = {
                            ...data,
                            province: selectedProvince,
                            district: '',
                            ward: ''
                          };
                          onChange(newData);
                          validateField('province', selectedProvince);
                        }}
                      >
                        {provinces.map((province) => (
                          <MenuItem key={province} value={province}>
                            {province}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.province && (
                        <Typography variant="caption" color margin-top="8px">
                          {errors.province}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  
                  {/* Quận/Huyện */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id="district-label">Quận/Huyện</InputLabel>
                      <Select
                        key={`district-${data.district || 'empty'}`}
                        labelId="district-label"
                        value={data.district || ''}
                        label="Quận/Huyện"
                        onChange={(e) => {
                          const selectedDistrict = e.target.value;
                          const newData = {
                            ...data,
                            district: selectedDistrict,
                            ward: ''
                          };
                          onChange(newData);
                        }}
                        disabled={!data.province}
                      >
                        <MenuItem value="">
                          <em>Chọn quận/huyện</em>
                        </MenuItem>
                        {getDistrictsByProvince(data.province).map((district) => (
                          <MenuItem key={district} value={district}>
                            {district}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {/* Phường/Xã */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id="ward-label">Phường/Xã</InputLabel>
                      <Select
                        key={`ward-${data.ward || 'empty'}`}
                        labelId="ward-label"
                        value={data.ward || ''}
                        label="Phường/Xã"
                        onChange={(e) => {
                          const selectedWard = e.target.value;
                          const newData = {
                            ...data,
                            ward: selectedWard
                          };
                          onChange(newData);
                        }}
                        disabled={!data.district}
                      >
                        <MenuItem value="">
                          <em>Chọn phường/xã</em>
                        </MenuItem>
                        {getWardsByDistrict(data.district).map((ward) => (
                          <MenuItem key={ward} value={ward}>
                            {ward}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {/* Số nhà, đường */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Số nhà, đường *"
                      value={data.streetAddress}
                      onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                      onBlur={(e) => handleFieldBlur('streetAddress', e.target.value)}
                      fullWidth
                      required
                      placeholder="VD: 123 Đường Lê Duẩn"
                      inputProps={{ maxLength: 80 }}
                      error={!!errors.streetAddress}
                      helperText={errors.streetAddress}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Typography variant="caption" color="text.secondary">
                              {data.streetAddress?.length || 0}/80
                            </Typography>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  {/* Tòa nhà, tầng, phòng (optional) */}
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Tòa nhà"
                      value={data.building}
                      onChange={(e) => handleInputChange('building', e.target.value)}
                      fullWidth
                      placeholder="VD: Tòa A, Tòa B"
                      inputProps={{ maxLength: 50 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Tầng"
                      value={data.floor}
                      onChange={(e) => handleInputChange('floor', e.target.value)}
                      fullWidth
                      placeholder="VD: Tầng 2, Tầng 3"
                      inputProps={{ maxLength: 30 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Phòng/Sảnh"
                      value={data.room}
                      onChange={(e) => handleInputChange('room', e.target.value)}
                      fullWidth
                      placeholder="VD: Phòng 201, Sảnh A"
                      inputProps={{ maxLength: 50 }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Hiển thị địa chỉ đầy đủ */}
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Địa chỉ đầy đủ
                </Typography>
                <TextField
                  value={
                    (() => {
                      const parts = [];
                      if (data.streetAddress) parts.push(data.streetAddress);
                      if (data.building) parts.push(data.building);
                      if (data.floor) parts.push(data.floor);
                      if (data.room) parts.push(data.room);
                      if (data.ward) parts.push(data.ward);
                      if (data.district) parts.push(data.district);
                      if (data.province) parts.push(data.province);
                      return parts.join(', ');
                    })()
                  }
                  fullWidth
                  disabled
                  multiline
                  rows={3}
                  placeholder="Địa chỉ sẽ hiển thị ở đây khi bạn điền đầy đủ thông tin"
                  sx={{
                    '& .MuiInputBase-input': {
                      backgroundColor: 'action.hover',
                      color: 'text.secondary',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem'
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: 'text.disabled'
                    }
                  }}
                />
              </Box>

              {/* Thông tin bổ sung */}
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Thông tin bổ sung
                </Typography>
                <TextField
                  label="Ghi chú địa chỉ"
                  value={data.addressNote}
                  onChange={(e) => handleInputChange('addressNote', e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="VD: Cách bưu điện 100m, đối diện trường học, có bãi đỗ xe miễn phí..."
                  inputProps={{ maxLength: 200 }}
                  helperText="Thông tin hướng dẫn đến địa điểm (tùy chọn)"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {data.addressNote?.length || 0}/200
                        </Typography>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>
          )}

          {data.eventMode === 'Online' && (
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                Link sự kiện <span style={{ color: 'red' }}>*</span>
              </Typography>
              <TextField
                value={data.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                onBlur={(e) => handleFieldBlur('location', e.target.value)}
                fullWidth
                required
                placeholder="https://meet.google.com/abc-defg-hij"
                error={!!errors.location}
                helperText={errors.location || "Link Zoom, Google Meet, Microsoft Teams hoặc platform khác"}
                sx={{ mb: 2 }}
              />
              
              <TextField
                label="Mật khẩu phòng (nếu có)"
                value={data.meetingPassword}
                onChange={(e) => handleInputChange('meetingPassword', e.target.value)}
                fullWidth
                placeholder="Nhập mật khẩu nếu phòng có bảo vệ"
                helperText="Tùy chọn - chỉ điền nếu phòng họp có mật khẩu"
              />
            </Box>
          )}
        </Card>

        {/* Thể loại sự kiện */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            Thể loại sự kiện <span style={{ color: 'red' }}>*</span>
          </Typography>
          
          <FormControl fullWidth required>
            <InputLabel id="category-label">Vui lòng chọn</InputLabel>
            <Select
              labelId="category-label"
              value={data.category || ''}
              label="Vui lòng chọn"
              onChange={(e) => handleInputChange('category', e.target.value)}
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Card>

        {/* Thông tin sự kiện - Rich Text Editor */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            Thông tin sự kiện <span style={{ color: 'red' }}>*</span>
          </Typography>
          
          <TextField
            label="Thông tin chi tiết sự kiện"
            value={data.eventIntroduction || ''}
            onChange={(e) => handleInputChange('eventIntroduction', e.target.value)}
            fullWidth
            required
            multiline
            rows={12}
            placeholder="[Tóm tắt ngắn gọn về sự kiện: Nội dung chính của sự kiện, điểm đặc sắc nhất và lý do khiến người tham gia không nên bỏ lỡ]

Chi tiết sự kiện:
• Chương trình chính: [Liệt kê những hoạt động nổi bật trong sự kiện: các phần trình diễn, khách mời đặc biệt, lịch trình các tiết mục cụ thể nếu có.]
• Khách mời: [Thông tin về các khách mời đặc biệt, nghệ sĩ, diễn giả sẽ tham gia sự kiện. Có thể bao gồm phần mô tả ngắn gọn về họ và những gì họ sẽ mang lại cho sự kiện.]
• Trải nghiệm đặc biệt: [Nếu có các hoạt động đặc biệt khác như workshop, khu trải nghiệm, photo booth, khu vực check-in hay các phần quà/ưu đãi dành riêng cho người tham dự.]

Điều khoản và điều kiện:
• [TnC] sự kiện
• Lưu ý về điều khoản trẻ em
• Lưu ý về điều khoản VAT"
            inputProps={{ maxLength: 2000 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {data.eventIntroduction?.length || 0}/2000
                  </Typography>
                </InputAdornment>
              ),
            }}
          />
        </Card>

        {/* Thông tin ban tổ chức */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            Thông tin ban tổ chức <span style={{ color: 'red' }}>*</span>
          </Typography>
          
          <Grid container spacing={3}>
            {/* Organizer Logo Upload */}
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  height: 200, 
                  cursor: 'pointer',
                  border: '2px dashed',
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover'
                  }
                }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleImageUpload(file, 'organizerLogo');
                    }
                  };
                  input.click();
                }}
              >
                {data.organizerLogo ? (
                  <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                    <img
                      src={`http://localhost:5000${data.organizerLogo}`}
                      alt="Organizer Logo Preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        minWidth: 'auto',
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        padding: 0
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInputChange('organizerLogo', '');
                      }}
                    >
                      ×
                    </Button>
                  </Box>
                ) : (
                  <CardContent sx={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Folder sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Thêm logo ban tổ chức (275x275)
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ mt: 2 }}
                      disabled={uploading}
                      onClick={(e) => {
                        e.stopPropagation();
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleImageUpload(file, 'organizerLogo');
                          }
                        };
                        input.click();
                      }}
                    >
                      {uploading ? 'Đang upload...' : 'Chọn ảnh'}
                    </Button>
                  </CardContent>
                )}
              </Card>
            </Grid>

            {/* Organizer Info Fields */}
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Tên ban tổ chức"
                  value={data.organizerName}
                  onChange={(e) => handleInputChange('organizerName', e.target.value)}
                  fullWidth
                  required
                  placeholder="Tên ban tổ chức"
                  inputProps={{ maxLength: 80 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography variant="caption" color="text.secondary">
                          {data.organizerName?.length || 0}/80
                        </Typography>
                      </InputAdornment>
                    ),
                  }}
                />
                
                <TextField
                  label="Thông tin ban tổ chức"
                  value={data.organizerInfo}
                  onChange={(e) => handleInputChange('organizerInfo', e.target.value)}
                  fullWidth
                  required
                  multiline
                  rows={4}
                  placeholder="Thông tin ban tổ chức"
                  inputProps={{ maxLength: 500 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {data.organizerInfo?.length || 0}/500
                        </Typography>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Card>
      </Box>
    </Box>
  );
};

export default memo(EventInfoStep);