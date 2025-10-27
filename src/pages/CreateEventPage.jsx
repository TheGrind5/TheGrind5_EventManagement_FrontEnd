import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import Header from '../components/layout/Header';
import EventInfoStep from '../components/event-creation/EventInfoStep';
import DateTimeTicketStep from '../components/event-creation/DateTimeTicketStep';
import VirtualStageStep from '../components/stage/VirtualStageStep';
import SettingsStep from '../components/event-creation/SettingsStep';
import PaymentStep from '../components/event-creation/PaymentStep';
import { eventsAPI } from '../services/apiClient';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [eventId, setEventId] = useState(null);

  // State cho từng bước với localStorage
  const [step1Data, setStep1Data] = useState(() => {
    const saved = localStorage.getItem('createEvent_step1');
    return saved ? JSON.parse(saved) : {
      title: '',
      eventIntroduction: '',
      category: '',
      eventMode: 'Offline',
      venueName: '',
      province: '',
      district: '',
      ward: '',
      streetAddress: '',
      location: '',
      organizerName: '',
      organizerInfo: '',
      eventImage: '',
      backgroundImage: '',
      organizerLogo: ''
    };
  });

  const [step2Data, setStep2Data] = useState(() => {
    const saved = localStorage.getItem('createEvent_step2');
    return saved ? JSON.parse(saved) : {
      startTime: '',
      endTime: '',
      ticketTypes: []
    };
  });

  const [step3Data, setStep3Data] = useState(() => {
    const saved = localStorage.getItem('createEvent_step3');
    return saved ? JSON.parse(saved) : {
      hasVirtualStage: false,
      layout: null
    };
  });

  const [step4Data, setStep4Data] = useState(() => {
    const saved = localStorage.getItem('createEvent_step4');
    return saved ? JSON.parse(saved) : {
      eventStatus: 'Draft',
      priority: 'Normal',
      maxAttendees: 0,
      registrationDeadline: 0,
      contactEmail: '',
      contactPhone: '',
      internalNotes: ''
    };
  });

  const [step5Data, setStep5Data] = useState(() => {
    const saved = localStorage.getItem('createEvent_step5');
    return saved ? JSON.parse(saved) : {
      selectedPaymentMethods: ['bank_transfer'],
      bankAccounts: [
        {
          bankName: 'MB Bank',
          accountNumber: '04358345653',
          accountHolder: 'Khanh Ngu da',
          isDefault: true
        }
      ],
      autoConfirm: false,
      requirePaymentProof: false,
      taxInfo: ''
    };
  });

  const steps = [
    'Thông tin cơ bản',
    'Thời gian & Loại vé',
    'Sân khấu ảo',
    'Cài đặt',
    'Thanh toán'
  ];

  // Lưu dữ liệu vào localStorage với debounce để tránh chạy quá nhiều
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('createEvent_step1', JSON.stringify(step1Data));
    }, 500);
    return () => clearTimeout(timer);
  }, [step1Data]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('createEvent_step2', JSON.stringify(step2Data));
    }, 500);
    return () => clearTimeout(timer);
  }, [step2Data]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('createEvent_step3', JSON.stringify(step3Data));
    }, 500);
    return () => clearTimeout(timer);
  }, [step3Data]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('createEvent_step4', JSON.stringify(step4Data));
    }, 500);
    return () => clearTimeout(timer);
  }, [step4Data]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('createEvent_step5', JSON.stringify(step5Data));
    }, 500);
    return () => clearTimeout(timer);
  }, [step5Data]);

  const handleNext = async () => {
    if (activeStep === 0) {
      // Bước 1: Tạo event cơ bản
      try {
        setLoading(true);
        setError(null);
        
        // Debug: Log step1Data trước khi gửi
        console.log('Step 1 Data Before Validation:', step1Data);
        console.log('Step 1 Data Keys:', Object.keys(step1Data));
        console.log('Step 1 Data Values:', Object.values(step1Data));
        
        // Validation cơ bản
        const requiredFields = ['title', 'eventMode', 'category', 'eventIntroduction', 'organizerName', 'organizerInfo'];
        const missingFields = requiredFields.filter(field => {
          const value = step1Data[field];
          const isEmpty = !value || value.trim() === '';
          console.log(`Field ${field}: "${value}" - isEmpty: ${isEmpty}`);
          return isEmpty;
        });
        
        console.log('Missing basic fields:', missingFields);
        
        if (missingFields.length > 0) {
          throw new Error(`Vui lòng điền đầy đủ thông tin: ${missingFields.join(', ')}`);
        }
        
        // Validation cho địa chỉ
        console.log('Event Mode:', step1Data.eventMode);
        if (step1Data.eventMode === 'Offline') {
          const addressFields = ['venueName', 'province', 'streetAddress'];
          const missingAddressFields = addressFields.filter(field => {
            const value = step1Data[field];
            const isEmpty = !value || value.trim() === '';
            console.log(`Address field ${field}: "${value}" - isEmpty: ${isEmpty}`);
            return isEmpty;
          });
          
          console.log('Missing address fields:', missingAddressFields);
          
          if (missingAddressFields.length > 0) {
            throw new Error(`Vui lòng điền đầy đủ thông tin địa chỉ: ${missingAddressFields.join(', ')}`);
          }
        } else if (step1Data.eventMode === 'Online') {
          console.log(`Online location: "${step1Data.location}"`);
          if (!step1Data.location || step1Data.location.trim() === '') {
            throw new Error('Vui lòng nhập link sự kiện cho sự kiện online');
          }
        }
        
        // Tạo location string cho offline events
        let locationString = '';
        if (step1Data.eventMode === 'Online') {
          locationString = step1Data.location || '';
        } else {
          const addressParts = [];
          if (step1Data.streetAddress) addressParts.push(step1Data.streetAddress);
          if (step1Data.ward) addressParts.push(step1Data.ward);
          if (step1Data.district) addressParts.push(step1Data.district);
          if (step1Data.province) addressParts.push(step1Data.province);
          locationString = addressParts.join(', ');
        }
        
        const eventData = {
          title: step1Data.title || '',
          description: step1Data.eventIntroduction || '',
          eventMode: step1Data.eventMode || 'Offline',
          venueName: step1Data.venueName || '',
          province: step1Data.province || '',
          district: step1Data.district || '',
          ward: step1Data.ward || '',
          streetAddress: step1Data.streetAddress || '',
          eventType: 'Public',
          category: step1Data.category || '',
          location: locationString,
          eventImage: step1Data.eventImage || '',
          backgroundImage: step1Data.backgroundImage || '',
          eventIntroduction: step1Data.eventIntroduction || '',
          eventDetails: step1Data.eventIntroduction || '', // Sử dụng eventIntroduction cho eventDetails
          specialGuests: '', // Có thể thêm sau
          specialExperience: '', // Có thể thêm sau
          termsAndConditions: '', // Có thể thêm sau
          childrenTerms: '', // Có thể thêm sau
          vatTerms: '', // Có thể thêm sau
          organizerLogo: step1Data.organizerLogo || '',
          organizerName: step1Data.organizerName || '',
          organizerInfo: step1Data.organizerInfo || ''
        };
        
        console.log('Sending event data:', eventData);
        
        // Kiểm tra dữ liệu trước khi gửi
        console.log('Validating data before send:');
        console.log('- Title:', eventData.title);
        console.log('- EventMode:', eventData.eventMode);
        console.log('- Category:', eventData.category);
        console.log('- Location:', eventData.location);
        console.log('- Province:', eventData.province);
        console.log('- District:', eventData.district);
        console.log('- Ward:', eventData.ward);
        
        const response = await eventsAPI.createStep1(eventData);
        
        setEventId(response.data.eventId);
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
      } catch (err) {
        setError(err.message || 'Có lỗi xảy ra khi tạo sự kiện');
      } finally {
        setLoading(false);
      }
    } else if (activeStep === 1) {
      // Bước 2: Cập nhật thời gian và ticket types
      try {
        setLoading(true);
        setError(null);
        
        // Debug: Log step2Data trước khi gửi
        console.log('Step 2 Data Before Send:', step2Data);
        console.log('Step 2 Data Keys:', Object.keys(step2Data));
        console.log('Step 2 Data Values:', Object.values(step2Data));
        
        // Validate StartTime and EndTime
        if (!step2Data.startTime) {
          throw new Error('Vui lòng chọn thời gian bắt đầu');
        }
        
        if (!step2Data.endTime) {
          throw new Error('Vui lòng chọn thời gian kết thúc');
        }
        
        // Validate ticket types
        if (!step2Data.ticketTypes || step2Data.ticketTypes.length === 0) {
          throw new Error('Vui lòng thêm ít nhất một loại vé cho sự kiện');
        }
        
        const startDate = new Date(step2Data.startTime);
        const endDate = new Date(step2Data.endTime);
        
        if (isNaN(startDate.getTime())) {
          throw new Error('Thời gian bắt đầu không hợp lệ');
        }
        
        if (isNaN(endDate.getTime())) {
          throw new Error('Thời gian kết thúc không hợp lệ');
        }
        
        if (startDate >= endDate) {
          throw new Error('Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc');
        }
        
        console.log('StartTime validation:', {
          original: step2Data.startTime,
          parsed: startDate,
          iso: startDate.toISOString()
        });
        
        console.log('EndTime validation:', {
          original: step2Data.endTime,
          parsed: endDate,
          iso: endDate.toISOString()
        });
        
        // Chuyển đổi dữ liệu sang format mà backend mong đợi
        const step2Request = {
          StartTime: new Date(step2Data.startTime).toISOString(),
          EndTime: new Date(step2Data.endTime).toISOString(),
          TicketTypes: step2Data.ticketTypes.map((ticket, index) => {
            console.log(`Processing ticket ${index}:`, ticket);
            
            // Validate ticket data before processing
            if (!ticket.typeName || ticket.typeName.trim() === '') {
              throw new Error(`Tên loại vé ${index + 1} không được để trống`);
            }
            
            // Validate ticket name content
            const cleanTypeName = ticket.typeName.trim();
            if (cleanTypeName.length < 2) {
              throw new Error(`Tên loại vé ${index + 1} phải có ít nhất 2 ký tự`);
            }
            
            if (cleanTypeName.length > 100) {
              throw new Error(`Tên loại vé ${index + 1} không được quá 100 ký tự`);
            }
            
            // Kiểm tra ký tự không phù hợp
            const invalidChars = ['<', '>', '&', '"', "'", '\\', '/', ';', '=', '(', ')', '[', ']', '{', '}'];
            if (invalidChars.some(char => cleanTypeName.includes(char))) {
              throw new Error(`Tên loại vé ${index + 1} chứa ký tự không hợp lệ`);
            }
            
            // Kiểm tra nội dung không phù hợp
            const inappropriateWords = ['cặc', 'lỏ', 'địt', 'đụ', 'đéo', 'chó', 'lồn', 'buồi', 'cứt'];
            const lowerTypeName = cleanTypeName.toLowerCase();
            if (inappropriateWords.some(word => lowerTypeName.includes(word))) {
              throw new Error(`Tên loại vé ${index + 1} chứa nội dung không phù hợp. Vui lòng sử dụng tên phù hợp.`);
            }
            
            if (!ticket.price || parseFloat(ticket.price) < 0) {
              throw new Error(`Giá vé ${index + 1} không hợp lệ`);
            }
            
            if (!ticket.quantity || parseInt(ticket.quantity) < 0) {
              throw new Error(`Số lượng vé ${index + 1} không hợp lệ`);
            }
            
            const minOrder = parseInt(ticket.minOrder) || 1;
            const maxOrder = parseInt(ticket.maxOrder) || 10;
            
            if (minOrder > maxOrder) {
              throw new Error(`Đơn hàng tối thiểu không thể lớn hơn đơn hàng tối đa cho vé ${index + 1}`);
            }
            
            // Đảm bảo SaleStart và SaleEnd có giá trị hợp lệ
            let saleStart = ticket.saleStart;
            let saleEnd = ticket.saleEnd;
            
            // Nếu không có SaleStart, sử dụng thời gian hiện tại
            if (!saleStart) {
              saleStart = new Date();
            } else {
              saleStart = new Date(saleStart);
            }
            
            // Nếu không có SaleEnd hoặc SaleEnd <= SaleStart, sử dụng 30 ngày sau SaleStart
            if (!saleEnd || new Date(saleEnd) <= saleStart) {
              saleEnd = new Date(saleStart.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from SaleStart
            } else {
              saleEnd = new Date(saleEnd);
            }
            
            // Đảm bảo tất cả các trường đều có giá trị hợp lệ
            const processedTicket = {
              TypeName: ticket.typeName.trim(),
              Price: parseFloat(ticket.price),
              Quantity: parseInt(ticket.quantity),
              MinOrder: minOrder,
              MaxOrder: maxOrder,
              SaleStart: saleStart.toISOString(),
              SaleEnd: saleEnd.toISOString()
            };
            
            console.log(`Processed ticket ${index}:`, processedTicket);
            console.log(`Ticket ${index} validation:`, {
              TypeName: processedTicket.TypeName,
              Price: processedTicket.Price,
              Quantity: processedTicket.Quantity,
              MinOrder: processedTicket.MinOrder,
              MaxOrder: processedTicket.MaxOrder,
              SaleStart: processedTicket.SaleStart,
              SaleEnd: processedTicket.SaleEnd,
              Status: processedTicket.Status,
              SaleStartDate: new Date(processedTicket.SaleStart),
              SaleEndDate: new Date(processedTicket.SaleEnd)
            });
            return processedTicket;
          })
        };
        
        console.log('Step 2 Request Data:', step2Request);
        console.log('Step 2 Request Data JSON:', JSON.stringify(step2Request, null, 2));
        console.log('Step 2 Request Data Types:', {
          StartTime: typeof step2Request.StartTime,
          EndTime: typeof step2Request.EndTime,
          TicketTypes: Array.isArray(step2Request.TicketTypes),
          TicketTypesLength: step2Request.TicketTypes.length
        });
        
        // Kiểm tra từng trường trong request
        console.log('StartTime:', step2Request.StartTime, typeof step2Request.StartTime);
        console.log('EndTime:', step2Request.EndTime, typeof step2Request.EndTime);
        console.log('TicketTypes count:', step2Request.TicketTypes.length);
        step2Request.TicketTypes.forEach((ticket, index) => {
          console.log(`Ticket ${index}:`, ticket);
          console.log(`Ticket ${index} validation:`, {
            TypeName: ticket.TypeName,
            Price: ticket.Price,
            Quantity: ticket.Quantity,
            MinOrder: ticket.MinOrder,
            MaxOrder: ticket.MaxOrder,
            SaleStart: ticket.SaleStart,
            SaleEnd: ticket.SaleEnd,
            Status: ticket.Status
          });
        });
        
        const response = await eventsAPI.updateStep2(eventId, step2Request);
         
         if (response.data && response.data.ticketTypes) {
           setStep2Data(prev => ({ ...prev, ticketTypes: response.data.ticketTypes }));
         }
        
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
      } catch (err) {
        setError(err.message || 'Có lỗi xảy ra khi cập nhật thời gian và vé');
      } finally {
        setLoading(false);
      }
    } else if (activeStep === 2) {
      // Bước 3: Virtual Stage - Lưu venue layout nếu có
      try {
        setLoading(true);
        setError(null);
        
        console.log('Step 3 Data (Venue Layout):', step3Data);
        
        // Nếu có venue layout, lưu vào database
        if (step3Data && step3Data.hasVirtualStage && step3Data.layout) {
          console.log('Saving venue layout to database...');
          
          // Prepare venue layout data with proper format
          // Map temporary ticketTypeIds to ticket names for identification
          const areasToSave = (step3Data.layout.areas || []).map(area => ({
            ...area,
            ticketTypeId: area.ticketTypeId || null
          }));
          
          // OLD CODE REMOVED - using areasToSave now
          const areasWithTicketNamesOLD = step3Data.layout.areas?.map(area => {
            let ticketTypeName = null;
            if (area.ticketTypeId && step2Data.ticketTypes) {
              const ticketIndex = area.ticketTypeId - 1; // Convert from 1-indexed to 0-indexed
              if (ticketIndex >= 0 && ticketIndex < step2Data.ticketTypes.length) {
                ticketTypeName = step2Data.ticketTypes[ticketIndex]?.typeName;
              }
            }
            return {
              ...area,
              ticketTypeName: ticketTypeName // Add ticket name for backend mapping
            };
          }) || [];
          
          const venueLayoutData = {
            hasVirtualStage: step3Data.layout.hasVirtualStage,
            canvasWidth: step3Data.layout.canvasWidth || 1000,
            canvasHeight: step3Data.layout.canvasHeight || 800,
            areas: areasToSave
          };
          
          const step3Request = {
            venueLayout: venueLayoutData
          };
          
          console.log('Step 3 Request (Venue Layout):', step3Request);
          await eventsAPI.updateStep3(eventId, step3Request);
          console.log('Venue layout saved successfully');
        } else {
          console.log('No venue layout to save - skipping');
          // Send empty venue layout
          await eventsAPI.updateStep3(eventId, { venueLayout: null });
        }
        
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
      } catch (err) {
        console.error('Error saving venue layout:', err);
        setError(err.message || 'Có lỗi xảy ra khi lưu sơ đồ sân khấu');
      } finally {
        setLoading(false);
      }
    } else if (activeStep === 3) {
      // Bước 4: Cập nhật cài đặt
      try {
        setLoading(true);
        setError(null);
        
        // Debug: Log step4Data trước khi gửi
        console.log('Step 4 Data Before Send:', step4Data);
        console.log('Step 4 Data Keys:', Object.keys(step4Data));
        console.log('Step 4 Data Values:', Object.values(step4Data));
        
        // Chuyển đổi dữ liệu sang format mà backend mong đợi
        const step4Request = {
          EventSettings: JSON.stringify({
            eventStatus: step4Data.eventStatus || 'Draft',
            priority: step4Data.priority || 'Normal',
            maxAttendees: step4Data.maxAttendees || 0,
            registrationDeadline: step4Data.registrationDeadline || 0,
            contactEmail: step4Data.contactEmail || '',
            contactPhone: step4Data.contactPhone || '',
            internalNotes: step4Data.internalNotes || ''
          }),
          AllowRefund: true, // Mặc định cho phép hoàn tiền
          RefundDaysBefore: 7, // Mặc định 7 ngày trước sự kiện
          RequireApproval: false // Mặc định không cần phê duyệt
        };
        
        console.log('Step 4 Request Data:', step4Request);
        console.log('Step 4 Request Data JSON:', JSON.stringify(step4Request, null, 2));
        
        await eventsAPI.updateStep3(eventId, step4Request);
        
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
      } catch (err) {
        setError(err.message || 'Có lỗi xảy ra khi cập nhật cài đặt');
      } finally {
        setLoading(false);
      }
    } else if (activeStep === 4) {
      // Bước 5: Hoàn thành
      try {
        setLoading(true);
        setError(null);
        
        // Debug: Log step5Data trước khi gửi
        console.log('Step 5 Data Before Send:', step5Data);
        console.log('Step 5 Data Keys:', Object.keys(step5Data));
        console.log('Step 5 Data Values:', Object.values(step5Data));
        
        // Chuyển đổi dữ liệu sang format mà backend mong đợi
        const step5Request = {
          PaymentMethod: step5Data.selectedPaymentMethods?.join(', ') || 'Bank Transfer',
          BankAccount: JSON.stringify(step5Data.bankAccounts || []),
          TaxInfo: step5Data.taxInfo || '',
          AutoConfirm: step5Data.autoConfirm || false,
          RequirePaymentProof: step5Data.requirePaymentProof || false,
          PaymentSettings: JSON.stringify({
            selectedPaymentMethods: step5Data.selectedPaymentMethods,
            autoConfirm: step5Data.autoConfirm,
            requirePaymentProof: step5Data.requirePaymentProof
          })
        };
        
        console.log('Step 5 Request Data:', step5Request);
        console.log('Step 5 Request Data JSON:', JSON.stringify(step5Request, null, 2));
        
        await eventsAPI.updateStep4(eventId, step5Request);
        
        // Xóa dữ liệu tạm trong localStorage
        localStorage.removeItem('createEvent_step1');
        localStorage.removeItem('createEvent_step2');
        localStorage.removeItem('createEvent_step3');
        localStorage.removeItem('createEvent_step4');
        localStorage.removeItem('createEvent_step5');
        
        // Chuyển đến trang chi tiết event
        navigate(`/events/${eventId}`);
      } catch (err) {
        setError(err.message || 'Có lỗi xảy ra khi hoàn thành sự kiện');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const clearFormData = () => {
    localStorage.removeItem('createEvent_step1');
    localStorage.removeItem('createEvent_step2');
    localStorage.removeItem('createEvent_step3');
    localStorage.removeItem('createEvent_step4');
    
    // Reset all states
    setStep1Data({
      title: '',
      eventIntroduction: '',
      category: '',
      eventMode: 'Offline',
      venueName: '',
      province: '',
      district: '',
      ward: '',
      streetAddress: '',
      location: '',
      organizerName: '',
      organizerInfo: '',
      eventImage: '',
      backgroundImage: '',
      organizerLogo: ''
    });
    
    setStep2Data({
      startTime: '',
      endTime: '',
      ticketTypes: []
    });
    
    setStep3Data({
      eventStatus: 'Draft',
      priority: 'Normal',
      maxAttendees: 0,
      registrationDeadline: 0,
      contactEmail: '',
      contactPhone: '',
      internalNotes: ''
    });
    
    setStep4Data({
      selectedPaymentMethods: ['bank_transfer'],
      bankAccounts: [
        {
          bankName: 'MB Bank',
          accountNumber: '04358345653',
          accountHolder: 'Khanh Ngu da',
          isDefault: true
        }
      ],
      autoConfirm: false,
      requirePaymentProof: false,
      taxInfo: ''
    });
    
    setActiveStep(0);
    setError(null);
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        // Check all required fields for step 1
        const hasBasicFields = step1Data.title && 
                              step1Data.title.trim() !== '' &&
                       step1Data.eventIntroduction && 
                              step1Data.eventIntroduction.trim() !== '' &&
                       step1Data.category &&
                              step1Data.category.trim() !== '' &&
                       step1Data.organizerName &&
                              step1Data.organizerName.trim() !== '' &&
                       step1Data.organizerInfo &&
                              step1Data.organizerInfo.trim() !== '';
        
                       // Check event mode specific fields
        let hasLocationFields = false;
        if (step1Data.eventMode === 'Online') {
          hasLocationFields = step1Data.location && step1Data.location.trim() !== '';
        } else {
          hasLocationFields = step1Data.venueName && 
                             step1Data.venueName.trim() !== '' &&
                             step1Data.province && 
                             step1Data.province.trim() !== '' &&
                             step1Data.streetAddress && 
                             step1Data.streetAddress.trim() !== '';
        }
        
        const isValid = hasBasicFields && hasLocationFields;
        
        // Debug: Log all fields and validation status
        console.log('Step 1 Validation Debug:', {
          title: step1Data.title,
          titleValid: step1Data.title && step1Data.title.trim() !== '',
          eventIntroduction: step1Data.eventIntroduction,
          eventIntroductionValid: step1Data.eventIntroduction && step1Data.eventIntroduction.trim() !== '',
          category: step1Data.category,
          categoryValid: step1Data.category && step1Data.category.trim() !== '',
          eventMode: step1Data.eventMode,
          venueName: step1Data.venueName,
          venueNameValid: step1Data.venueName && step1Data.venueName.trim() !== '',
          province: step1Data.province,
          provinceValid: step1Data.province && step1Data.province.trim() !== '',
          streetAddress: step1Data.streetAddress,
          streetAddressValid: step1Data.streetAddress && step1Data.streetAddress.trim() !== '',
          location: step1Data.location,
          locationValid: step1Data.location && step1Data.location.trim() !== '',
          organizerName: step1Data.organizerName,
          organizerNameValid: step1Data.organizerName && step1Data.organizerName.trim() !== '',
          organizerInfo: step1Data.organizerInfo,
          organizerInfoValid: step1Data.organizerInfo && step1Data.organizerInfo.trim() !== '',
          hasBasicFields: hasBasicFields,
          hasLocationFields: hasLocationFields,
          isValid: isValid,
          allFields: step1Data
        });
        
        return isValid;
      case 1:
        // Check if all ticket types have required fields
        const validTicketTypes = step2Data.ticketTypes && step2Data.ticketTypes.length > 0 && 
          step2Data.ticketTypes.every(ticket => 
            ticket.typeName && 
            ticket.price && 
            ticket.quantity && 
            ticket.minOrder
          );
        
        const isValidStep2 = step2Data.startTime && step2Data.endTime && validTicketTypes;
        
        // Debug: Log Step 2 validation
        console.log('Step 2 Validation Debug:', {
          startTime: step2Data.startTime,
          endTime: step2Data.endTime,
          ticketTypesLength: step2Data.ticketTypes?.length || 0,
          ticketTypes: step2Data.ticketTypes,
          validTicketTypes: validTicketTypes,
          isValid: isValidStep2,
          allFields: step2Data
        });
        
        return isValidStep2;
      case 2:
        return true; // Virtual Stage is optional
      case 3:
        return true; // Settings are optional
      case 4:
        // Check if at least one payment method is selected
        const hasPaymentMethods = step5Data.selectedPaymentMethods && 
                                 step5Data.selectedPaymentMethods.length > 0;
        
        // Check if bank accounts are valid (if bank transfer is selected)
        let hasValidBankAccounts = true;
        if (step5Data.selectedPaymentMethods?.includes('bank_transfer')) {
          hasValidBankAccounts = step5Data.bankAccounts && 
                                step5Data.bankAccounts.length > 0 &&
                                step5Data.bankAccounts.every(account => 
                                  account.bankName && 
                                  account.bankName.trim() !== '' &&
                                  account.accountNumber && 
                                  account.accountNumber.trim() !== '' &&
                                  account.accountHolder && 
                                  account.accountHolder.trim() !== ''
                                );
        }
        
        const isValidStep5 = hasPaymentMethods && hasValidBankAccounts;
        
        // Debug: Log Step 5 validation
        console.log('Step 5 Validation Debug:', {
          selectedPaymentMethods: step5Data.selectedPaymentMethods,
          hasPaymentMethods: hasPaymentMethods,
          bankAccounts: step5Data.bankAccounts,
          hasValidBankAccounts: hasValidBankAccounts,
          isValid: isValidStep5,
          allFields: step5Data
        });
        
        return isValidStep5;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <EventInfoStep
            data={step1Data}
            onChange={setStep1Data}
          />
        );
      case 1:
        return (
          <DateTimeTicketStep
            data={step2Data}
            onChange={setStep2Data}
          />
        );
      case 2:
        return (
          <VirtualStageStep
            data={step3Data}
            onChange={setStep3Data}
            ticketTypes={step2Data.ticketTypes}
          />
        );
      case 3:
        return (
          <SettingsStep
            data={step4Data}
            onChange={setStep4Data}
          />
        );
      case 4:
        return (
          <PaymentStep
            data={step5Data}
            onChange={setStep5Data}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{ mb: 2 }}
          >
            Quay lại
          </Button>
          
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Tạo Sự Kiện Mới
          </Typography>
          
          <Typography variant="body1" color="text.secondary">
            Tạo sự kiện của bạn theo 4 bước đơn giản
          </Typography>
        </Box>

        <Paper sx={{ p: 3 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 4 }}>
            {renderStepContent()}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                disabled={activeStep === 0 || loading}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Quay lại
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={clearFormData}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                Xóa dữ liệu tạm
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {loading && <CircularProgress size={20} />}
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!isStepValid() || loading}
                startIcon={activeStep === steps.length - 1 ? <Save /> : null}
                sx={{ 
                  opacity: !isStepValid() ? 0.6 : 1,
                  '&:hover': {
                    opacity: !isStepValid() ? 0.6 : 1
                  }
                }}
              >
                {activeStep === steps.length - 1 ? 'Hoàn thành' : 'Tiếp tục'}
              </Button>
              {/* Debug info */}
              {activeStep === 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                  Valid: {isStepValid() ? 'Yes' : 'No'}
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default CreateEventPage;
