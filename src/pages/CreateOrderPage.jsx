//Trang tạo order: Trang này sẽ hiển thị form để người dùng nhập thông tin order

//Import statements để import các thư viện cần thiết
import React, {useState, useEffect} from 'react'; 
import {useParams, useSearchParams, useLocation, useNavigate} from 'react-router-dom'; 
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

        const fetchEventData = async () => {
            try{
                setLoading(true); 
                setError(null); // Chưa fetch thì chưa có lỗi
                
                // Fetch event data
                const eventData = await eventsAPI.getById(id);
                console.log('Event data: ', eventData);
                setEvent(eventData?.data ?? eventData);
                
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
    }, [id, user, authLoading])

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
                SeatNo: null // Có thể thêm seat selection sau
            };
            
            // Gọi API tạo order
            const response = await ordersAPI.create(orderData);
            
            // Debug: Log toàn bộ response để xem cấu trúc
            console.log('Full API response:', response);
            console.log('Response data:', response.data);
            
            // Hiển thị thành công
            setOrderSuccess(true);
            
            // 🔧 FIX: Handle different response structures
            let orderId;
            if (response.data?.order?.orderId) {
                orderId = response.data.order.orderId;
                console.log('Found orderId in response.data.order.orderId:', orderId);
            } else if (response.data?.orderId) {
                orderId = response.data.orderId;
                console.log('Found orderId in response.data.orderId:', orderId);
            } else if (response.order?.orderId) {
                orderId = response.order.orderId;
                console.log('Found orderId in response.order.orderId:', orderId);
            } else {
                console.error('Cannot find orderId in response:', response);
                console.error('Response structure analysis:');
                console.error('- response.data:', response.data);
                console.error('- response.data?.order:', response.data?.order);
                console.error('- response.order:', response.order);
                setError('Không thể lấy ID đơn hàng từ phản hồi');
                return;
            }
            
            
            // 🔧 FIX: Sử dụng React Router thay vì window.location để preserve state
            setTimeout(() => {
                navigate(`/payment/${orderId}`, {
                    state: {
                        order: response.data?.order || response.order,
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


    //Return JSX để hiển thị form
    return (
        <div>
            <Header />
            <div className="create-order-container"> 
                <div className="create-order-card">
                    {/* Hiển thị loading state */}
                    {loading && (
                        <div className="alert alert-info">
                            <div className="spinner-border spinner-border-sm me-2" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            Đang tải thông tin sự kiện...
                        </div>
                    )}

                    {/* Hiển thị error message */}
                    {error && (
                        <div className="alert alert-danger">
                            <div>
                                <strong>Lỗi:</strong> {error}
                            </div>
                            {error.includes('đăng nhập') ? (
                                <button 
                                    type="button" 
                                    className="btn btn-primary btn-sm ms-2"
                                    onClick={() => navigate('/login')}
                                >
                                    Đăng nhập
                                </button>
                            ) : (
                                <button 
                                    type="button" 
                                    className="btn btn-outline-danger btn-sm ms-2"
                                    onClick={() => window.location.reload()}
                                >
                                    Thử lại
                                </button>
                            )}
                        </div>
                    )}

                    {/* Hiển thị success message */}
                    {orderSuccess && (
                        <div className="alert alert-success">
                            <h4>🎉 Tạo đơn hàng thành công!</h4>
                            <p>Đơn hàng của bạn đã được tạo thành công. Đang chuyển hướng...</p>
                        </div>
                    )}

                    {/* Hiển thị form khi không có lỗi và không loading */}
                    {!loading && !error && !orderSuccess && (
                        <>
                            <h1 className="create-order-title">Create Order - {event?.title || event?.Title}</h1>
                            
                            <div className="event-info">
                                <h3>📅 Thông tin sự kiện</h3>
                                <p><strong>Sự kiện:</strong> {event?.title || event?.Title}</p>
                                <p><strong>Địa điểm:</strong> {event?.location || event?.Location}</p>
                                <p><strong>Mô tả:</strong> {event?.description || 'Không có mô tả'}</p>
                            </div>

                            {/* Virtual Stage Viewer */}
                            {venueLayout && venueLayout.hasVirtualStage && (
                                <div className="venue-layout-container" style={{ marginBottom: '20px' }}>
                                    <h3>🗺️ Chọn Khu Vực</h3>
                                    <StageViewer 
                                        layout={venueLayout}
                                        ticketTypes={ticketTypes}
                                        onAreaClick={handleAreaSelection}
                                    />
                                    {selectedArea && (
                                        <div className="alert alert-success" style={{ marginTop: '10px' }}>
                                            <p><strong>Khu vực đã chọn:</strong> {selectedArea.name}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <form className="order-form">
                                {/* Hiển thị thông tin vé đã chọn nếu có ticketType từ URL */}
                                {selectedTicketType && (
                                    <div className="selected-ticket-info">
                                        <h3>🎫 Vé đã chọn</h3>
                                        {(() => {
                                            const selectedTicket = ticketTypes.find(tt => tt.ticketTypeId == selectedTicketType);
                                            return selectedTicket ? (
                                                <div className="ticket-info-card">
                                                    <h4>{selectedTicket.typeName}</h4>
                                                    <p><strong>Giá:</strong> {selectedTicket.price?.toLocaleString()} VND</p>
                                                    <p><strong>Số lượng còn lại:</strong> {selectedTicket.availableQuantity}</p>
                                                    {selectedTicket.minOrder && (
                                                        <p><strong>Tối thiểu:</strong> {selectedTicket.minOrder} vé</p>
                                                    )}
                                                    {selectedTicket.maxOrder && (
                                                        <p><strong>Tối đa:</strong> {selectedTicket.maxOrder} vé</p>
                                                    )}
                                                </div>
                                            ) : null;
                                        })()}
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>🎫 Loại vé</label>
                                    {selectedTicketType ? (
                                        <div className="selected-ticket-display">
                                            <p>Đã chọn: {ticketTypes.find(tt => tt.ticketTypeId == selectedTicketType)?.typeName}</p>
                                            <button 
                                                type="button" 
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => setSelectedTicketType('')}
                                            >
                                                Chọn lại
                                            </button>
                                        </div>
                                    ) : (
                                        <select 
                                            className="form-control"
                                            value={selectedTicketType}
                                            onChange={(e) => setSelectedTicketType(e.target.value)}
                                        >
                                            <option value="">Chọn loại vé</option>
                                            {ticketTypes.map(ticketType => (
                                            <option key={ticketType.ticketTypeId} value={ticketType.ticketTypeId}>
                                                {ticketType.typeName} - {ticketType.price?.toLocaleString()} VND
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>🔢 Số lượng</label>
                                    <input type="number"
                                           className="form-control"
                                           value={quantity}
                                           onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                           min="1" 
                                           placeholder="Nhập số lượng vé"/>
                                </div>

                                {/* Voucher Selector */}
                                {selectedTicketType && quantity > 0 && pricing && (
                                    <VoucherSelector
                                        originalAmount={pricing.originalAmount}
                                        onVoucherApplied={handleVoucherApplied}
                                        appliedVoucher={appliedVoucher}
                                        onRemoveVoucher={handleRemoveVoucher}
                                    />
                                )}

                                {/* Hiển thị tổng tiền */}
                                {selectedTicketType && quantity > 0 && pricing && (
                                    <div className="form-group">
                                        <div className="alert alert-info">
                                            <h5>💰 Tổng tiền:</h5>
                                            <p><strong>Loại vé:</strong> {pricing.ticketType.typeName}</p>
                                            <p><strong>Đơn giá:</strong> {pricing.ticketType.price?.toLocaleString()} VND</p>
                                            <p><strong>Số lượng:</strong> {quantity}</p>
                                            
                                            {appliedVoucher ? (
                                                <>
                                                    <p><strong>Giá gốc:</strong> <span className="text-decoration-line-through">{pricing.originalAmount.toLocaleString()} VND</span></p>
                                                    <p><strong>Giảm giá:</strong> <span className="text-danger">-{pricing.discountAmount.toLocaleString()} VND</span></p>
                                                    <p><strong>Tổng cộng:</strong> <span className="text-success fw-bold">{pricing.finalAmount.toLocaleString()} VND</span></p>
                                                    <p><strong>Voucher:</strong> <span className="text-primary">{appliedVoucher.voucherCode} (-{appliedVoucher.discountPercentage}%)</span></p>
                                                </>
                                            ) : (
                                                <p><strong>Tổng cộng:</strong> <span className="text-success fw-bold">{pricing.originalAmount.toLocaleString()} VND</span></p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    className="btn-create-order" 
                                    onClick={handleCreateOrder}
                                    disabled={creatingOrder}
                                >
                                    {creatingOrder ? (
                                        <>
                                            <div className="spinner-border spinner-border-sm me-2" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                            Đang tạo đơn hàng...
                                        </>
                                    ) : (
                                        '🚀 Tạo đơn hàng'
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
export default CreateOrderPage;
