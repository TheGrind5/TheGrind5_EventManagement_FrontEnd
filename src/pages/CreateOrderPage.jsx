//Trang tạo order: Trang này sẽ hiển thị form để người dùng nhập thông tin order

//Import statements để import các thư viện cần thiết
import React, {useState, useEffect} from 'react'; 
import {useParams, useSearchParams, useLocation, useNavigate} from 'react-router-dom'; 
import { 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Alert, 
  CircularProgress, 
  Box, 
  Divider, 
  Chip, 
  Paper,
  useTheme,
  IconButton,
  InputAdornment,
  LinearProgress
} from '@mui/material';
import {
  Event as EventIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  ConfirmationNumber as TicketIcon,
  AddCircle as AddIcon,
  RemoveCircle as RemoveIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import Header from '../components/layout/Header';
import VoucherSelector from '../components/common/VoucherSelector';
import StageViewer from '../components/stage/StageViewer';
import { useAuth } from '../contexts/AuthContext';

    //event api để lấy thông tin event từ backend
import {eventsAPI, ordersAPI, ticketsAPI} from '../services/apiClient';

const CreateOrderPage = () => {

    //State declaration để quản lý trạng thái của component
    const {id} = useParams(); //Lấy id từ url 
    const [searchParams] = useSearchParams(); //Lấy query params từ URL
    const location = useLocation(); //Lấy state từ navigation
    const navigate = useNavigate(); //Navigation hook
    const { user, loading: authLoading } = useAuth(); //Auth context
    const [quantity, setQuantity] = useState(1); 
    /*  useState là một hook trong React để quản lý trạng thái của component.
        useState trả về một mảng gồm hai phần tử: phần tử đầu tiên là giá trị hiện tại của trạng thái, phần tử thứ hai là hàm để cập nhật giá trị của trạng thái.
        quantity là giá trị hiện tại của trạng thái, setQuantity là hàm để cập nhật giá trị của trạng thái.
        1 là giá trị mặc định của trạng thái. */
    
    const[event, setEvent] = useState(null); 
    const[ticketTypes, setTicketTypes] = useState([]);
    const[selectedTicketType, setSelectedTicketType] = useState('');
    const[loading, setLoading] = useState(true);
    const[error, setError] = useState(null);
    const[creatingOrder, setCreatingOrder] = useState(false);
    const[orderSuccess, setOrderSuccess] = useState(false);
    const[appliedVoucher, setAppliedVoucher] = useState(null);
    const[venueLayout, setVenueLayout] = useState(null);
    const[selectedArea, setSelectedArea] = useState(null);

    // Check if coming from wishlist
    const isFromWishlist = location.state?.fromWishlist || false;
    const selectedWishlistItems = location.state?.selectedWishlistItems || [];
        
    //useEffect hook để lấy thông tin event từ backend
    useEffect(() => {
        // Check authentication first
        if (!authLoading && !user) {
            setError('Bạn cần đăng nhập để tạo đơn hàng');
            setLoading(false);
            return;
        }

        // Check token exists
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Token không tồn tại. Vui lòng đăng nhập lại');
            setLoading(false);
            return;
        }

        // Skip if already loaded - prevent reload on state changes
        if (event && ticketTypes.length > 0) {
            return;
        }

        const fetchEventData = async () => {
            try{
                setLoading(true); 
                setError(null); // Chưa fetch thì chưa có lỗi
                
                // Fetch event data
                const eventData = await eventsAPI.getById(id);
                console.log('Event data: ', eventData);
                const event = eventData?.data ?? eventData;
                setEvent(event);

                // Check if event is closed
                if (event?.status === 'Closed') {
                    setError('Sự kiện đã kết thúc. Bạn không thể đặt vé cho sự kiện đã kết thúc.');
                    setLoading(false);
                    return;
                }
                
                // Fetch ticket types separately
                let ticketTypesData;
                try {
                    ticketTypesData = await ticketsAPI.getTicketTypesByEvent(id);
                    console.log('🔍 DEBUG TICKET TYPES API:');
                    console.log('Ticket Types API Response: ', ticketTypesData);
                    console.log('Ticket Types Data: ', ticketTypesData?.data);
                    console.log('Ticket Types Count: ', ticketTypesData?.data?.length || 0);
                    
                    const ticketTypesArray = ticketTypesData?.data || [];
                    console.log('🔍 DEBUG: Setting ticket types:', ticketTypesArray);
                    setTicketTypes(ticketTypesArray);
                    
                    // Check if no ticket types found
                    if (ticketTypesArray.length === 0) {
                        console.warn('🔍 DEBUG: No ticket types found for event', id);
                        setError('Sự kiện này chưa có loại vé nào để đặt');
                        return;
                    }
                } catch (ticketTypesError) {
                    console.error('🔍 DEBUG: Error fetching ticket types:', ticketTypesError);
                    setError('Không thể tải danh sách loại vé. Vui lòng thử lại sau.');
                    return;
                }
                
                // Fetch venue layout if available
                try {
                    const layoutResponse = await eventsAPI.getVenueLayout(id);
                    console.log('Venue layout response:', layoutResponse);
                    if (layoutResponse?.data && layoutResponse.data.hasVirtualStage) {
                        setVenueLayout(layoutResponse.data);
                    }
                } catch (layoutError) {
                    console.log('No venue layout available or error:', layoutError);
                    // Venue layout is optional, so we don't set error
                }
                
                // Auto-select ticket type from URL params if provided
                const ticketTypeFromUrl = searchParams.get('ticketType');
                console.log('🔍 DEBUG URL PARAMS:');
                console.log('ticketTypeFromUrl:', ticketTypeFromUrl);
                console.log('ticketTypeFromUrl type:', typeof ticketTypeFromUrl);
                console.log('ticketTypesData:', ticketTypesData);
                
                if (ticketTypeFromUrl) {
                    // 🔧 FIX: Convert to number for comparison
                    const ticketTypeId = parseInt(ticketTypeFromUrl);
                    console.log('🔍 DEBUG: Looking for ticketTypeId:', ticketTypeId);
                    
                    const foundTicketType = ticketTypesData?.data?.find(tt => tt.ticketTypeId === ticketTypeId);
                    console.log('🔍 DEBUG: Found ticket type:', foundTicketType);
                    
                    if (foundTicketType) {
                        setSelectedTicketType(ticketTypeFromUrl); // Keep as string for form
                        console.log('Auto-selected ticket type:', foundTicketType.typeName);
                    } else {
                        console.warn('🔍 DEBUG: Ticket type not found in fetched data');
                        console.log('Available ticket types:', ticketTypesData?.data?.map(tt => ({ id: tt.ticketTypeId, name: tt.typeName })));
                    }
                }

                // Handle wishlist items if coming from wishlist
                if (isFromWishlist && selectedWishlistItems.length > 0) {
                    console.log('Processing wishlist items:', selectedWishlistItems);
                    // We need to get the ticket type ID from the wishlist item
                    // For now, we'll need to fetch the wishlist data to get the ticket type ID
                    // This is a temporary solution - in a real app, pass ticket type ID directly
                    try {
                        const { wishlistAPI } = await import('../services/apiClient');
                        const wishlistData = await wishlistAPI.getWishlist();
                        const wishlistItem = (wishlistData?.data?.items || wishlistData?.items || []).find(item => 
                            selectedWishlistItems.includes(item.id)
                        );
                        if (wishlistItem) {
                            setSelectedTicketType(wishlistItem.ticketTypeId.toString());
                        }
                    } catch (error) {
                        console.error('Error fetching wishlist data:', error);
                    }
                }

                // Kiểm tra nếu không có ticket types
                const ticketArray = ticketTypesData?.data || ticketTypesData || [];
                if (!ticketArray || ticketArray.length === 0) {
                    setError('Sự kiện này chưa có loại vé nào để đặt');
                    setTicketTypes([]);
                }

            }catch(error){
                console.error('Lỗi ko fetch đc event :(', error);
                setError('Không thể tải thông tin sự kiện. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };
        if(id && user){
            fetchEventData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, user, authLoading]) // Only depend on id, user, authLoading - not event/ticketTypes to prevent reload

        // Debug useEffect để kiểm tra event state - REMOVED để tránh infinite loop

    
    //Handle functions để xử lý event
    const handleCreateOrder = async (e) => {
        e.preventDefault(); // Ngăn form submit mặc định
        
        // 🔧 FIX: Cải thiện validation với business rules
        if (!selectedTicketType) {
            setError('Vui lòng chọn loại vé');
            return;
        }

        if (quantity <= 0) {
            setError('Số lượng vé phải lớn hơn 0');
            return;
        }

        if (!id || isNaN(parseInt(id))) {
            setError('ID sự kiện không hợp lệ');
            return;
        }

        // 🔧 FIX: Validate ticket type availability với business rules
        const selectedTicket = ticketTypes.find(tt => tt.ticketTypeId == selectedTicketType);
        if (selectedTicket) {
            // Check if ticket type is active
            if (selectedTicket.status !== 'Active') {
                setError('Loại vé này hiện không khả dụng');
                return;
            }

            // Check sale time
            const now = new Date();
            if (selectedTicket.saleStart && new Date(selectedTicket.saleStart) > now) {
                setError(`Vé chưa được bán. Thời gian bán bắt đầu: ${new Date(selectedTicket.saleStart).toLocaleString('vi-VN')}`);
                return;
            }

            if (selectedTicket.saleEnd && new Date(selectedTicket.saleEnd) < now) {
                setError(`Hết thời gian bán vé. Thời gian bán kết thúc: ${new Date(selectedTicket.saleEnd).toLocaleString('vi-VN')}`);
                return;
            }

            // Check availability - sử dụng strict comparison
            if (selectedTicket.availableQuantity < quantity) {
                setError(`Chỉ còn ${selectedTicket.availableQuantity} vé. Vui lòng chọn số lượng ít hơn.`);
                return;
            }

            // Check min/max order rules
            if (selectedTicket.minOrder && quantity < selectedTicket.minOrder) {
                setError(`Số lượng tối thiểu là ${selectedTicket.minOrder} vé.`);
                return;
            }

            if (selectedTicket.maxOrder && quantity > selectedTicket.maxOrder) {
                setError(`Số lượng tối đa là ${selectedTicket.maxOrder} vé.`);
                return;
            }

            // Check if user has sufficient balance (if using wallet payment)
            if (appliedVoucher && appliedVoucher.finalAmount > 0) {
                // This will be validated on backend, but we can show a warning
                console.log('Voucher applied, final amount:', appliedVoucher.finalAmount);
            }
        } else {
            setError('Loại vé được chọn không tồn tại');
            return;
        }

        try {
            setCreatingOrder(true);
            setError(null);
            
            // 🔍 DEBUG: Log ticket type validation
            console.log('🔍 DEBUG TICKET TYPE VALIDATION:');
            console.log('selectedTicketType:', selectedTicketType);
            console.log('selectedTicketType type:', typeof selectedTicketType);
            console.log('ticketTypes:', ticketTypes);
            console.log('selectedTicket:', ticketTypes.find(tt => tt.ticketTypeId == selectedTicketType));
            
            // Validate ticket type exists before sending - sử dụng strict comparison
            const selectedTicket = ticketTypes.find(tt => tt.ticketTypeId == selectedTicketType);
            if (!selectedTicket) {
                setError('Loại vé được chọn không tồn tại trong danh sách');
                return;
            }
            
            // Tạo order data - sử dụng PascalCase vì backend expect PascalCase
            const orderData = {
                EventId: parseInt(id),
                TicketTypeId: parseInt(selectedTicketType),
                Quantity: quantity,
                SeatNo: null, // Có thể thêm seat selection sau
                VoucherCode: appliedVoucher?.voucherCode || null // Thêm voucher code
            };
            
            // Gọi API tạo order
            console.log('📦 Creating order with data:', orderData);
            let response;
            try {
                response = await ordersAPI.create(orderData);
                console.log('✅ Order created successfully, full API response:', response);
                console.log('Response data:', response.data);
            } catch (error) {
                console.error('❌ Error creating order:', error);
                console.error('Error response:', error.response);
                console.error('Error message:', error.message);
                setError(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.');
                return;
            }
            
            // 🔧 FIX: Handle different response structures (PascalCase and camelCase)
            // Backend trả về: { message: "...", order: { OrderId: 123, TotalAmount: 0, Status: "Paid", ... } }
            // apiClient normalize: response.data = { message: "...", order: { OrderId/orderId: 123, TotalAmount/totalAmount: 0, Status/status: "Paid" } }
            const responseData = response.data || response;
            let orderResponse = responseData?.order || responseData?.Order || response.order || response.Order || responseData;
            
            // Extract orderId
            let orderId;
            if (orderResponse) {
                // Check both PascalCase and camelCase
                orderId = orderResponse.OrderId || orderResponse.orderId || orderResponse.id || orderResponse.Id;
            }
            
            if (!orderId) {
                console.error('Cannot find orderId in response:', response);
                console.error('- response.data:', response.data);
                console.error('- response.data?.order:', response.data?.order);
                console.error('- response.order:', response.order);
                setError('Không thể lấy ID đơn hàng từ phản hồi. Vui lòng thử lại.');
                return;
            }
            
            // 🎫 FIX: Reload order từ API để đảm bảo có status mới nhất (sau khi backend xử lý vé free)
            // Điều này đảm bảo nếu backend đã set status = "Paid" cho vé free, frontend sẽ nhận được status mới nhất
            try {
                console.log('🔄 Reloading order to get latest status...');
                const reloadedOrder = await ordersAPI.getById(orderId);
                const reloadedOrderData = reloadedOrder?.data || reloadedOrder;
                if (reloadedOrderData) {
                    console.log('✅ Reloaded order data:', reloadedOrderData);
                    // Ưu tiên dùng order data từ reload (có status mới nhất)
                    orderResponse = reloadedOrderData;
                }
            } catch (reloadError) {
                console.warn('⚠️ Could not reload order, using original response:', reloadError);
                // Nếu reload fail, vẫn dùng orderResponse từ create response
            }
            
            // 🎫 FIX: Kiểm tra totalAmount và status từ order object (sau khi áp voucher)
            // Backend trả về: { message: "...", order: CreateOrderResponseDTO { OrderId, TotalAmount, Status, ... } }
            // apiClient normalize: response.data = { message: "...", order: { OrderId, TotalAmount, Status, ... } }
            
            // Extract totalAmount từ nhiều nguồn (fallback chain)
            const totalAmount = orderResponse?.TotalAmount ?? 
                               orderResponse?.totalAmount ?? 
                               orderResponse?.Amount ?? 
                               orderResponse?.amount ?? 
                               responseData?.TotalAmount ?? 
                               responseData?.totalAmount ?? 
                               responseData?.Amount ?? 
                               responseData?.amount ?? 0;
            
            // Extract orderStatus từ nhiều nguồn (fallback chain)
            const orderStatus = orderResponse?.Status ?? 
                               orderResponse?.status ?? 
                               responseData?.Status ?? 
                               responseData?.status ?? 
                               'Pending';
            
            // Check giá vé gốc (trước voucher)
                const selectedTicketForNav = ticketTypes.find(tt => tt.ticketTypeId == selectedTicketType);
            const ticketPrice = selectedTicketForNav?.price ?? selectedTicketForNav?.Price ?? 0;
            
            console.log('🎫 Payment check (DETAILED):', {
                orderId,
                totalAmount,
                orderStatus,
                ticketPrice,
                orderResponse: orderResponse,
                responseData: responseData,
                fullResponse: response,
                'orderResponse?.TotalAmount': orderResponse?.TotalAmount,
                'orderResponse?.totalAmount': orderResponse?.totalAmount,
                'orderResponse?.Status': orderResponse?.Status,
                'orderResponse?.status': orderResponse?.status
            });
            
            // Nếu totalAmount = 0 HOẶC order status = "Paid" HOẶC vé free (price = 0), bỏ qua payment
            const isFreeTicket = ticketPrice === 0 || selectedTicketForNav?.isFree === true;
            const isFreeAfterVoucher = totalAmount === 0;
            const isAlreadyPaid = orderStatus === 'Paid';
            
            const isFreeOrPaid = isFreeTicket || isFreeAfterVoucher || isAlreadyPaid;
            
            console.log('🎫 Final decision:', {
                isFreeOrPaid,
                isFreeTicket,
                isFreeAfterVoucher,
                isAlreadyPaid,
                totalAmount,
                orderStatus,
                ticketPrice,
                willSkipPayment: isFreeOrPaid
            });
            
            // 🔧 FIX: Redirect NGAY LẬP TỨC cho vé free, không cần setOrderSuccess (tránh delay)
            if (isFreeOrPaid) {
                // Bỏ qua bước thanh toán, đi thẳng đến order confirmation NGAY
                console.log('✅ FREE/PAID TICKET - Skipping payment, redirecting IMMEDIATELY to order confirmation');
                
                // 🎫 OPTIMIZE: Đợi một chút để backend tạo tickets xong (vé free được tạo ngay sau khi commit)
                // Backend tạo tickets đồng bộ trong CreateOrderAsync, nên chỉ cần đợi ngắn
                await new Promise(resolve => setTimeout(resolve, 600)); // Đợi 600ms để backend tạo tickets
                
                // Fetch tickets ngay để đảm bảo có vé trước khi redirect
                try {
                    console.log('🎫 Fetching tickets immediately for free ticket...');
                    const ticketsData = await ticketsAPI.getTicketsByOrder(orderId);
                    const ticketsList = ticketsData?.tickets || ticketsData?.data || ticketsData || [];
                    console.log('🎫 Tickets fetched for free ticket:', ticketsList.length, 'tickets');
                } catch (ticketError) {
                    console.warn('⚠️ Could not fetch tickets immediately, will fetch on order-confirmation page:', ticketError);
                    // Không fail, sẽ fetch lại ở OrderConfirmationPage
                }
                
                // Redirect đến order confirmation với tickets đã sẵn sàng
                navigate(`/order-confirmation/${orderId}`, {
                    state: {
                        order: orderResponse,
                        fromOrderCreation: true,
                        isFreeTicket: true
                    },
                    replace: true // Replace history để không thể back về trang tạo order
                });
                return; // Return ngay để không chạy code phía dưới
            }
            
            // Chỉ set success và delay cho vé cần thanh toán
            setOrderSuccess(true);
            
            // Cần thanh toán, đi đến payment page (có delay 2s để user thấy success message)
            console.log('💳 Payment required, redirecting to payment page');
            setTimeout(() => {
                    navigate(`/payment/${orderId}`, {
                        state: {
                        order: orderResponse,
                            fromOrderCreation: true,
                            orderData: orderData
                        }
                    });
            }, 2000);
            
        } catch (error) {
            
            // 🔧 FIX: Cải thiện error handling với nhiều fallback options
            let errorMessage = 'Có lỗi xảy ra khi tạo đơn hàng';
            let errorCode = 500;
            
            // Parse error từ apiClient response format
            if (error.success === false) {
                errorMessage = error.message || errorMessage;
                errorCode = error.code || 500;
            }
            // Parse error từ axios response
            else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
                errorCode = error.response.status;
            }
            // Parse error từ fetch response
            else if (error.data?.message) {
                errorMessage = error.data.message;
            }
            // Parse error từ exception message
            else if (error.message) {
                errorMessage = error.message;
            }
            
            
            // 🔧 FIX: Thêm specific error handling cho các trường hợp thường gặp
            if (errorCode === 401) {
                errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
                // Auto redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else if (errorCode === 400) {
                // Keep the specific error message from backend
            } else if (errorCode === 0) {
                errorMessage = 'Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.';
            }
            
            setError(errorMessage);
        } finally {
            setCreatingOrder(false);
        }
    };

    // Voucher handling functions
    const handleVoucherApplied = (voucherData) => {
        setAppliedVoucher(voucherData);
        console.log('Voucher applied:', voucherData);
    };

    const handleRemoveVoucher = () => {
        setAppliedVoucher(null);
        console.log('Voucher removed');
    };

    // Handle area selection from virtual stage
    const handleAreaSelection = (selection) => {
        console.log('Area selected:', selection);
        setSelectedArea(selection.area);
        if (selection.area.ticketTypeId) {
            setSelectedTicketType(selection.area.ticketTypeId.toString());
        }
        if (selection.quantity > 0) {
            setQuantity(selection.quantity);
        }
    };

    // Calculate pricing with voucher - memoized để tránh re-render
    const pricing = React.useMemo(() => {
        if (!selectedTicketType || !ticketTypes.length) return null;
        
        const ticketType = ticketTypes.find(tt => tt.ticketTypeId == selectedTicketType);
        if (!ticketType) return null;

        const originalAmount = ticketType.price * quantity;
        let finalAmount = originalAmount;
        let discountAmount = 0;

        if (appliedVoucher) {
            discountAmount = appliedVoucher.discountAmount;
            finalAmount = appliedVoucher.finalAmount;
        }

        return {
            originalAmount,
            discountAmount,
            finalAmount,
            ticketType
        };
    }, [selectedTicketType, ticketTypes, quantity, appliedVoucher]);

    // Debug useEffect để kiểm tra pricing - REMOVED để tránh infinite loop

    const theme = useTheme();
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const selectedTicket = ticketTypes.find(tt => tt.ticketTypeId == selectedTicketType);

    //Return JSX để hiển thị form
    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
            <Header />
            
            {/* Loading State */}
            {loading && (
                <Container maxWidth="lg" sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <CircularProgress size={60} />
                        <Typography variant="h6" color="text.secondary">
                            Đang tải thông tin sự kiện...
                        </Typography>
                    </Box>
                </Container>
            )}

            {/* Error State */}
            {error && !loading && (
                <Container maxWidth="lg" sx={{ py: 4 }}>
                    <Alert 
                        severity="error" 
                        action={
                            error.includes('đăng nhập') ? (
                                <Button 
                                    size="small" 
                                    onClick={() => navigate('/login')}
                                    variant="contained"
                                >
                                    Đăng nhập
                                </Button>
                            ) : (
                                <Button 
                                    size="small" 
                                    onClick={() => window.location.reload()}
                                    variant="outlined"
                                >
                                    Thử lại
                                </Button>
                            )
                        }
                    >
                        {error}
                    </Alert>
                </Container>
            )}

            {/* Success State */}
            {orderSuccess && !loading && !error && (
                <Container maxWidth="lg" sx={{ py: 4 }}>
                    <Alert 
                        severity="success" 
                        icon={<CheckIcon />}
                        sx={{ fontSize: '1.1rem' }}
                    >
                        <Typography variant="h5" gutterBottom>
                            🎉 Tạo đơn hàng thành công!
                        </Typography>
                        <Typography>
                            Đơn hàng của bạn đã được tạo thành công. Đang chuyển hướng...
                        </Typography>
                    </Alert>
                </Container>
            )}

            {/* Main Content */}
            {!loading && !error && !orderSuccess && event && (
                <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, md: 3 } }}>
                    <Grid container spacing={4}>
                        {/* Left Column - Event Info */}
                        <Grid item xs={12} md={5}>
                            {/* Event Header */}
                            <Card elevation={0} sx={{ 
                                mb: 3, 
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 3
                            }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography 
                                        variant="h4" 
                                        fontWeight={800} 
                                        gutterBottom
                                        sx={{ mb: 2 }}
                                    >
                                        {event?.title || event?.Title}
                                    </Typography>
                                    <Divider sx={{ my: 2.5 }} />
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'start', gap: 1.5 }}>
                                            <LocationIcon color="primary" sx={{ mt: 0.5, fontSize: '1.5rem' }} />
                                            <Box>
                                                <Typography 
                                                    variant="body2" 
                                                    color="text.secondary" 
                                                    fontWeight={700}
                                                    sx={{ mb: 0.5 }}
                                                >
                                                    Địa điểm
                                                </Typography>
                                                <Typography 
                                                    variant="body1" 
                                                    sx={{ fontWeight: 500 }}
                                                >
                                                    {event?.location || event?.Location}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        
                                        {event?.description && (
                                            <Box sx={{ display: 'flex', alignItems: 'start', gap: 1.5 }}>
                                                <DescriptionIcon color="primary" sx={{ mt: 0.5, fontSize: '1.5rem' }} />
                                                <Box>
                                                    <Typography 
                                                        variant="body2" 
                                                        color="text.secondary" 
                                                        fontWeight={700}
                                                        sx={{ mb: 0.5 }}
                                                    >
                                                        Mô tả
                                                    </Typography>
                                                    <Typography 
                                                        variant="body1"
                                                        sx={{ fontWeight: 400 }}
                                                    >
                                                        {event?.description}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>

                            {/* Virtual Stage Viewer */}
                            {venueLayout && venueLayout.hasVirtualStage && (
                                <Card elevation={0} sx={{ 
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 3
                                }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Typography 
                                            variant="h6" 
                                            fontWeight={700} 
                                            gutterBottom 
                                            sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: 1,
                                                mb: 2 
                                            }}
                                        >
                                            🗺️ Chọn Khu Vực
                                        </Typography>
                                        <StageViewer 
                                            layout={venueLayout}
                                            ticketTypes={ticketTypes}
                                            onAreaClick={handleAreaSelection}
                                        />
                                        {selectedArea && (
                                            <Alert 
                                                severity="success" 
                                                sx={{ mt: 2 }}
                                            >
                                                <Typography fontWeight={600}>
                                                    <strong>Khu vực đã chọn:</strong> {selectedArea.name}
                                                </Typography>
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </Grid>

                        {/* Right Column - Order Form */}
                        <Grid item xs={12} md={7}>
                            <Paper 
                                elevation={0} 
                                sx={{ 
                                    p: 4, 
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 3,
                                    position: { xs: 'static', md: 'sticky' },
                                    top: { md: 80 },
                                    backgroundColor: theme.palette.mode === 'dark'
                                        ? 'rgba(255, 255, 255, 0.02)'
                                        : 'rgba(0, 0, 0, 0.01)'
                                }}
                            >
                                <Typography 
                                    variant="h5" 
                                    fontWeight={800} 
                                    gutterBottom 
                                    sx={{ mb: 3.5 }}
                                >
                                    Đặt vé
                                </Typography>

                                <form onSubmit={handleCreateOrder} onKeyDown={(e) => {
                                    // Prevent form submit when pressing Enter in voucher form
                                    if (e.key === 'Enter' && e.target.closest('.voucher-form')) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }
                                }}>
                                    {/* Ticket Type Selection */}
                                    <FormControl fullWidth sx={{ mb: 3.5 }}>
                                        <InputLabel sx={{ fontWeight: 600 }}>Loại vé</InputLabel>
                                        <Select
                                            value={selectedTicketType}
                                            onChange={(e) => setSelectedTicketType(e.target.value)}
                                            label="Loại vé"
                                            startAdornment={
                                                <InputAdornment position="start">
                                                    <TicketIcon color="primary" />
                                                </InputAdornment>
                                            }
                                            sx={{
                                                borderRadius: 2,
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderWidth: '1.5px'
                                                }
                                            }}
                                        >
                                            <MenuItem value="">
                                                <em>Chọn loại vé</em>
                                            </MenuItem>
                                            {ticketTypes.map(ticketType => (
                                                <MenuItem key={ticketType.ticketTypeId} value={ticketType.ticketTypeId}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                                                        <Typography fontWeight={500}>{ticketType.typeName}</Typography>
                                                        <Chip 
                                                            label={formatCurrency(ticketType.price)} 
                                                            size="small" 
                                                            color="primary" 
                                                            variant="outlined"
                                                            sx={{ fontWeight: 600 }}
                                                        />
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    {/* Selected Ticket Info */}
                                    {selectedTicket && (
                                        <Alert 
                                            icon={<CheckIcon />} 
                                            severity="info" 
                                            sx={{ 
                                                mb: 3.5,
                                                borderRadius: 2,
                                                border: `1px solid ${theme.palette.info.light}`
                                            }}
                                            action={
                                                <Button 
                                                    size="small" 
                                                    onClick={() => setSelectedTicketType('')}
                                                    sx={{ fontWeight: 600 }}
                                                >
                                                    Đổi
                                                </Button>
                                            }
                                        >
                                            <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                                                {selectedTicket.typeName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                Còn lại: {selectedTicket.availableQuantity} vé
                                                {selectedTicket.minOrder && ` • Tối thiểu: ${selectedTicket.minOrder} vé`}
                                                {selectedTicket.maxOrder && ` • Tối đa: ${selectedTicket.maxOrder} vé`}
                                            </Typography>
                                        </Alert>
                                    )}

                                    {/* Quantity Selection */}
                                    {selectedTicketType && (
                                        <>
                                            <Typography 
                                                variant="body2" 
                                                fontWeight={700} 
                                                gutterBottom
                                                sx={{ mb: 2 }}
                                            >
                                                Số lượng
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 3.5 }}>
                                                <IconButton
                                                    disabled={quantity <= 1 || (selectedTicket?.minOrder && quantity <= selectedTicket.minOrder)}
                                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                                    color="primary"
                                                    sx={{ 
                                                        width: 44,
                                                        height: 44,
                                                        '&:hover': {
                                                            transform: 'scale(1.1)'
                                                        },
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <RemoveIcon />
                                                </IconButton>
                                                <TextField
                                                    type="number"
                                                    value={quantity}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 1;
                                                        const max = Math.min(
                                                            selectedTicket?.availableQuantity || 999,
                                                            selectedTicket?.maxOrder || 999
                                                        );
                                                        setQuantity(Math.min(max, Math.max(1, val)));
                                                    }}
                                                    inputProps={{ 
                                                        min: selectedTicket?.minOrder || 1, 
                                                        max: Math.min(
                                                            selectedTicket?.availableQuantity || 999,
                                                            selectedTicket?.maxOrder || 999
                                                        )
                                                    }}
                                                    sx={{ 
                                                        width: 100,
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: 2,
                                                            fontWeight: 600
                                                        }
                                                    }}
                                                    size="small"
                                                />
                                                <IconButton
                                                    disabled={
                                                        quantity >= (selectedTicket?.availableQuantity || 0) ||
                                                        (selectedTicket?.maxOrder && quantity >= selectedTicket.maxOrder)
                                                    }
                                                    onClick={() => setQuantity(q => q + 1)}
                                                    color="primary"
                                                    sx={{ 
                                                        width: 44,
                                                        height: 44,
                                                        '&:hover': {
                                                            transform: 'scale(1.1)'
                                                        },
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <AddIcon />
                                                </IconButton>
                                            </Box>
                                        </>
                                    )}

                                    {/* Voucher Selector */}
                                    {selectedTicketType && quantity > 0 && pricing && (
                                        <Box sx={{ mb: 3.5 }} className="voucher-form">
                                            <VoucherSelector
                                                originalAmount={pricing.originalAmount}
                                                onVoucherApplied={handleVoucherApplied}
                                                appliedVoucher={appliedVoucher}
                                                onRemoveVoucher={handleRemoveVoucher}
                                            />
                                        </Box>
                                    )}

                                    {/* Price Summary */}
                                    {selectedTicketType && quantity > 0 && pricing && (
                                        <Paper 
                                            variant="outlined" 
                                            sx={{ 
                                                p: 3.5, 
                                                mb: 3.5,
                                                borderRadius: 2.5,
                                                backgroundColor: theme.palette.mode === 'dark' 
                                                    ? 'rgba(61, 190, 41, 0.08)' 
                                                    : 'rgba(61, 190, 41, 0.04)',
                                                border: `2px solid ${theme.palette.primary.main}30`
                                            }}
                                        >
                                            <Typography variant="h6" fontWeight={800} gutterBottom sx={{ mb: 1.5 }}>
                                                Tổng tiền
                                            </Typography>
                                            <Divider sx={{ mb: 2.5 }} />
                                            
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                                <Typography color="text.secondary" fontWeight={500}>
                                                    {pricing.ticketType.typeName} × {quantity}
                                                </Typography>
                                                <Typography fontWeight={600}>{formatCurrency(pricing.ticketType.price)}</Typography>
                                            </Box>

                                            {appliedVoucher && (
                                                <>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                                        <Typography color="text.secondary" fontWeight={500}>
                                                            Giảm giá ({appliedVoucher.discountPercentage}%)
                                                        </Typography>
                                                        <Typography color="error" fontWeight={600}>
                                                            -{formatCurrency(pricing.discountAmount)}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                                            Voucher: {appliedVoucher.voucherCode}
                                                        </Typography>
                                                    </Box>
                                                </>
                                            )}

                                            <Divider sx={{ my: 2.5 }} />
                                            
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="h6" fontWeight={800}>
                                                    Tổng cộng
                                                </Typography>
                                                <Typography variant="h5" fontWeight={800} color="primary.main">
                                                    {formatCurrency(pricing.finalAmount)}
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    )}

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        disabled={creatingOrder || !selectedTicketType || quantity <= 0}
                                        sx={{
                                            py: 2,
                                            fontSize: '1.15rem',
                                            fontWeight: 800,
                                            borderRadius: 2.5,
                                            boxShadow: 'none',
                                            textTransform: 'none',
                                            '&:hover': {
                                                boxShadow: `0 8px 24px rgba(61, 190, 41, 0.35)`,
                                                transform: 'translateY(-2px)'
                                            },
                                            transition: 'all 0.3s ease'
                                        }}
                                        startIcon={creatingOrder ? <CircularProgress size={20} color="inherit" /> : null}
                                    >
                                        {creatingOrder ? 'Đang tạo đơn hàng...' : 'Tạo đơn hàng'}
                                    </Button>
                                </form>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            )}
        </Box>
    );
};
export default CreateOrderPage;
