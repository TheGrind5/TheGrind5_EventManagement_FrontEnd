import React, { useState, useCallback, memo, useEffect, useRef } from 'react';
import { getImageUrl } from '../../utils/helpers';
import config from '../../config/environment';
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
import ImageDisplayLocationsModal from './ImageDisplayLocationsModal';
import ImageCropModal from '../common/ImageCropModal';
import ContentGeneratorWidget from '../ai/ContentGeneratorWidget';

const EventInfoStep = ({ data, onChange, eventId, isEditMode }) => {
  const theme = useTheme();
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropAspect, setCropAspect] = useState(1);
  const [cropSize, setCropSize] = useState({ width: 275, height: 275 });
  const [cropField, setCropField] = useState(null);
  
  // Ref để track lần upload gần nhất
  const lastUploadRef = useRef({ field: null, url: null, timestamp: 0 });
  
  // State để force re-render img tags khi upload
  const [imageKey, setImageKey] = useState(0);
  
  // Debug: Log data changes
  useEffect(() => {
    console.log('EventInfoStep - data changed:', {
      eventImage: data?.eventImage,
      backgroundImage: data?.backgroundImage,
      organizerLogo: data?.organizerLogo,
      fullData: data
    });
  }, [data?.eventImage, data?.backgroundImage, data?.organizerLogo]);
  
  // Helper function để build image URL
  const buildImageUrl = useCallback((imagePath) => {
    if (!imagePath) return null;
    return getImageUrl(imagePath, config.BASE_URL);
  }, []);

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
        } else if (data.campus && data.campus !== 'all') {
          const expectedProvince = campusToProvince[data.campus];
          if (value !== expectedProvince) {
            newErrors.province = 'Tỉnh thành phải khớp với campus đã chọn';
          } else {
            delete newErrors.province;
          }
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
    let imageUrl = null;
    try {
      setUploading(true);
      console.log(`[handleImageUpload] Starting upload for field: ${field}`);
      
      const response = await eventsAPI.uploadImage(file);
      imageUrl = response.data.imageUrl;
      
      if (!imageUrl) {
        throw new Error('Image URL không được trả về từ server');
      }
      
      console.log(`[handleImageUpload] Upload successful, imageUrl: ${imageUrl}`);
      
      // QUAN TRỌNG: Update state và ref TRƯỚC khi gọi onChange để đảm bảo ảnh hiển thị ngay
      const timestamp = Date.now();
      lastUploadRef.current = {
        field: field,
        url: imageUrl,
        timestamp: timestamp
      };
      
      // Force re-render img tag bằng cách update key
      setImageKey(timestamp);
      
      // Tạo data mới với ảnh vừa upload
      const updatedData = {
        ...data,
        [field]: imageUrl
      };
      
      // Cập nhật vào state - chỉ gọi onChange một lần
      console.log(`[handleImageUpload] Updating state with new image for field: ${field}`);
      console.log(`[handleImageUpload] Updated data:`, updatedData);
      
      // QUAN TRỌNG: Gọi onChange với data mới - wrap trong try-catch để tránh lỗi
      try {
        onChange(updatedData);
        console.log(`[handleImageUpload] State updated successfully`);
      } catch (onChangeError) {
        console.error('[handleImageUpload] Error calling onChange:', onChangeError);
        // Không throw để tránh unmount component
        // Ảnh vẫn hiển thị vì đã update ref và imageKey
      }
      
      // QUAN TRỌNG: Nếu đang ở edit mode, tự động lưu ảnh vào backend ngay lập tức
      // Nhưng làm điều này BẤT ĐỒNG BỘ (không await) để không block UI
      if (isEditMode && eventId) {
        // Sử dụng setTimeout để đảm bảo state đã được cập nhật trước khi auto-save
        // Và KHÔNG await để không block
        setTimeout(async () => {
          try {
            console.log(`[handleImageUpload] Auto-saving image ${field} to backend...`);
            console.log(`[handleImageUpload] Image URL: ${imageUrl}`);
            
            // Lấy data mới nhất - sử dụng closure để lấy updatedData
            let locationString = '';
            if (updatedData.eventMode === 'Online') {
              locationString = updatedData.location || '';
            } else {
              const addressParts = [];
              if (updatedData.streetAddress) addressParts.push(updatedData.streetAddress);
              if (updatedData.ward) addressParts.push(updatedData.ward);
              if (updatedData.district) addressParts.push(updatedData.district);
              if (updatedData.province) addressParts.push(updatedData.province);
              locationString = addressParts.join(', ');
            }
            
            // Tạo update request với đầy đủ các field theo format CreateEventStep1Request
            const updateData = {
              title: updatedData.title || '',
              description: updatedData.eventIntroduction || '',
              eventMode: updatedData.eventMode || 'Offline',
              venueName: updatedData.venueName || '',
              province: updatedData.province || '',
              district: updatedData.district || '',
              ward: updatedData.ward || '',
              streetAddress: updatedData.streetAddress || '',
              eventType: 'Public',
              category: updatedData.category || '',
              campus: updatedData.campus || '',
              location: locationString,
              eventImage: updatedData.eventImage || '',
              backgroundImage: updatedData.backgroundImage || '',
              eventIntroduction: updatedData.eventIntroduction || '',
              organizerLogo: updatedData.organizerLogo || '',
              organizerName: updatedData.organizerName || '',
              organizerInfo: updatedData.organizerInfo || ''
            };
            
            console.log(`[handleImageUpload] Update data for auto-save:`, updateData);
            
            // Gọi API update để lưu ảnh vào backend
            const updateResponse = await eventsAPI.update(eventId, updateData);
            console.log(`[handleImageUpload] ✅ Image ${field} saved to backend successfully`);
            
            // KHÔNG gọi onChange lại ở đây để tránh re-render và conflict
            // Ảnh đã được hiển thị từ lần onChange đầu tiên
            // Chỉ log để debug
            if (updateResponse.data?.eventData) {
              console.log(`[handleImageUpload] Backend response received - image saved successfully`);
              console.log(`[handleImageUpload] EventImage in response:`, updateResponse.data.eventData.eventImage);
              console.log(`[handleImageUpload] BackgroundImage in response:`, updateResponse.data.eventData.backgroundImage);
              console.log(`[handleImageUpload] OrganizerLogo in response:`, updateResponse.data.eventData.organizerLogo);
            }
          } catch (updateError) {
            console.error(`[handleImageUpload] ❌ Error saving image ${field} to backend:`, updateError);
            console.error(`[handleImageUpload] Error details:`, {
              message: updateError.message,
              response: updateError.response?.data,
              stack: updateError.stack
            });
            // KHÔNG hiển thị lỗi cho user vì ảnh đã được upload và hiển thị
            // Ảnh sẽ được lưu khi user nhấn "Tiếp tục"
          }
        }, 300); // Delay nhỏ hơn để nhanh hơn, nhưng đủ để state update
      }
    } catch (error) {
      console.error('[handleImageUpload] ❌ Upload failed:', error);
      console.error('[handleImageUpload] Error details:', {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      alert('Upload ảnh thất bại: ' + (error.message || 'Lỗi không xác định'));
    } finally {
      setUploading(false);
      console.log(`[handleImageUpload] Upload process completed for field: ${field}`);
    }
  };

  const getCropConfig = (field) => {
    switch (field) {
      case 'eventImage':
        return { aspect: 720 / 958, width: 720, height: 958 };
      case 'backgroundImage':
        return { aspect: 16 / 9, width: 1280, height: 720 };
      case 'organizerLogo':
        return { aspect: 1, width: 275, height: 275 };
      default:
        return { aspect: 1, width: 500, height: 500 };
    }
  };

  const openFileSelector = (field) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const cfg = getCropConfig(field);
        setCropField(field);
        setCropAspect(cfg.aspect);
        setCropSize({ width: cfg.width, height: cfg.height });
        setCropImageSrc(reader.result);
        setCropOpen(true);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleCropDone = async (croppedFile) => {
    if (!croppedFile || !cropField) {
      console.warn('[handleCropDone] Missing croppedFile or cropField');
      return;
    }
    
    console.log(`[handleCropDone] Starting crop for field: ${cropField}`);
    
    try {
      // Lưu field trước khi reset state
      const fieldToUpload = cropField;
      
      // Đóng modal và reset state trước khi upload
      setCropOpen(false);
      setCropField(null);
      setCropImageSrc(null);
      
      // Đợi một chút để đảm bảo modal đã đóng hoàn toàn
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Upload ảnh đã crop
      console.log(`[handleCropDone] Calling handleImageUpload for field: ${fieldToUpload}`);
      await handleImageUpload(croppedFile, fieldToUpload);
      
      console.log(`[handleCropDone] ✅ Crop and upload completed for field: ${fieldToUpload}`);
    } catch (error) {
      console.error('[handleCropDone] ❌ Error in crop process:', error);
      console.error('[handleCropDone] Error details:', {
        message: error.message,
        stack: error.stack
      });
      alert('Có lỗi xảy ra khi xử lý ảnh: ' + error.message);
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

  const fptCampuses = [
    'Hà Nội',
    'TP. Hồ Chí Minh',
    'Đà Nẵng',
    'Quy Nhơn',
    'Cần Thơ'
  ];

  // Mapping campus -> province
  const campusToProvince = {
    'Hà Nội': 'Hà Nội',
    'TP. Hồ Chí Minh': 'TP. Hồ Chí Minh',
    'Đà Nẵng': 'Đà Nẵng',
    'Quy Nhơn': 'Quy Nhơn',
    'Cần Thơ': 'Cần Thơ'
  };

  // Campuses không có quận/huyện (thành phố trực thuộc tỉnh)
  const campusesWithoutDistricts = ['Quy Nhơn'];

  const fptProvinces = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Quy Nhơn', 'Cần Thơ'];
  
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
        'Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 8', 'Quận 10', 'Quận 11',
        'Quận Bình Tân', 'Quận Bình Thạnh', 'Quận Gò Vấp', 'Quận Phú Nhuận', 'Quận Tân Bình',
        'Quận Tân Phú', 'Quận Thủ Đức', 'Huyện Bình Chánh', 'Huyện Cần Giờ', 'Huyện Củ Chi',
        'Huyện Hóc Môn', 'Huyện Nhà Bè'
      ],
      'Đà Nẵng': [
        'Quận Hải Châu', 'Quận Thanh Khê', 'Quận Sơn Trà', 'Quận Ngũ Hành Sơn', 'Quận Liên Chiểu',
        'Quận Cẩm Lệ', 'Huyện Hòa Vang'
      ],
      'Quy Nhơn': [
        'Phường Bùi Thị Xuân', 'Phường Đống Đa', 'Phường Ghềnh Ráng', 'Phường Hải Cảng',
        'Phường Lê Hồng Phong', 'Phường Lê Lợi', 'Phường Lý Thường Kiệt', 'Phường Ngô Mây',
        'Phường Nguyễn Văn Cừ', 'Phường Nhơn Bình', 'Phường Nhơn Phú', 'Phường Quang Trung',
        'Phường Thị Nại', 'Phường Trần Hưng Đạo', 'Phường Trần Phú', 'Phường Trần Quang Diệu',
        'Xã Nhơn Châu', 'Xã Nhơn Hải', 'Xã Nhơn Hội', 'Xã Nhơn Lý', 'Phường Nhơn Hưng'
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
      'Quận Hoàn Kiếm': ['Phường Phúc Tân', 'Phường Đồng Xuân', 'Phường Hàng Mã', 'Phường Hàng Buồm', 'Phường Hàng Đào', 'Phường Hàng Bồ', 'Phường Cửa Đông', 'Phường Lý Thái Tổ', 'Phường Hàng Bạc', 'Phường Hàng Gai', 'Phường Chương Dương Độ', 'Phường Hàng Trống', 'Phường Cửa Nam', 'Phường Hàng Bông', 'Phường Hàng Tre', 'Phường Tràng Tiền'],
      'Quận Tây Hồ': ['Phường Xuân La', 'Phường Yên Phụ', 'Phường Bưởi', 'Phường Thụy Khuê', 'Phường Phú Thượng', 'Phường Nhật Tân', 'Phường Tứ Liên', 'Phường Quảng An'],
      'Quận Long Biên': ['Phường Thạch Bàn', 'Phường Phúc Lợi', 'Phường Cự Khối', 'Phường Đức Giang', 'Phường Việt Hưng', 'Phường Gia Thụy', 'Phường Ngọc Lâm', 'Phường Lâm Du', 'Phường Đại Kim', 'Phường Giang Biên', 'Phường Đông Dư', 'Phường Bồ Đề', 'Phường Gia Thụy', 'Phường Ngọc Thụy'],
      'Quận Cầu Giấy': ['Phường Nghĩa Đô', 'Phường Nghĩa Tân', 'Phường Mai Dịch', 'Phường Dịch Vọng', 'Phường Dịch Vọng Hậu', 'Phường Quan Hoa', 'Phường Yên Hòa', 'Phường Trung Hòa'],
      'Quận Đống Đa': ['Phường Cát Linh', 'Phường Văn Miếu', 'Phường Quốc Tử Giám', 'Phường Láng Thượng', 'Phường Ô Chợ Dừa', 'Phường Văn Chương', 'Phường Hàng Bột', 'Phường Láng Hạ', 'Phường Khâm Thiên', 'Phường Thổ Quan', 'Phường Nam Đồng', 'Phường Trung Phụng', 'Phường Quang Trung', 'Phường Trung Liệt', 'Phường Phương Liên', 'Phường Thịnh Quang', 'Phường Trung Tự', 'Phường Kim Liên', 'Phường Phương Mai', 'Phường Ngã Tư Sở', 'Phường Khương Thượng'],
      'Quận Hai Bà Trưng': ['Phường Nguyễn Du', 'Phường Bạch Đằng', 'Phường Phạm Đình Hổ', 'Phường Lê Đại Hành', 'Phường Đồng Nhân', 'Phường Phố Huế', 'Phường Đống Mác', 'Phường Thanh Lương', 'Phường Thanh Nhàn', 'Phường Cầu Dền', 'Phường Bách Khoa', 'Phường Đồng Tâm', 'Phường Vĩnh Tuy', 'Phường Bạch Mai', 'Phường Quỳnh Mai', 'Phường Quỳnh Lôi', 'Phường Minh Khai', 'Phường Trương Định'],
      'Quận Hoàng Mai': ['Phường Thanh Trì', 'Phường Vĩnh Hưng', 'Phường Định Công', 'Phường Mai Động', 'Phường Tương Mai', 'Phường Đại Kim', 'Phường Tân Mai', 'Phường Hoàng Văn Thụ', 'Phường Giáp Bát', 'Phường Lĩnh Nam', 'Phường Thịnh Liệt', 'Phường Trần Phú', 'Phường Hoàng Liệt', 'Phường Yên Sở'],
      'Quận Thanh Xuân': ['Phường Nguyễn Trãi', 'Phường Khương Đình', 'Phường Khương Mai', 'Phường Khương Trung', 'Phường Phương Liệt', 'Phường Thanh Xuân Bắc', 'Phường Thanh Xuân Trung', 'Phường Thanh Xuân Nam', 'Phường Kim Giang'],
      'Quận Nam Từ Liêm': ['Phường Cầu Diễn', 'Phường Xuân Phương', 'Phường Phương Canh', 'Phường Mỹ Đình 1', 'Phường Mỹ Đình 2', 'Phường Tây Mỗ', 'Phường Mễ Trì', 'Phường Phú Đô', 'Phường Đại Mỗ', 'Phường Trung Văn'],
      'Quận Bắc Từ Liêm': ['Phường Thượng Cát', 'Phường Liên Mạc', 'Phường Đông Ngạc', 'Phường Đức Thắng', 'Phường Thụy Phương', 'Phường Tây Tựu', 'Phường Xuân Đỉnh', 'Phường Xuân Tảo', 'Phường Minh Khai', 'Phường Cổ Nhuế 1', 'Phường Cổ Nhuế 2', 'Phường Phú Diễn', 'Phường Phúc Diễn'],
      'Quận Hà Đông': ['Phường Yết Kiêu', 'Phường Quang Trung', 'Phường La Khê', 'Phường Phú La', 'Phường Phúc La', 'Phường Hà Cầu', 'Phường Yên Nghĩa', 'Phường Kiến Hưng', 'Phường Phú Lãm', 'Phường Phú Lương', 'Phường Biên Giang', 'Phường Đồng Mai', 'Phường Nguyễn Trãi', 'Phường Mộ Lao', 'Phường Văn Quán', 'Phường Vạn Phúc', 'Phường Yên Nghĩa', 'Phường Dương Nội'],
      'Thị xã Sơn Tây': ['Phường Trung Hưng', 'Phường Trung Sơn Trầm', 'Phường Kim Sơn', 'Phường Sơn Lộc', 'Phường Xuân Khanh', 'Phường Đường Lâm', 'Xã Viên Sơn', 'Xã Xuân Sơn', 'Xã Thanh Mỹ', 'Xã Trung Hưng', 'Xã Thanh Thùy', 'Xã Kim Sơn', 'Xã Thanh Mai'],
      'Huyện Thạch Thất': ['Thị trấn Liên Quan', 'Xã Cẩm Yên', 'Xã Cần Kiệm', 'Xã Hương Ngải', 'Xã Đại Đồng', 'Xã Kim Quan', 'Xã Thạch Hòa', 'Xã Tiến Xuân', 'Xã Yên Trung', 'Xã Yên Bình', 'Xã Tân Xã', 'Xã Đồng Trúc'],
      
      // TP. Hồ Chí Minh
      'Quận 1': ['Phường Tân Định', 'Phường Đa Kao', 'Phường Bến Nghé', 'Phường Bến Thành', 'Phường Nguyễn Thái Bình', 'Phường Phạm Ngũ Lão', 'Phường Cầu Ông Lãnh', 'Phường Cô Giang', 'Phường Nguyễn Cư Trinh', 'Phường Cầu Kho'],
      'Quận Thủ Đức': ['Phường Linh Trung', 'Phường Bình Chiểu', 'Phường Linh Xuân', 'Phường Tam Bình', 'Phường Tam Phú', 'Phường Hiệp Bình Chánh', 'Phường Hiệp Bình Phước', 'Phường Trường Thọ', 'Phường Long Bình', 'Phường Long Thạnh Mỹ', 'Phường Tân Phú', 'Phường Hiệp Phú', 'Phường Tăng Nhơn Phú A', 'Phường Tăng Nhơn Phú B', 'Phường Phước Long B', 'Phường Phước Long A', 'Phường Trường Thạnh', 'Phường Long Phước', 'Phường Long Trường', 'Phường Phước Bình', 'Phường Phú Hữu', 'Phường Bình Thọ', 'Phường An Phú', 'Phường An Khánh', 'Phường Bình Trưng Tây', 'Phường Bình Trưng Đông', 'Phường Cát Lái', 'Phường Thảo Điền', 'Phường An Lợi Đông', 'Phường Thủ Thiêm', 'Phường Linh Chiểu', 'Phường Linh Đông', 'Phường Linh Tây'],
      
      // Đà Nẵng
      'Quận Hải Châu': ['Phường Thạch Thang', 'Phường Hải Châu I', 'Phường Hải Châu II', 'Phường Phước Ninh', 'Phường Hòa Thuận Tây', 'Phường Hòa Thuận Đông', 'Phường Nam Dương', 'Phường Bình Hiên', 'Phường Bình Thuận', 'Phường Hòa Cường Bắc', 'Phường Hòa Cường Nam'],
      'Quận Ngũ Hành Sơn': ['Phường Khuê Mỹ', 'Phường Hòa Hải', 'Phường Hòa Quý', 'Phường Mỹ An', 'Phường Khuê Đông'],
      'Quận Thanh Khê': ['Phường Thanh Khê Tây', 'Phường Thanh Khê Đông', 'Phường Xuân Hà', 'Phường Tân Chính', 'Phường Chính Gián', 'Phường Vĩnh Trung', 'Phường Thạc Gián', 'Phường An Khê', 'Phường Hòa Khê', 'Phường Tam Thuận'],
      'Quận Sơn Trà': ['Phường Thọ Quang', 'Phường Nại Hiên Đông', 'Phường Mân Thái', 'Phường An Hải Bắc', 'Phường Phước Mỹ', 'Phường An Hải Tây', 'Phường An Hải Đông', 'Phường Nại Hiên Đông'],
      'Quận Liên Chiểu': ['Phường Hòa Hiệp Bắc', 'Phường Hòa Hiệp Nam', 'Phường Hòa Khánh Bắc', 'Phường Hòa Khánh Nam', 'Phường Hòa Minh'],
      'Quận Cẩm Lệ': ['Phường Khuê Trung', 'Phường Hòa Phát', 'Phường Hòa An', 'Phường Hòa Thọ Tây', 'Phường Hòa Thọ Đông', 'Phường Hòa Xuân'],
      
      // Bình Định - Quy Nhơn
      'Thành phố Quy Nhơn': [
        'Phường Bùi Thị Xuân', 'Phường Đống Đa', 'Phường Ghềnh Ráng', 'Phường Hải Cảng',
        'Phường Lê Hồng Phong', 'Phường Lê Lợi', 'Phường Lý Thường Kiệt', 'Phường Ngô Mây',
        'Phường Nguyễn Văn Cừ', 'Phường Nhơn Bình', 'Phường Nhơn Phú', 'Phường Quang Trung',
        'Phường Thị Nại', 'Phường Trần Hưng Đạo', 'Phường Trần Phú', 'Phường Trần Quang Diệu',
        'Xã Nhơn Châu', 'Xã Nhơn Hải', 'Xã Nhơn Hội', 'Xã Nhơn Lý', 'Phường Nhơn Hưng'
      ],
      
      // Cần Thơ
      'Quận Ninh Kiều': ['Phường An Bình', 'Phường Cái Khế', 'Phường An Hòa', 'Phường An Hội', 'Phường An Nghiệp', 'Phường An Phú', 'Phường Cái Khế', 'Phường Hưng Lợi', 'Phường Tân An', 'Phường An Khánh', 'Phường An Thới', 'Phường Bùi Hữu Nghĩa', 'Phường Long Hòa', 'Phường Long Tuyền', 'Phường Thới Bình', 'Phường Trà Nóc', 'Phường Thới Long'],
      'Quận Ô Môn': ['Phường Châu Văn Liêm', 'Phường Phước Thới', 'Phường Thới Hòa', 'Phường Thới Long', 'Phường Thới Thuận', 'Phường Thuận An', 'Phường Thới An', 'Phường Tân Lộc', 'Phường Trường Lạc'],
      'Quận Bình Thuỷ': ['Phường Bình Thủy', 'Phường An Thới', 'Phường Bùi Hữu Nghĩa', 'Phường Long Hòa', 'Phường Long Tuyền', 'Phường Trà An', 'Phường Trà Nóc', 'Phường Thới An Đông'],
      'Quận Cái Răng': ['Phường Ba Láng', 'Phường Hưng Phú', 'Phường Hưng Thạnh', 'Phường Lê Bình', 'Phường Phú Thứ', 'Phường Tân Phú', 'Phường Thường Thạnh', 'Phường Trường Thạnh'],
      'Quận Thốt Nốt': ['Phường Thốt Nốt', 'Phường Thới Thuận', 'Phường Thuận An', 'Phường Thuận Hưng', 'Phường Trung Nhứt', 'Phường Trung Kiên', 'Phường Trung Thạnh'],
      
      // Cần Thơ - Huyện
      'Huyện Vĩnh Thạnh': ['Thị trấn Thanh An', 'Thị trấn Vĩnh Thạnh', 'Xã Thạnh Mỹ', 'Xã Vĩnh Trinh', 'Xã Thạnh An', 'Xã Thạnh Tiến', 'Xã Thạnh Thắng', 'Xã Thạnh Lợi', 'Xã Thạnh Quới', 'Xã Thạnh Lộc'],
      'Huyện Cờ Đỏ': ['Thị trấn Cờ Đỏ', 'Xã Thới Hưng', 'Xã Thới Đông', 'Xã Thới Xuân', 'Xã Đông Hiệp', 'Xã Đông Thắng', 'Xã Tân Thạnh', 'Xã Đông Bình', 'Xã Đông Thuận', 'Xã Tân Thới', 'Xã Tân Hưng', 'Xã Đông Thành'],
      'Huyện Phong Điền': ['Thị trấn Phong Điền', 'Xã Giai Xuân', 'Xã Tân Thới', 'Xã Trường Long', 'Xã Mỹ Khánh', 'Xã Nhơn Ái', 'Xã Nhơn Nghĩa', 'Xã Tân Thạnh', 'Xã Thạnh Phú', 'Xã Mỹ Khánh'],
      'Huyện Thới Lai': ['Thị trấn Thới Lai', 'Xã Định Môn', 'Xã Trường Xuân', 'Xã Tân Thạnh', 'Xã Xuân Thắng', 'Xã Đông Bình', 'Xã Đông Thuận', 'Xã Định Môn', 'Xã Xuân Thắng', 'Xã Trường Xuân A', 'Xã Trường Xuân B'],
      
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
              onClick={() => setImageModalOpen(true)}
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
                onClick={() => openFileSelector('eventImage')}
              >
                {data.eventImage ? (
                  <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                    <img
                      key={`eventImage-${data.eventImage}-${lastUploadRef.current.field === 'eventImage' ? imageKey : 0}`}
                      src={buildImageUrl(data.eventImage) || data.eventImage || ''}
                      alt="Event Image Preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                      onError={(e) => {
                        console.error('Error loading event image:', {
                          originalUrl: data.eventImage,
                          builtUrl: buildImageUrl(data.eventImage),
                          error: e
                        });
                        // Không ẩn ảnh, chỉ log lỗi
                      }}
                      onLoad={() => {
                        console.log('✅ Event image loaded successfully:', {
                          originalUrl: data.eventImage,
                          builtUrl: buildImageUrl(data.eventImage)
                        });
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
                        openFileSelector('eventImage');
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
                onClick={() => openFileSelector('backgroundImage')}
              >
                {data.backgroundImage ? (
                  <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                    <img
                      key={`backgroundImage-${data.backgroundImage}-${lastUploadRef.current.field === 'backgroundImage' ? imageKey : 0}`}
                      src={buildImageUrl(data.backgroundImage) || data.backgroundImage || ''}
                      alt="Background Image Preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                      onError={(e) => {
                        console.error('Error loading background image:', {
                          originalUrl: data.backgroundImage,
                          builtUrl: buildImageUrl(data.backgroundImage),
                          error: e
                        });
                        // Không ẩn ảnh, chỉ log lỗi
                      }}
                      onLoad={() => {
                        console.log('✅ Background image loaded successfully:', {
                          originalUrl: data.backgroundImage,
                          builtUrl: buildImageUrl(data.backgroundImage)
                        });
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
                        openFileSelector('backgroundImage');
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

              {/* Your Campus */}
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Your Campus <span style={{ color: 'red' }}>*</span>
                </Typography>
                <FormControl fullWidth required>
                  <InputLabel id="campus-label">Chọn campus của bạn</InputLabel>
                  <Select
                    labelId="campus-label"
                    value={data.campus || ''}
                    label="Chọn campus của bạn"
                    onChange={(e) => {
                      const selectedCampus = e.target.value;
                      // Nếu không phải "all", auto set province theo mapping
                      if (selectedCampus !== 'all') {
                        handleInputChange('campus', selectedCampus);
                        // Auto set province theo campus mapping
                        const mappedProvince = campusToProvince[selectedCampus] || selectedCampus;
                        const newData = {
                          ...data,
                          campus: selectedCampus,
                          province: mappedProvince,
                          district: '',
                          ward: ''
                        };
                        onChange(newData);
                      } else {
                        handleInputChange('campus', selectedCampus);
                      }
                    }}
                  >
                    <MenuItem value="all">
                      Tất cả campus
                    </MenuItem>
                    {fptCampuses.map((campus) => (
                      <MenuItem key={campus} value={campus}>
                        {campus}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Địa chỉ chi tiết */}
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Địa chỉ chi tiết <span style={{ color: 'red' }}>*</span>
                </Typography>
                
                
                <Grid container spacing={2}>
                  {/* Tỉnh/Thành */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required error={!!errors.province} disabled={data.campus && data.campus !== 'all'}>
                      <InputLabel id="province-label">Tỉnh/Thành *</InputLabel>
                      <Select
                        key={`province-${data.province || 'empty'}`}
                        labelId="province-label"
                        value={data.province || ''}
                        label="Tỉnh/Thành *"
                        onChange={(e) => {
                          const selectedProvince = e.target.value;
                          // Kiểm tra nếu đã chọn campus cụ thể, province phải khớp với campus
                          if (data.campus && data.campus !== 'all') {
                            const expectedProvince = campusToProvince[data.campus];
                            if (selectedProvince !== expectedProvince) {
                              // Không cho phép chọn province khác với campus
                              return;
                            }
                          }
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
                        {fptProvinces.map((province) => (
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
                      {data.campus && data.campus !== 'all' && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          * Tỉnh thành đã được tự động chọn theo campus
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  
                  {/* Quận/Huyện - Ẩn nếu chọn Quy Nhơn */}
                  {!campusesWithoutDistricts.includes(data.campus) && (
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
                  )}
                  
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
                        disabled={!campusesWithoutDistricts.includes(data.campus) && !data.district}
                      >
                        <MenuItem value="">
                          <em>Chọn phường/xã</em>
                        </MenuItem>
                        {campusesWithoutDistricts.includes(data.campus) ? (
                          // Nếu là Quy Nhơn, hiển thị phường/xã trực thuộc từ districtsData
                          getDistrictsByProvince(data.province).map((ward) => (
                            <MenuItem key={ward} value={ward}>
                              {ward}
                            </MenuItem>
                          ))
                        ) : (
                          getWardsByDistrict(data.district).map((ward) => (
                            <MenuItem key={ward} value={ward}>
                              {ward}
                            </MenuItem>
                          ))
                        )}
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

        {/* AI Content Generator Widget */}
        {data.title && data.category && (
          <ContentGeneratorWidget
            eventTitle={data.title}
            eventCategory={data.category}
            eventType={data.category}
            onGenerated={(field, content) => {
              if (field === 'description' || field === 'introduction') {
                handleInputChange('eventIntroduction', content);
              } else if (field === 'terms') {
                // Handle terms if needed
              } else if (field === 'specialExperience') {
                // Handle special experience if needed
              }
            }}
          />
        )}

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
                onClick={() => openFileSelector('organizerLogo')}
              >
                {data.organizerLogo ? (
                  <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                    <img
                      key={`organizerLogo-${data.organizerLogo}-${lastUploadRef.current.field === 'organizerLogo' ? imageKey : 0}`}
                      src={buildImageUrl(data.organizerLogo) || data.organizerLogo || ''}
                      alt="Organizer Logo Preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                      onError={(e) => {
                        console.error('Error loading organizer logo:', {
                          originalUrl: data.organizerLogo,
                          builtUrl: buildImageUrl(data.organizerLogo),
                          error: e
                        });
                        // Không ẩn ảnh, chỉ log lỗi
                      }}
                      onLoad={() => {
                        console.log('✅ Organizer logo loaded successfully:', {
                          originalUrl: data.organizerLogo,
                          builtUrl: buildImageUrl(data.organizerLogo)
                        });
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
                        openFileSelector('organizerLogo');
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

      {/* Image Display Locations Modal */}
      <ImageDisplayLocationsModal
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        images={{
          eventImage: data.eventImage,
          backgroundImage: data.backgroundImage,
          organizerLogo: data.organizerLogo
        }}
      />
      <ImageCropModal
        open={cropOpen}
        onClose={() => {
          console.log('[EventInfoStep] ImageCropModal onClose called');
          setCropOpen(false);
          setCropField(null);
          setCropImageSrc(null);
        }}
        imageSrc={cropImageSrc}
        aspectRatio={cropAspect}
        cropWidth={cropSize.width}
        cropHeight={cropSize.height}
        onCropComplete={handleCropDone}
        fieldName={cropField}
      />
    </Box>
  );
};

export default memo(EventInfoStep);