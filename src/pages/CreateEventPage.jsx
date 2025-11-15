import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import Header from '../components/layout/Header';
import EventInfoStep from '../components/event-creation/EventInfoStep';
import DateTimeTicketStep from '../components/event-creation/DateTimeTicketStep';
import VirtualStageStep from '../components/stage/VirtualStageStep';
import ProductStep from '../components/event-creation/ProductStep';
import SettingsStep from '../components/event-creation/SettingsStep';
import PaymentStep from '../components/event-creation/PaymentStep';
import { eventsAPI } from '../services/apiClient';
import { subscriptionAPI, subscriptionHelpers } from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  
  // Check if in edit mode
  const searchParams = new URLSearchParams(location.search);
  const editEventId = searchParams.get('edit');
  const isEditMode = !!editEventId;
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [eventId, setEventId] = useState(editEventId ? parseInt(editEventId) : null);
  const [editModeLoading, setEditModeLoading] = useState(isEditMode);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEventBeingCreated, setIsEventBeingCreated] = useState(false);
  const [shouldBlockNavigation, setShouldBlockNavigation] = useState(false);
  const [subscriptionCheckLoading, setSubscriptionCheckLoading] = useState(!isEditMode);
  const [showPendingDialog, setShowPendingDialog] = useState(false);
  const [createdEventId, setCreatedEventId] = useState(null);

  // Helper function để check xem có đang trong quá trình tạo event không
  const isInCreationProcess = () => {
    // Kiểm tra xem có data trong localStorage của bất kỳ bước nào không
    const hasStep1 = localStorage.getItem('createEvent_step1');
    const hasStep2 = localStorage.getItem('createEvent_step2');
    const hasStep3 = localStorage.getItem('createEvent_step3');
    const hasStep4 = localStorage.getItem('createEvent_step4');
    const hasStep5 = localStorage.getItem('createEvent_step5');
    const hasStep6 = localStorage.getItem('createEvent_step6');
    
    // Nếu có data ở bất kỳ bước nào và không phải edit mode, thì đang trong quá trình tạo
    if (!isEditMode && (hasStep1 || hasStep2 || hasStep3 || hasStep4 || hasStep5 || hasStep6)) {
      // Parse và check xem có data thực sự không (không phải empty object)
      try {
        if (hasStep1) {
          const step1 = JSON.parse(hasStep1);
          if (step1.title && step1.title.trim() !== '') return true;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    return false;
  };

  // State cho từng bước với localStorage (chỉ load khi edit mode)
  const [step1Data, setStep1Data] = useState(() => {
    // Chỉ load localStorage nếu đang ở edit mode
    if (isEditMode) {
      const saved = localStorage.getItem('createEvent_step1');
      return saved ? JSON.parse(saved) : getInitialStep1Data();
    }
    return getInitialStep1Data();
  });
  
  // Helper function để get initial data
  function getInitialStep1Data() {
    return {
      title: '',
      eventIntroduction: '',
      category: '',
      eventMode: 'Offline',
      campus: '',
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
  }

  const [step2Data, setStep2Data] = useState(() => {
    if (isEditMode) {
      const saved = localStorage.getItem('createEvent_step2');
      return saved ? JSON.parse(saved) : getInitialStep2Data();
    }
    return getInitialStep2Data();
  });
  
  function getInitialStep2Data() {
    return {
      startTime: '',
      endTime: '',
      ticketTypes: []
    };
  }

  const [step3Data, setStep3Data] = useState(() => {
    if (isEditMode) {
      const saved = localStorage.getItem('createEvent_step3');
      return saved ? JSON.parse(saved) : getInitialStep3Data();
    }
    return getInitialStep3Data();
  });
  
  function getInitialStep3Data() {
    return {
      hasVirtualStage: false,
      layout: null
    };
  }

  const [step4Data, setStep4Data] = useState(() => {
    if (isEditMode) {
      const saved = localStorage.getItem('createEvent_step4');
      return saved ? JSON.parse(saved) : getInitialStep4Data();
    }
    return getInitialStep4Data();
  });
  
  function getInitialStep4Data() {
    return {
      products: []
    };
  }

  const [step5Data, setStep5Data] = useState(() => {
    if (isEditMode) {
      const saved = localStorage.getItem('createEvent_step5');
      return saved ? JSON.parse(saved) : getInitialStep5Data();
    }
    return getInitialStep5Data();
  });
  
  function getInitialStep5Data() {
    return {
      eventStatus: 'Draft',
      priority: 'Normal',
      maxAttendees: 0,
      registrationDeadline: 0,
      contactEmail: '',
      contactPhone: '',
      internalNotes: ''
    };
  }

  const [step6Data, setStep6Data] = useState(() => {
    if (isEditMode) {
      const saved = localStorage.getItem('createEvent_step6');
      return saved ? JSON.parse(saved) : getInitialStep6Data();
    }
    return getInitialStep6Data();
  });
  
  function getInitialStep6Data() {
    return {
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
  }

  const steps = [
    'Thông tin cơ bản',
    'Thời gian & Loại vé',
    'Sân khấu ảo',
    'Tạo phụ kiện',
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

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('createEvent_step6', JSON.stringify(step6Data));
    }, 500);
    return () => clearTimeout(timer);
  }, [step6Data]);

  // Check subscription before allowing event creation (not edit mode)
  useEffect(() => {
    const checkSubscription = async () => {
      if (isEditMode) {
        setSubscriptionCheckLoading(false);
        return; // Skip check for edit mode
      }

      // Only check for Host users
      if (!user || user.role !== 'Host') {
        setSubscriptionCheckLoading(false);
        return;
      }

      try {
        setSubscriptionCheckLoading(true);
        const response = await subscriptionAPI.checkStatus();
        
        console.log('[CreateEventPage] Subscription check response:', response.data);
        console.log('[CreateEventPage] Full response object:', response);
        
        // Check response data structure - handle nested response
        const responseData = response.data || response;
        let canCreate = responseData?.canCreateEvent ?? responseData?.CanCreateEvent ?? false;
        const hasSubscription = responseData?.hasActiveSubscription ?? responseData?.HasActiveSubscription ?? false;
        const remainingEvents = responseData?.remainingEvents ?? responseData?.RemainingEvents ?? 0;
        const activeSubscription = responseData?.activeSubscription ?? responseData?.ActiveSubscription;
        
        // Get plan details
        const planType = activeSubscription?.planType ?? activeSubscription?.PlanType ?? '';
        const status = activeSubscription?.status ?? activeSubscription?.Status ?? '';
        const maxEventsAllowed = activeSubscription?.maxEventsAllowed ?? activeSubscription?.MaxEventsAllowed ?? 0;
        const eventsCreated = activeSubscription?.eventsCreated ?? activeSubscription?.EventsCreated ?? 0;
        
        console.log('[CreateEventPage] Subscription details:', {
          canCreate,
          hasSubscription,
          remainingEvents,
          planType,
          status,
          maxEventsAllowed,
          eventsCreated,
          message: responseData?.message ?? responseData?.Message
        });
        
        // QUAN TRỌNG: Kiểm tra xem có subscription active không
        // Nếu không có subscription hoặc subscription không active, redirect về trang subscription
        if (!hasSubscription || !activeSubscription) {
          console.warn('[CreateEventPage] No active subscription found - redirecting to subscription plans');
          navigate('/subscriptions/plans', { 
            replace: true,
            state: { message: 'Bạn cần đăng ký gói subscription để tạo sự kiện. Vui lòng mua gói subscription trước khi tạo sự kiện.' }
          });
          return;
        }
        
        // Kiểm tra status của subscription
        if (status !== 'Active') {
          console.warn('[CreateEventPage] Subscription is not active - redirecting to subscription plans', { status });
          navigate('/subscriptions/plans', { 
            replace: true,
            state: { message: `Gói subscription của bạn đang ở trạng thái "${status}". Vui lòng kích hoạt gói subscription để tạo sự kiện.` }
          });
          return;
        }
        
        // QUAN TRỌNG: Professional plan luôn cho phép tạo event (unlimited)
        // Phải check và override canCreate TRƯỚC khi check canCreate
        const isProfessional = planType === 'Professional';
        if (isProfessional && hasSubscription && status === 'Active') {
          console.log('[CreateEventPage] ✅ Professional plan detected - allowing unlimited event creation (overriding canCreate)');
          canCreate = true;
        }
        
        console.log('[CreateEventPage] Plan check:', {
          isProfessional,
          maxEventsAllowed,
          remainingEvents,
          hasSubscription,
          status,
          canCreate,
          planType
        });
        
        // Final check - nếu không thể tạo event (hết quota) - chỉ check nếu không phải Professional
        if (!canCreate && !isProfessional) {
          console.warn('[CreateEventPage] Cannot create event - redirecting to subscription plans', {
            canCreate,
            isProfessional,
            hasSubscription,
            status,
            remainingEvents,
            maxEventsAllowed,
            planType
          });
          // Redirect to subscription plans page
          navigate('/subscriptions/plans', { 
            replace: true,
            state: { 
              message: remainingEvents === 0 
                ? 'Bạn đã vượt quá giới hạn số sự kiện cho phép. Vui lòng nâng cấp gói subscription để tạo thêm sự kiện.'
                : 'Bạn cần đăng ký gói subscription để tạo sự kiện'
            }
          });
          return;
        }
        
        console.log('[CreateEventPage] ✅ Allowed to create event');
      } catch (err) {
        console.error('[CreateEventPage] Error checking subscription:', err);
        console.error('[CreateEventPage] Error details:', err.response?.data || err.message);
        
        // QUAN TRỌNG: Khi có lỗi, vẫn redirect về trang subscription để đảm bảo an toàn
        // Không cho phép tạo event nếu không thể xác minh subscription
        const errorMessage = err.response?.data?.message || 
                           err.response?.data?.error || 
                           err.message || 
                           'Không thể kiểm tra trạng thái subscription. Vui lòng thử lại sau.';
        
        console.warn('[CreateEventPage] Error checking subscription - redirecting to subscription plans for safety');
        navigate('/subscriptions/plans', { 
          replace: true,
          state: { 
            message: `Lỗi kiểm tra subscription: ${errorMessage}. Vui lòng đảm bảo bạn đã có gói subscription hợp lệ.`
          }
        });
      } finally {
        setSubscriptionCheckLoading(false);
      }
    };

    checkSubscription();
  }, [isEditMode, user, navigate]);

  // Clear localStorage when creating new event (not edit mode)
  useEffect(() => {
    if (!isEditMode) {
      // Clear all localStorage data for create mode
      localStorage.removeItem('createEvent_step1');
      localStorage.removeItem('createEvent_step2');
      localStorage.removeItem('createEvent_step3');
      localStorage.removeItem('createEvent_step4');
      localStorage.removeItem('createEvent_step5');
      localStorage.removeItem('createEvent_step6');
      console.log('Create mode: localStorage cleared');
    }
  }, []); // Run once on mount

  // Cảnh báo khi đóng tab/refresh khi đang tạo event
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Nếu đang trong quá trình tạo event (có data trong localStorage hoặc đang processing)
      if (isInCreationProcess() || isProcessing || shouldBlockNavigation) {
        e.preventDefault();
        e.returnValue = 'Bạn đang tạo sự kiện. Bạn có chắc chắn muốn rời khỏi trang này? Dữ liệu chưa hoàn thành sẽ bị mất.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isProcessing, shouldBlockNavigation]);

  // Update shouldBlockNavigation dựa trên việc có data trong quá trình tạo
  useEffect(() => {
    if (!isEditMode) {
      const inProcess = isInCreationProcess() || isProcessing;
      setShouldBlockNavigation(inProcess);
    }
  }, [step1Data, step2Data, step3Data, step4Data, step5Data, isProcessing, activeStep]);
  
  // Intercept navigation (click vào Link, navigate programmatically) khi đang tạo event
  useEffect(() => {
    if (!shouldBlockNavigation && !isInCreationProcess() && !isProcessing) {
      return; // Không cần intercept nếu không đang tạo event
    }

    const handleLinkClick = (e) => {
      const target = e.target.closest('a');
      if (target && target.getAttribute('href') && !target.getAttribute('href').startsWith('#')) {
        const href = target.getAttribute('href');
        // Bỏ qua các link ngoài app (external links, mailto, tel, etc.)
        if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:')) {
          return;
        }
        
        const confirmed = window.confirm(
          '⚠️ Bạn đang tạo sự kiện\n\n' +
          'Bạn có chắc chắn muốn rời khỏi trang này?\n\n' +
          'Nếu bạn rời khỏi, dữ liệu chưa hoàn thành sẽ bị mất và sự kiện sẽ không được tạo.'
        );
        
        if (!confirmed) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
        
        // User confirmed - clear localStorage and allow navigation
        localStorage.removeItem('createEvent_step1');
        localStorage.removeItem('createEvent_step2');
        localStorage.removeItem('createEvent_step3');
        localStorage.removeItem('createEvent_step4');
        localStorage.removeItem('createEvent_step5');
        localStorage.removeItem('createEvent_step6');
        setShouldBlockNavigation(false);
      }
    };

    // Use capture phase to intercept early
    document.addEventListener('click', handleLinkClick, true);
    
    // Intercept browser back/forward buttons
    const handlePopState = (e) => {
      if (shouldBlockNavigation || isInCreationProcess() || isProcessing) {
        const confirmed = window.confirm(
          '⚠️ Bạn đang tạo sự kiện\n\n' +
          'Bạn có chắc chắn muốn rời khỏi trang này?\n\n' +
          'Nếu bạn rời khỏi, dữ liệu chưa hoàn thành sẽ bị mất và sự kiện sẽ không được tạo.'
        );
        
        if (!confirmed) {
          // Push current state back to prevent navigation
          window.history.pushState(null, '', window.location.href);
        } else {
          // User confirmed - clear localStorage
          localStorage.removeItem('createEvent_step1');
          localStorage.removeItem('createEvent_step2');
          localStorage.removeItem('createEvent_step3');
          localStorage.removeItem('createEvent_step4');
          localStorage.removeItem('createEvent_step5');
          setShouldBlockNavigation(false);
        }
      }
    };
    
    // Push current state to enable popstate detection
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleLinkClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [shouldBlockNavigation, isProcessing]);

  // Load event data when in edit mode
  useEffect(() => {
    if (isEditMode && editEventId) {
      loadEventData();
    }
  }, [isEditMode, editEventId]);

  const loadEventData = async () => {
    try {
      setEditModeLoading(true);
      const response = await eventsAPI.getById(parseInt(editEventId));
      const eventData = response.data;
      
      console.log('Loading event data for edit:', eventData);
      
      // Load step 1 data
      const eventDetails = eventData.eventDetails || {};
      
      // QUAN TRỌNG: Lấy organizerInfo từ trường riêng biệt organizerInfo, không phải từ eventDetails
      const organizerInfo = eventData.organizerInfo || {};
      
      // Lấy eventImage và backgroundImage từ nhiều nguồn (ưu tiên eventImage trực tiếp, sau đó eventDetails)
      const eventImage = eventData.eventImage || eventDetails.eventImage || '';
      const backgroundImage = eventData.backgroundImage || eventDetails.backgroundImage || '';
      
      console.log('Loading event data for edit:', { 
        eventData,
        eventDetails,
        organizerInfo,
        eventDataImage: eventData.eventImage, 
        eventDetailsImage: eventDetails.eventImage,
        finalEventImage: eventImage,
        eventDataBg: eventData.backgroundImage,
        eventDetailsBg: eventDetails.backgroundImage,
        finalBackgroundImage: backgroundImage
      });
      
      setStep1Data({
        title: eventData.title || '',
        eventIntroduction: eventData.description || '',
        category: eventData.category || '',
        eventMode: eventData.eventMode || 'Offline',
        campus: eventData.campus || eventDetails.province || '',
        venueName: eventDetails.venueName || '',
        province: eventDetails.province || '',
        district: eventDetails.district || '',
        ward: eventDetails.ward || '',
        streetAddress: eventDetails.streetAddress || '',
        location: eventData.location || '',
        // QUAN TRỌNG: Lấy từ organizerInfo riêng biệt, không phải từ eventDetails
        organizerName: organizerInfo.organizerName || '',
        organizerInfo: organizerInfo.organizerInfo || '',
        eventImage: eventImage,
        backgroundImage: backgroundImage,
        organizerLogo: organizerInfo.organizerLogo || ''
      });
      
      // Load step 2 data
      setStep2Data({
        startTime: eventData.startTime || '',
        endTime: eventData.endTime || '',
        ticketTypes: eventData.ticketTypes || []
      });
      
      // Load step 3 data - venue layout
      setStep3Data({
        hasVirtualStage: eventData.venueLayout ? true : false,
        layout: eventData.venueLayout || null
      });
      
      // Load step 4 data - products
      try {
        const { productsAPI } = await import('../services/apiClient');
        const productsResponse = await productsAPI.getByEvent(parseInt(editEventId));
        console.log('Products response:', productsResponse);
        
        // Handle both direct array and wrapped response
        let productsArray = [];
        if (productsResponse?.data) {
          if (Array.isArray(productsResponse.data)) {
            productsArray = productsResponse.data;
          } else if (Array.isArray(productsResponse.data.data)) {
            productsArray = productsResponse.data.data;
          } else if (productsResponse.data.data && typeof productsResponse.data.data === 'object') {
            productsArray = [productsResponse.data.data];
          }
        }
        
        // Convert products to form format
        const formProducts = productsArray.map(p => ({
          name: p.name || '',
          image: p.image || '',
          price: p.price || 0,
          quantity: p.quantity || 0,
          isFree: (p.price === 0 || p.price === null),
          productId: p.productId // Keep ID for update/delete
        }));
        
        setStep4Data({
          enableProducts: formProducts.length > 0,
          products: formProducts
        });
        
        console.log('Loaded products for edit:', formProducts);
      } catch (productErr) {
        console.warn('Error loading products for edit:', productErr);
        // Set empty products if error
        setStep4Data({
          enableProducts: false,
          products: []
        });
      }
      
      setEditModeLoading(false);
    } catch (err) {
      console.error('Error loading event data:', err);
      setError('Không thể tải dữ liệu sự kiện');
      setEditModeLoading(false);
    }
  };


  // Lưu ý: useBlocker không có trong phiên bản React Router này
  // Tuy nhiên, đã có các bảo vệ khác như isProcessing flag và validation
  // để ngăn không cho tạo event tự động

  const handleNext = async () => {
    // QUAN TRỌNG: Ngăn xử lý nếu đang có action khác đang chạy
    if (isProcessing) {
      console.log('Already processing, ignoring duplicate call');
      return;
    }
    
    // QUAN TRỌNG: Chỉ cho phép handleNext khi người dùng chủ động ấn nút
    // Không cho phép gọi tự động từ bất kỳ đâu
    console.log('handleNext called - step:', activeStep, 'eventId:', eventId, 'isProcessing:', isProcessing);
    
    // Set processing flag để ngăn duplicate calls
    setIsProcessing(true);
    
    try {
    if (activeStep === 0) {
        // QUAN TRỌNG: Chỉ tạo event khi người dùng chủ động ấn nút "Tiếp tục"
        // Không cho phép tạo event tự động
        if (isEventBeingCreated) {
          console.log('Event creation already in progress, ignoring duplicate call');
          setIsProcessing(false);
          return;
        }

      // Bước 1: Tạo event cơ bản
        setIsEventBeingCreated(true);
        setShouldBlockNavigation(true); // Block navigation khi đang tạo event
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
          setIsEventBeingCreated(false);
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
        
        if (isEditMode && eventId) {
          // Update existing event
          const response = await eventsAPI.update(eventId, eventData);
          console.log('Update response:', response);
          
          // Sử dụng data từ response nếu có, nếu không thì reload từ API
          let updatedData = null;
          let updatedEventDetails = {};
          
          if (response.data?.eventData) {
            // Backend trả về event data trong response
            updatedData = response.data.eventData;
            updatedEventDetails = updatedData.eventDetails || {};
            console.log('Using event data from update response');
          } else {
            // Reload event data from backend to ensure we have the latest data
            try {
              const updatedEvent = await eventsAPI.getById(eventId);
              updatedData = updatedEvent.data;
              updatedEventDetails = updatedData.eventDetails || {};
              console.log('Reloaded event data from API');
            } catch (reloadError) {
              console.error('Error reloading event data after update:', reloadError);
              // Continue anyway - the update was successful
            }
          }
          
          if (updatedData) {
            // Update step1Data with the latest data from backend
            // QUAN TRỌNG: Ưu tiên lấy từ eventImage/backgroundImage trực tiếp, sau đó mới đến eventDetails
            const updatedEventImage = updatedData.eventImage || updatedEventDetails.eventImage || '';
            const updatedBackgroundImage = updatedData.backgroundImage || updatedEventDetails.backgroundImage || '';
            const updatedOrganizerLogo = (updatedEventDetails.organizerLogo || '').replace('/uploads/', '/assets/images/');
            
            console.log('Updating step1Data with backend data:', {
              eventImage: updatedEventImage,
              backgroundImage: updatedBackgroundImage,
              organizerLogo: updatedOrganizerLogo,
              updatedAt: updatedData.updatedAt
            });
            
            setStep1Data(prev => ({
              ...prev,
              eventImage: updatedEventImage,
              backgroundImage: updatedBackgroundImage,
              // Also update other fields to ensure sync
              title: updatedData.title || prev.title,
              eventIntroduction: updatedData.description || prev.eventIntroduction,
              category: updatedData.category || prev.category,
              eventMode: updatedData.eventMode || prev.eventMode,
              location: updatedData.location || prev.location,
              venueName: updatedEventDetails.venueName || prev.venueName,
              province: updatedEventDetails.province || prev.province,
              district: updatedEventDetails.district || prev.district,
              ward: updatedEventDetails.ward || prev.ward,
              streetAddress: updatedEventDetails.streetAddress || prev.streetAddress,
              organizerName: updatedEventDetails.organizerName || prev.organizerName,
              organizerInfo: updatedEventDetails.organizerInfo || prev.organizerInfo,
              organizerLogo: updatedOrganizerLogo || prev.organizerLogo
            }));
          }
        } else {
          // QUAN TRỌNG: KHÔNG tạo event ở bước 1 - chỉ lưu vào localStorage
          // Event sẽ chỉ được tạo khi hoàn thành bước 5
          console.log('Step 1 completed - Data saved to localStorage only. Event will be created at step 5.');
          // Không set eventId - vì chưa tạo event
        }
        
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
        
    } else if (activeStep === 1) {
        // Bước 2: Lưu thời gian và ticket types vào localStorage
        // QUAN TRỌNG: Không tạo/update event ở bước này - chỉ lưu vào localStorage
        // Event sẽ chỉ được tạo khi hoàn thành bước 5
        
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
            
            // Cho phép giá vé = 0 hợp lệ; chỉ reject nếu null/empty/NaN hoặc < 0
            const priceNum = parseFloat(ticket.price);
            if (ticket.price === '' || ticket.price === null || isNaN(priceNum) || priceNum < 0) {
              throw new Error(`Giá vé ${index + 1} không hợp lệ`);
            }
            
            // Số lượng phải >= 1
            if (!ticket.quantity || parseInt(ticket.quantity) < 1) {
              throw new Error(`Số lượng vé ${index + 1} phải lớn hơn 0`);
            }
            
            const minOrder = parseInt(ticket.minOrder) || 1;
            const maxOrder = parseInt(ticket.maxOrder) || 10;
            const quantity = parseInt(ticket.quantity) || 0;
            
            // Kiểm tra đơn hàng tối thiểu không được vượt quá hoặc bằng đơn hàng tối đa
            if (maxOrder > 0 && minOrder >= maxOrder) {
              throw new Error(`Đơn hàng tối thiểu phải nhỏ hơn đơn hàng tối đa cho vé ${index + 1}`);
            }
            
            // Kiểm tra đơn hàng tối thiểu không được vượt quá số lượng vé
            if (minOrder > quantity) {
              throw new Error(`Đơn hàng tối thiểu không được vượt quá số lượng vé cho vé ${index + 1}`);
            }
            
            // Kiểm tra đơn hàng tối đa không được vượt quá số lượng vé
            if (maxOrder > quantity) {
              throw new Error(`Đơn hàng tối đa không được vượt quá số lượng vé cho vé ${index + 1}`);
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
              Price: Math.max(0, isNaN(parseFloat(ticket.price)) ? 0 : parseFloat(ticket.price)),
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
        
        // QUAN TRỌNG: Chỉ lưu vào localStorage, không gọi API
        // Event sẽ chỉ được tạo khi hoàn thành bước 5
        console.log('Step 2 completed - Data saved to localStorage only. Event will be created at step 5.');
        
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
        
    } else if (activeStep === 2) {
        // Bước 3: Virtual Stage - Lưu venue layout vào localStorage
        // QUAN TRỌNG: Không tạo/update event ở bước này - chỉ lưu vào localStorage
        // Event sẽ chỉ được tạo khi hoàn thành bước 6
        
        setLoading(true);
        setError(null);
        
        console.log('Step 3 Data (Venue Layout):', step3Data);
        console.log('Step 3 completed - Data saved to localStorage only. Event will be created at step 6.');
        
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
        setLoading(false);
        setIsProcessing(false);
        
      } else if (activeStep === 3) {
        // Bước 4: Tạo phụ kiện - Lưu vào localStorage
        // QUAN TRỌNG: Không tạo/update event ở bước này - chỉ lưu vào localStorage
        // Event sẽ chỉ được tạo khi hoàn thành bước 6
        
        setLoading(true);
        setError(null);
        
        console.log('Step 4 Data (Products):', step4Data);
        console.log('Step 4 completed - Data saved to localStorage only. Event will be created at step 6.');
        
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
        setLoading(false);
        setIsProcessing(false);
        
      } else if (activeStep === 4) {
        // Bước 5: Cập nhật cài đặt - Lưu vào localStorage
        // QUAN TRỌNG: Không tạo/update event ở bước này - chỉ lưu vào localStorage
        // Event sẽ chỉ được tạo khi hoàn thành bước 6
        
        setLoading(true);
        setError(null);
        
        console.log('Step 5 Data (Settings):', step5Data);
        console.log('Step 5 completed - Data saved to localStorage only. Event will be created at step 6.');
        
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
        setLoading(false);
        setIsProcessing(false);
        
      } else if (activeStep === 5) {
        // Bước 6: Hoàn thành
        // Nếu đang edit mode: Cập nhật event với tất cả các bước
        // Nếu tạo mới: Tạo event hoàn chỉnh với tất cả 6 bước cùng lúc

        setLoading(true);
        setError(null);
        
        if (isEditMode && eventId) {
          console.log('=== Updating Complete Event ===');
          console.log('EventId:', eventId);
        } else {
          console.log('=== Creating Complete Event ===');
        }
        console.log('Step 1 Data:', step1Data);
        console.log('Step 2 Data:', step2Data);
        console.log('Step 3 Data:', step3Data);
        console.log('Step 4 Data (Products):', step4Data);
        console.log('Step 5 Data (Settings):', step5Data);
        console.log('Step 6 Data (Payment):', step6Data);
        
        // Đảm bảo step6Data có giá trị
        if (!step6Data) {
          setError('Dữ liệu thanh toán không hợp lệ. Vui lòng kiểm tra lại bước 6.');
          setIsEventBeingCreated(false);
          setShouldBlockNavigation(false);
          return;
        }
        
        // Đảm bảo có ít nhất một phương thức thanh toán được chọn
        const selectedMethods = step6Data.selectedPaymentMethods || [];
        if (selectedMethods.length === 0) {
          setError('Vui lòng chọn ít nhất một phương thức thanh toán.');
          setIsEventBeingCreated(false);
          setShouldBlockNavigation(false);
          return;
        }
        
        // Validation: Kiểm tra bank accounts nếu chọn bank_transfer
        const hasBankTransfer = selectedMethods.includes('bank_transfer');
        if (hasBankTransfer) {
          const validBankAccounts = (step6Data.bankAccounts || []).filter(account => 
            account && account.bankName && account.bankName.trim() !== '' &&
            account.accountNumber && account.accountNumber.trim() !== '' &&
            account.accountHolder && account.accountHolder.trim() !== ''
          );
          
          if (validBankAccounts.length === 0) {
            setError('Vui lòng thêm ít nhất một tài khoản ngân hàng hợp lệ khi chọn phương thức chuyển khoản ngân hàng.');
            setIsEventBeingCreated(false);
            setShouldBlockNavigation(false);
            return;
          }
        }
        
        // Chuẩn bị location string từ step1Data
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

        // Chuẩn bị ticket types từ step2Data
        const ticketTypes = (step2Data.ticketTypes || []).map(ticket => ({
          typeName: ticket.typeName || '',
          price: ticket.price || 0,
          quantity: ticket.quantity || 0,
          minOrder: ticket.minOrder || 1,
          maxOrder: ticket.maxOrder || 10,
          saleStart: ticket.saleStart ? new Date(ticket.saleStart).toISOString() : new Date().toISOString(),
          saleEnd: ticket.saleEnd ? new Date(ticket.saleEnd).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: ticket.status || 'Active'
        }));

        // Chuẩn bị venue layout từ step3Data
        let venueLayout = null;
        if (step3Data && step3Data.hasVirtualStage && step3Data.layout) {
          // PATCH: TỰ ĐỘNG BỔ SUNG LINKEDTICKET nếu cần
          const ticketTypesMap = new Map((step2Data.ticketTypes || []).map(ticket => [ticket.ticketTypeId || ticket.id || ticket.idAuto, ticket]));
          venueLayout = {
            hasVirtualStage: step3Data.layout.hasVirtualStage || false,
            canvasWidth: step3Data.layout.canvasWidth || 1000,
            canvasHeight: step3Data.layout.canvasHeight || 800,
            areas: (step3Data.layout.areas || []).map(area => {
              let linkedAuto = area.linkedTicket;
              // Nếu chỉ có ticketTypeId mà không có snapshot thì tự động gắn snapshot
              if (area.ticketTypeId !== undefined && area.ticketTypeId !== null) {
                // Ưu tiên linkedTicket nếu đã có đúng snapshot (dạng object), nếu chưa có thì bổ sung từ ticketTypes
                if (!linkedAuto || typeof linkedAuto !== 'object' || !linkedAuto.typeName) {
                  // Tìm vé đúng typeId
                  const matched = (step2Data.ticketTypes || []).find(ticket => Number(ticket.ticketTypeId) === Number(area.ticketTypeId));
                  if (matched) {
                    linkedAuto = {
                      ticketTypeId: matched.ticketTypeId,
                      typeName: matched.typeName,
                      price: matched.price,
                      quantity: matched.quantity,
                      minOrder: matched.minOrder,
                      maxOrder: matched.maxOrder,
                      saleStart: matched.saleStart,
                      saleEnd: matched.saleEnd,
                      status: matched.status
                    };
                  }
                }
              }
              return {
                ...area,
                ticketTypeId: area.ticketTypeId || null,
                linkedTicket: area.ticketTypeId ? linkedAuto : null
              }
            })
          };
        }

        // Tạo complete event request
        const completeEventRequest = {
          // Step 1
          title: step1Data.title || '',
          description: step1Data.eventIntroduction || '',
          eventMode: step1Data.eventMode || 'Offline',
          location: locationString,
          venueName: step1Data.venueName || '',
          province: step1Data.province || '',
          district: step1Data.district || '',
          ward: step1Data.ward || '',
          streetAddress: step1Data.streetAddress || '',
          eventType: step1Data.eventType || 'Public',
          category: step1Data.category || '',
          campus: step1Data.campus || '', // Thêm campus vào request
          eventImage: step1Data.eventImage || '',
          backgroundImage: step1Data.backgroundImage || '',
          eventIntroduction: step1Data.eventIntroduction || '',
          eventDetails: step1Data.eventDetails || step1Data.eventIntroduction || '',
          specialGuests: step1Data.specialGuests || '',
          specialExperience: step1Data.specialExperience || '',
          termsAndConditions: step1Data.termsAndConditions || '',
          childrenTerms: step1Data.childrenTerms || '',
          vatTerms: step1Data.vatTerms || '',
          organizerLogo: step1Data.organizerLogo || '',
          organizerName: step1Data.organizerName || '',
          organizerInfo: step1Data.organizerInfo || '',
          // Step 2
          startTime: step2Data.startTime ? new Date(step2Data.startTime).toISOString() : new Date().toISOString(),
          endTime: step2Data.endTime ? new Date(step2Data.endTime).toISOString() : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          ticketTypes: ticketTypes,
          // Step 3
          venueLayout: venueLayout,
          // Step 4 - Products (optional)
          products: step4Data?.products || [],
          // Step 5 - Settings (optional)
          eventSettings: step5Data ? JSON.stringify(step5Data) : null,
          // Step 6
          paymentMethod: (step6Data.selectedPaymentMethods || []).join(', ') || 'cash',
          // Chỉ gửi bank accounts hợp lệ (có đầy đủ thông tin) nếu có bank_transfer
          bankAccount: (() => {
            const hasBankTransfer = (step6Data.selectedPaymentMethods || []).includes('bank_transfer');
            if (!hasBankTransfer) {
              return ''; // Không cần bank account nếu không chọn bank_transfer
            }
            const validAccounts = (step6Data.bankAccounts || []).filter(account => 
              account && account.bankName && account.bankName.trim() !== '' &&
              account.accountNumber && account.accountNumber.trim() !== '' &&
              account.accountHolder && account.accountHolder.trim() !== ''
            );
            return validAccounts.length > 0 ? JSON.stringify(validAccounts) : '';
          })(),
          taxInfo: step6Data.taxInfo || ''
        };
        
        console.log('=== Complete Event Request ===');
        console.log('Complete Event Request:', completeEventRequest);
        console.log('Complete Event Request JSON:', JSON.stringify(completeEventRequest, null, 2));
        console.log('PaymentMethod:', completeEventRequest.paymentMethod);
        console.log('BankAccount:', completeEventRequest.bankAccount);
        console.log('TicketTypes count:', completeEventRequest.ticketTypes?.length || 0);
        console.log('StartTime:', completeEventRequest.startTime);
        console.log('EndTime:', completeEventRequest.endTime);
        
        if (isEditMode && eventId) {
          // CẬP NHẬT EVENT: Gọi tuần tự các API update cho từng bước
          console.log('Updating existing event with all steps...');
          
          try {
            // Step 1: Update event info
            const updateStep1Data = {
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
              campus: step1Data.campus || '', // Thêm campus vào request
              location: locationString,
              eventImage: step1Data.eventImage || '',
              backgroundImage: step1Data.backgroundImage || '',
              eventIntroduction: step1Data.eventIntroduction || '',
              organizerLogo: step1Data.organizerLogo || '',
              organizerName: step1Data.organizerName || '',
              organizerInfo: step1Data.organizerInfo || ''
            };
            await eventsAPI.update(eventId, updateStep1Data);
            console.log('Step 1 updated successfully');
            
            // Step 2: Update time and tickets
            const updateStep2Data = {
              startTime: step2Data.startTime ? new Date(step2Data.startTime).toISOString() : new Date().toISOString(),
              endTime: step2Data.endTime ? new Date(step2Data.endTime).toISOString() : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              ticketTypes: ticketTypes.map(t => ({
                typeName: t.typeName,
                price: t.price,
                quantity: t.quantity,
                minOrder: t.minOrder,
                maxOrder: t.maxOrder,
                saleStart: t.saleStart,
                saleEnd: t.saleEnd,
                status: t.status || 'Active'
              }))
            };
            await eventsAPI.updateStep2(eventId, updateStep2Data);
            console.log('Step 2 updated successfully');
            
            // Step 3: Update venue layout
            if (venueLayout) {
              await eventsAPI.updateStep3(eventId, { venueLayout: venueLayout });
              console.log('Step 3 updated successfully');
            }
            
            console.log('Event updated successfully with ID:', eventId);
            
            // Xử lý products: xóa cũ và tạo mới
              try {
                const { productsAPI } = await import('../services/apiClient');
              
              // Lấy danh sách products hiện có
              const existingProductsResponse = await productsAPI.getByEvent(eventId);
              let existingProducts = [];
              if (existingProductsResponse?.data) {
                if (Array.isArray(existingProductsResponse.data)) {
                  existingProducts = existingProductsResponse.data;
                } else if (Array.isArray(existingProductsResponse.data.data)) {
                  existingProducts = existingProductsResponse.data.data;
                }
              }
              
              // Xóa tất cả products cũ
              for (const existingProduct of existingProducts) {
                try {
                  await productsAPI.delete(existingProduct.productId);
                  console.log(`Deleted old product: ${existingProduct.productId}`);
                } catch (deleteError) {
                  console.error(`Error deleting product ${existingProduct.productId}:`, deleteError);
                  // Continue với product tiếp theo
                }
              }
              
              // Tạo products mới nếu có
              if (step4Data?.products && step4Data.products.length > 0) {
                for (const product of step4Data.products) {
                  if (product.name && product.name.trim()) {
                    await productsAPI.create({
                      eventId: eventId,
                      name: product.name,
                      image: product.image || '',
                      price: product.isFree ? 0 : (product.price || 0),
                      quantity: product.quantity || 0
                    });
                  }
                }
                console.log('Products updated successfully');
              } else {
                console.log('No products to create');
              }
              } catch (productError) {
              console.error('Error updating products:', productError);
                // Không throw error vì products là optional
            }
            
            // Xóa dữ liệu tạm trong localStorage
            localStorage.removeItem('createEvent_step1');
            localStorage.removeItem('createEvent_step2');
            localStorage.removeItem('createEvent_step3');
            localStorage.removeItem('createEvent_step4');
            localStorage.removeItem('createEvent_step5');
            localStorage.removeItem('createEvent_step6');
            
            // QUAN TRỌNG: Đánh dấu event đã được update để HomePage reload
            sessionStorage.setItem('eventUpdated', Date.now().toString());
            
            // Kiểm tra status của event sau khi update
            try {
              const eventResponse = await eventsAPI.getById(eventId);
              const eventStatus = eventResponse.data?.status || eventResponse.data?.Status;
              
              console.log('Event status after update:', eventStatus);
              
              // Nếu status = "Pending", hiển thị dialog thông báo
              if (eventStatus === 'Pending') {
                setCreatedEventId(eventId);
                setShowPendingDialog(true);
                // Không navigate ngay, đợi user đóng dialog
              } else {
                // Nếu status khác Pending, chuyển đến trang chi tiết event
                navigate(`/event/${eventId}`);
              }
            } catch (statusError) {
              console.error('Error checking event status:', statusError);
              // Nếu không thể lấy status, giả sử là Pending và hiển thị dialog
              setCreatedEventId(eventId);
              setShowPendingDialog(true);
            }
            
          } catch (updateError) {
            console.error('Error updating event:', updateError);
            throw updateError;
          }
          
        } else {
          // TẠO MỚI EVENT: Gọi API tạo event hoàn chỉnh
          const response = await eventsAPI.createCompleteEvent(completeEventRequest);
          
          // Kiểm tra nếu có lỗi validation từ backend
          if (response.data && response.data.completed === false && response.data.errors) {
            const errorMessages = response.data.errors;
            const errorText = 'Không thể tạo sự kiện:\n' + errorMessages.join('\n');
            setError(errorText);
            
            // Tự động chuyển đến bước có lỗi đầu tiên
            const firstError = errorMessages[0];
            if (firstError.includes('Bước 1')) {
              setActiveStep(0);
            } else if (firstError.includes('Bước 2')) {
              setActiveStep(1);
            } else if (firstError.includes('Bước 3')) {
              setActiveStep(2);
            } else if (firstError.includes('Bước 4')) {
              setActiveStep(3);
            } else if (firstError.includes('Bước 5')) {
              setActiveStep(4);
            }
            
            return; // Không tiếp tục nếu có lỗi
          }
          
          // Lấy eventId từ response
          const newEventId = response.data.eventId;
          console.log('Event created successfully with ID:', newEventId);
          
          // Tạo products nếu có
          if (step4Data?.products && step4Data.products.length > 0) {
            try {
              const { productsAPI } = await import('../services/apiClient');
              for (const product of step4Data.products) {
                if (product.name && product.name.trim()) {
                  await productsAPI.create({
                    eventId: newEventId,
                    name: product.name,
                    image: product.image || '',
                    price: product.isFree ? 0 : (product.price || 0),
                    quantity: product.quantity || 0
                  });
                }
              }
              console.log('Products created successfully');
            } catch (productError) {
              console.error('Error creating products:', productError);
              // Không throw error vì products là optional
            }
          }
          
          // Xóa dữ liệu tạm trong localStorage
          localStorage.removeItem('createEvent_step1');
          localStorage.removeItem('createEvent_step2');
          localStorage.removeItem('createEvent_step3');
          localStorage.removeItem('createEvent_step4');
          localStorage.removeItem('createEvent_step5');
          localStorage.removeItem('createEvent_step6');
          
          // Kiểm tra status của event vừa tạo
          try {
            const eventResponse = await eventsAPI.getById(newEventId);
            const eventStatus = eventResponse.data?.status || eventResponse.data?.Status;
            
            console.log('Event status after creation:', eventStatus);
            
            // Nếu status = "Pending", hiển thị dialog thông báo
            if (eventStatus === 'Pending') {
              setCreatedEventId(newEventId);
              setShowPendingDialog(true);
              // Không navigate ngay, đợi user đóng dialog
            } else {
              // Nếu status khác Pending (không nên xảy ra), chuyển đến trang chi tiết event
              navigate(`/event/${newEventId}`);
            }
          } catch (statusError) {
            console.error('Error checking event status:', statusError);
            // Nếu không thể lấy status, giả sử là Pending và hiển thị dialog
            setCreatedEventId(newEventId);
            setShowPendingDialog(true);
          }
        }
        
      }
      
      // Catch và finally chung cho tất cả các bước
      } catch (err) {
      console.error('Error in handleNext:', err);
      
      // Xử lý lỗi cho từng bước
      if (activeStep === 0) {
        setError(err.message || 'Có lỗi xảy ra khi tạo sự kiện');
        setIsEventBeingCreated(false);
        setShouldBlockNavigation(false);
      } else if (activeStep === 5) {
        // Xử lý lỗi đặc biệt cho bước 6 (validation errors từ backend)
        console.error('Error in step 6 (Payment):', err);
        console.error('Error response:', err.response);
        console.error('Error response data:', err.response?.data);
        console.error('Error originalError:', err.originalError);
        
        // Kiểm tra cả err.response.data và err.originalError?.response?.data
        const errorData = err.response?.data || err.originalError?.response?.data;
        
        if (errorData) {
          // Nếu có danh sách lỗi validation
          if (errorData.errors && Array.isArray(errorData.errors)) {
            const errorMessage = 'Không thể tạo sự kiện:\n' + errorData.errors.join('\n');
            setError(errorMessage);
            
            // Tự động chuyển đến bước có lỗi đầu tiên
            const firstError = errorData.errors[0];
            if (firstError.includes('Bước 1')) {
              setActiveStep(0);
            } else if (firstError.includes('Bước 2')) {
              setActiveStep(1);
            } else if (firstError.includes('Bước 3')) {
              setActiveStep(2);
            } else if (firstError.includes('Bước 4')) {
              setActiveStep(3);
            } else if (firstError.includes('Bước 5')) {
              setActiveStep(4);
            }
          } else if (errorData.message) {
            let fullErrorMessage = errorData.message;
            
            // Thêm error details nếu có
            if (errorData.error) {
              fullErrorMessage += `\n\nChi tiết: ${errorData.error}`;
            }
            
            // Thêm details array nếu có (từ backend)
            if (errorData.details && Array.isArray(errorData.details)) {
              fullErrorMessage += '\n\n' + errorData.details.join('\n');
            }
            
            // Thêm innerException nếu có
            if (errorData.innerException) {
              fullErrorMessage += `\n\nLỗi chi tiết: ${errorData.innerException}`;
            }
            
            setError(fullErrorMessage);
          } else {
            setError(err.apiErrorMessage || err.message || 'Có lỗi xảy ra khi hoàn thành sự kiện. Vui lòng kiểm tra console để xem chi tiết.');
          }
        } else {
          // Nếu không có errorData, thử lấy từ err.message hoặc apiErrorMessage
          setError(err.apiErrorMessage || err.message || 'Có lỗi xảy ra khi hoàn thành sự kiện. Vui lòng kiểm tra console để xem chi tiết.');
        }
        setIsEventBeingCreated(false);
        setShouldBlockNavigation(false);
      } else {
        setError(err.message || `Có lỗi xảy ra khi xử lý bước ${activeStep + 1}`);
      }
      } finally {
        setLoading(false);
      setIsProcessing(false);
      
      // Không cần block navigation nữa vì event chỉ được tạo ở bước 5
      // Nếu navigate away từ bước 1-4, chỉ mất data trong localStorage, không có event nào được tạo
      setShouldBlockNavigation(false);
      setIsEventBeingCreated(false);
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
    localStorage.removeItem('createEvent_step5');
    localStorage.removeItem('createEvent_step6');
    
    // Reset all states
    setStep1Data({
      title: '',
      eventIntroduction: '',
      category: '',
      eventMode: 'Offline',
      campus: '',
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
      hasVirtualStage: false,
      layout: null
    });
    
    setStep4Data({
      products: []
    });
    
    setStep5Data({
      eventStatus: 'Draft',
      priority: 'Normal',
      maxAttendees: 0,
      registrationDeadline: 0,
      contactEmail: '',
      contactPhone: '',
      internalNotes: ''
    });
    
    setStep6Data({
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
          step2Data.ticketTypes.every(ticket => {
            const hasName = !!(ticket.typeName && ticket.typeName.trim() !== '');
            const priceNum = Number(ticket.price);
            const hasValidPrice = ticket.price === 0 || (!isNaN(priceNum) && priceNum >= 0);
            const qtyNum = Number(ticket.quantity);
            const hasValidQty = !isNaN(qtyNum) && qtyNum >= 1;
            const minOrderNum = Number(ticket.minOrder);
            const hasMinOrder = !isNaN(minOrderNum) && minOrderNum >= 1;
            
            // Kiểm tra các điều kiện validation mới
            const quantity = parseInt(ticket.quantity) || 0;
            const minOrder = parseInt(ticket.minOrder) || 0;
            const maxOrder = parseInt(ticket.maxOrder) || 0;
            
            // Đơn hàng tối thiểu phải nhỏ hơn đơn hàng tối đa (chỉ kiểm tra nếu maxOrder > 0)
            const validMinMaxOrder = maxOrder === 0 || minOrder < maxOrder;
            
            // Đơn hàng tối thiểu không được vượt quá số lượng vé (chỉ kiểm tra nếu quantity > 0)
            const validMinOrderQuantity = quantity === 0 || minOrder <= quantity;
            
            // Đơn hàng tối đa không được vượt quá số lượng vé (chỉ kiểm tra nếu quantity > 0 và maxOrder > 0)
            const validMaxOrderQuantity = maxOrder === 0 || quantity === 0 || maxOrder <= quantity;
            
            return hasName && hasValidPrice && hasValidQty && hasMinOrder && 
                   validMinMaxOrder && validMinOrderQuantity && validMaxOrderQuantity;
          });
        
        // Start < End (không cho bằng hoặc đảo ngược)
        const hasValidTimeRange = !!step2Data.startTime && !!step2Data.endTime &&
          new Date(step2Data.startTime) < new Date(step2Data.endTime);
        
        const isValidStep2 = hasValidTimeRange && validTicketTypes;
        
        // Debug: Log Step 2 validation
        console.log('Step 2 Validation Debug:', {
          startTime: step2Data.startTime,
          endTime: step2Data.endTime,
          timeRangeValid: hasValidTimeRange,
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
        return true; // Products are optional
      case 4:
        return true; // Settings are optional
      case 5:
        // Check if at least one payment method is selected
        const hasPaymentMethods = step6Data.selectedPaymentMethods && 
                                 step6Data.selectedPaymentMethods.length > 0;
        
        // Check if bank accounts are valid (if bank transfer is selected)
        let hasValidBankAccounts = true;
        if (step6Data.selectedPaymentMethods?.includes('bank_transfer')) {
          hasValidBankAccounts = step6Data.bankAccounts && 
                                step6Data.bankAccounts.length > 0 &&
                                step6Data.bankAccounts.every(account => 
                                  account.bankName && 
                                  account.bankName.trim() !== '' &&
                                  account.accountNumber && 
                                  account.accountNumber.trim() !== '' &&
                                  account.accountHolder && 
                                  account.accountHolder.trim() !== ''
                                );
        }
        
        const isValidStep5 = hasPaymentMethods && hasValidBankAccounts;
        
        // Debug: Log Step 6 validation (activeStep === 5 means step 6)
        console.log('Step 6 Validation Debug:', {
          step6Data: step6Data,
          selectedPaymentMethods: step6Data?.selectedPaymentMethods,
          hasPaymentMethods: hasPaymentMethods,
          bankAccounts: step6Data?.bankAccounts,
          hasValidBankAccounts: hasValidBankAccounts,
          isValid: isValidStep5
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
            step1Data={step1Data}
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
          <ProductStep
            data={step4Data}
            onChange={setStep4Data}
            eventId={eventId}
          />
        );
      case 4:
        return (
          <SettingsStep
            data={step5Data}
            onChange={setStep5Data}
          />
        );
      case 5:
        return (
          <PaymentStep
            data={step6Data}
            onChange={setStep6Data}
          />
        );
      default:
        return null;
    }
  };

  // Show loading while checking subscription
  if (subscriptionCheckLoading) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <Header />
        <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Đang kiểm tra subscription...
          </Typography>
        </Container>
      </Box>
    );
  }

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
            {isEditMode ? 'Chỉnh Sửa Sự Kiện' : 'Tạo Sự Kiện Mới'}
          </Typography>
          
          <Typography variant="body1" color="text.secondary">
            {isEditMode ? 'Chỉnh sửa sự kiện của bạn' : 'Tạo sự kiện của bạn theo 6 bước đơn giản'}
          </Typography>
          
          {editModeLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">
                Đang tải dữ liệu sự kiện...
              </Typography>
            </Box>
          )}
        </Box>

        <Paper 
          sx={{ p: 3 }}
          component="div"
          onKeyDown={(e) => {
            // Ngăn form submit khi nhấn Enter trừ khi đang ở input field
            if (e.key === 'Enter' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
              e.preventDefault();
            }
          }}
        >
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error.split('\n').map((line, index) => (
                <div key={index} style={{ marginTop: index > 0 ? '8px' : '0' }}>
                  {line}
                </div>
              ))}
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
                type="button"
                variant="contained"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isProcessing && !loading) {
                    handleNext();
                  }
                }}
                disabled={!isStepValid() || loading || isEventBeingCreated || isProcessing}
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

      {/* Dialog thông báo sự kiện đang chờ duyệt */}
      <Dialog
        open={showPendingDialog}
        onClose={() => {
          setShowPendingDialog(false);
          navigate('/my-events');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#000000',
            color: '#ffffff',
            '& .MuiDialogContent-root': {
              backgroundColor: '#000000',
              borderTop: 'none !important',
              '&::before': {
                display: 'none !important'
              }
            },
            '& .MuiDialogActions-root': {
              backgroundColor: '#000000',
              borderTop: 'none !important',
              '&::before': {
                display: 'none !important'
              }
            },
            '& .MuiDivider-root': {
              display: 'none'
            }
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#ff9800', 
          color: '#ffffff',
          textAlign: 'center',
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>
          ✅ Sự kiện đã được tạo thành công
        </DialogTitle>
        <DialogContent sx={{ 
          mt: 3, 
          mb: 2, 
          backgroundColor: '#000000',
          borderTop: 'none',
          '&::before': {
            display: 'none'
          }
        }}>
          <DialogContentText sx={{ 
            fontSize: '1.1rem',
            textAlign: 'center',
            color: '#ffffff',
            lineHeight: 1.8
          }}>
            Sự kiện đã được gửi đến Admin và đang chờ duyệt. Vui lòng kiên nhẫn chờ đợi.
            <br />
            <br />
            Bạn sẽ nhận được thông báo khi sự kiện được duyệt và đưa lên hệ thống.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ 
          justifyContent: 'center', 
          pb: 3, 
          backgroundColor: '#000000',
          borderTop: 'none',
          '&::before': {
            display: 'none'
          }
        }}>
          <Button
            onClick={() => {
              setShowPendingDialog(false);
              navigate('/my-events');
            }}
            variant="contained"
            color="primary"
            sx={{
              backgroundColor: '#ff9800',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#f57c00'
              },
              minWidth: '150px',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            Đã hiểu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreateEventPage;
