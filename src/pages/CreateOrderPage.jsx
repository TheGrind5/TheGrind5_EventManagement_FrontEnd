//Trang tạo order: Trang này sẽ hiển thị form để người dùng nhập thông tin order

//Import statements để import các thư viện cần thiết
import React, {useState, useEffect} from 'react'; 
import {useParams} from 'react-router-dom'; 
import Header from '../components/Header';

    //event api để lấy thông tin event từ backend
import {eventsAPI, ordersAPI} from '../services/api';

const CreateOrderPage = () => {

    //State declaration để quản lý trạng thái của component
    const {id} = useParams(); //Lấy id từ url 
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

        
    //useEffect hook để lấy thông tin event từ backend
    useEffect(() => {
        const fetchEventData = async () => {
            try{
                setLoading(true); 
                setError(null); // Chưa fetch thì chưa có lỗi
                const eventData = await eventsAPI.getById(id);
                console.log('Event data: ', eventData);
                console.log('Ticket Types: ', eventData.ticketTypes);
                console.log('Setting event state with:', eventData);
                setEvent(eventData);
                setTicketTypes(eventData.ticketTypes || []);
                console.log('Event state should be set now');

                // Kiểm tra nếu không có ticket types
                if (!eventData.ticketTypes || eventData.ticketTypes.length === 0) {
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
        if(id){
            fetchEventData();
        }
    }, [id])

        // Debug useEffect để kiểm tra event state
    useEffect(() => {
        console.log('Event state changed:', event);
        console.log('Loading state:', loading);
        console.log('Error state:', error);
    }, [event, loading, error]);

    
    //Handle functions để xử lý event
    const handleCreateOrder = async (e) => {
        e.preventDefault(); // Ngăn form submit mặc định
        
        // Validate form
        if (!selectedTicketType) {
            setError('Vui lòng chọn loại vé');
            return;
        }

        if (quantity <= 0) {
            setError('Số lượng vé phải lớn hơn 0');
            return;
        }

        try {
            setCreatingOrder(true);
            setError(null);
            
            // Tạo order data
            const orderData = {
                eventId: parseInt(id),
                ticketTypeId: parseInt(selectedTicketType),
                quantity: quantity,
                seatNo: null // Có thể thêm seat selection sau
            };
            
            console.log('Creating order with data:', orderData);
            
            // Gọi API tạo order
            const response = await ordersAPI.create(orderData);
            
            console.log('Order created successfully:', response);
            
            // Hiển thị thành công
            setOrderSuccess(true);
            
            // Redirect đến order details hoặc order list sau 2 giây
            setTimeout(() => {
                window.location.href = '/dashboard'; // Hoặc redirect đến order details
            }, 2000);
            
        } catch (error) {
            console.error('Error creating order:', error);
            setError(error.message || 'Có lỗi xảy ra khi tạo đơn hàng');
        } finally {
            setCreatingOrder(false);
        }
    };


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
                            <button 
                                type="button" 
                                className="btn btn-outline-danger btn-sm ms-2"
                                onClick={() => window.location.reload()}
                            >
                                Thử lại
                            </button>
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

                            <form className="order-form">
                                <div className="form-group">
                                    <label>🎫 Loại vé</label>
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

                                {/* Hiển thị tổng tiền */}
                                {selectedTicketType && quantity > 0 && (
                                    <div className="form-group">
                                        <div className="alert alert-info">
                                            <h5>💰 Tổng tiền:</h5>
                                            {(() => {
                                                const ticketType = ticketTypes.find(tt => tt.ticketTypeId === parseInt(selectedTicketType));
                                                if (ticketType) {
                                                    const totalAmount = ticketType.price * quantity;
                                                    return (
                                                        <>
                                                            <p><strong>Loại vé:</strong> {ticketType.typeName}</p>
                                                            <p><strong>Đơn giá:</strong> {ticketType.price?.toLocaleString()} VND</p>
                                                            <p><strong>Số lượng:</strong> {quantity}</p>
                                                            <p><strong>Tổng cộng:</strong> <span className="text-success fw-bold">{totalAmount.toLocaleString()} VND</span></p>
                                                        </>
                                                    );
                                                }
                                                return null;
                                            })()}
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
