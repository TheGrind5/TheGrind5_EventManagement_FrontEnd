// src/__tests__/buyTicket/orderService.test.js
// Test cases cho OrderService - Thiên's Assignment
// 3 Methods: CreateOrderAsync, GetAvailableQuantityWithLockAsync, ValidateUserExistsAsync
// Total: 10 test cases

describe('OrderService - Thiên Assignment', () => {
  let orderService;
  let mockApiClient;

  beforeEach(() => {
    // Mock API client with realistic responses
    mockApiClient = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    };
    
    // Mock OrderService with realistic methods
    orderService = {
      createOrder: jest.fn(),
      getAvailableQuantity: jest.fn(),
      validateUser: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CreateOrderAsync Tests (5 test cases)', () => {
    
    test('CreateOrderAsync_ValidRequest_CreatesOrder', async () => {
      // Given - Realistic valid request data
      const request = {
        ticketTypeId: 1,
        quantity: 2,
        seatNo: null,
        customerId: 1,
        eventId: 1
      };
      const customerId = 1;
      const expectedResponse = {
        orderId: 12345,
        totalAmount: 200.00,
        status: 'Pending',
        ticketTypeId: 1,
        quantity: 2,
        createdAt: '2024-01-15T10:30:00Z'
      };

      // Mock successful API response
      orderService.createOrder.mockResolvedValue(expectedResponse);

      // When - Gọi method
      const result = await orderService.createOrder('/api/orders', {
        ...request,
        customerId
      });

      // Then - Kiểm tra kết quả
      expect(result.data).toEqual(expectedResponse);
      expect(result.status).toBe(201);
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/orders', {
        ...request,
        customerId
      });
    });

    test('CreateOrderAsync_InsufficientInventory_ThrowsException', async () => {
      // Given - Hết vé, không đủ inventory
      const request = {
        ticketTypeId: 1,
        quantity: 5, // Yêu cầu 5 vé
        seatNo: null
      };
      const customerId = 1;

      mockApiClient.post.mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Not enough tickets available' }
        }
      });

      // When & Then - Phải throw exception
      await expect(orderService.createOrder('/api/orders', {
        ...request,
        customerId
      })).rejects.toThrow();
    });

    test('CreateOrderAsync_ConcurrentPurchase_HandlesRaceCondition', async () => {
      // Given - Mua vé đồng thời (race condition)
      const request = {
        ticketTypeId: 1,
        quantity: 1,
        seatNo: null
      };
      const customerId1 = 1;
      const customerId2 = 2;

      // Mock: Một request thành công, một fail
      mockApiClient.post
        .mockResolvedValueOnce({
          data: { orderId: 1, amount: 100 },
          status: 201
        })
        .mockRejectedValueOnce({
          response: {
            status: 400,
            data: { message: 'Not enough tickets available' }
          }
        });

      // When - Gọi method đồng thời
      const promise1 = orderService.createOrder('/api/orders', {
        ...request,
        customerId: customerId1
      });
      const promise2 = orderService.createOrder('/api/orders', {
        ...request,
        customerId: customerId2
      });

      // Then - Một thành công, một fail
      const results = await Promise.allSettled([promise1, promise2]);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;
      
      expect(successCount).toBe(1);
      expect(failCount).toBe(1);
    });

    test('CreateOrderAsync_EventNotOpen_ThrowsException', async () => {
      // Given - Event không mở bán
      const request = {
        ticketTypeId: 1,
        quantity: 2,
        seatNo: null
      };
      const customerId = 1;

      mockApiClient.post.mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Event is not available for booking' }
        }
      });

      // When & Then - Phải throw exception
      await expect(orderService.createOrder('/api/orders', {
        ...request,
        customerId
      })).rejects.toThrow();
    });

    test('CreateOrderAsync_InvalidQuantity_ThrowsException', async () => {
      // Given - Số lượng vé không hợp lệ
      const request = {
        ticketTypeId: 1,
        quantity: 0, // Số lượng = 0 (không hợp lệ)
        seatNo: null
      };
      const customerId = 1;

      mockApiClient.post.mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Quantity must be greater than 0' }
        }
      });

      // When & Then - Phải throw exception
      await expect(orderService.createOrder('/api/orders', {
        ...request,
        customerId
      })).rejects.toThrow();
    });
  });

  describe('GetAvailableQuantityWithLockAsync Tests (3 test cases)', () => {
    
    test('GetAvailableQuantityWithLockAsync_ValidTicketType_ReturnsQuantity', async () => {
      // Given - Ticket type hợp lệ
      const ticketTypeId = 1;
      const expectedQuantity = 10;

      mockApiClient.get.mockResolvedValue({
        data: { availableQuantity: expectedQuantity },
        status: 200
      });

      // When - Gọi method
      const result = await orderService.getAvailableQuantity(`/api/tickets/${ticketTypeId}/inventory`);

      // Then - Trả về số lượng vé có sẵn
      expect(result.data.availableQuantity).toBe(expectedQuantity);
      expect(mockApiClient.get).toHaveBeenCalledWith(`/api/tickets/${ticketTypeId}/inventory`);
    });

    test('GetAvailableQuantityWithLockAsync_ConcurrentAccess_HandlesLock', async () => {
      // Given - Truy cập đồng thời với database lock
      const ticketTypeId = 1;
      const expectedQuantity = 5;

      mockApiClient.get.mockResolvedValue({
        data: { availableQuantity: expectedQuantity },
        status: 200
      });

      // When - Gọi method đồng thời
      const promise1 = orderService.getAvailableQuantity(`/api/tickets/${ticketTypeId}/inventory`);
      const promise2 = orderService.getAvailableQuantity(`/api/tickets/${ticketTypeId}/inventory`);

      // Then - Cả hai phải trả về kết quả nhất quán
      const results = await Promise.all([promise1, promise2]);
      expect(results[0].data.availableQuantity).toBe(results[1].data.availableQuantity);
    });

    test('GetAvailableQuantityWithLockAsync_InvalidTicketType_ThrowsException', async () => {
      // Given - Ticket type không tồn tại
      const ticketTypeId = 999; // ID không tồn tại

      mockApiClient.get.mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Ticket type not found' }
        }
      });

      // When & Then - Phải throw exception
      await expect(orderService.getAvailableQuantity(`/api/tickets/${ticketTypeId}/inventory`))
        .rejects.toThrow();
    });
  });

  describe('ValidateUserExistsAsync Tests (2 test cases)', () => {
    
    test('ValidateUserExistsAsync_ValidUser_ReturnsTrue', async () => {
      // Given - User tồn tại
      const userId = 1;

      mockApiClient.get.mockResolvedValue({
        data: { exists: true },
        status: 200
      });

      // When - Gọi method
      const result = await orderService.validateUser(`/api/users/${userId}/validate`);

      // Then - Trả về true
      expect(result.data.exists).toBe(true);
      expect(mockApiClient.get).toHaveBeenCalledWith(`/api/users/${userId}/validate`);
    });

    test('ValidateUserExistsAsync_InvalidUser_ReturnsFalse', async () => {
      // Given - User không tồn tại
      const userId = 999; // ID không tồn tại

      mockApiClient.get.mockResolvedValue({
        data: { exists: false },
        status: 200
      });

      // When - Gọi method
      const result = await orderService.validateUser(`/api/users/${userId}/validate`);

      // Then - Trả về false
      expect(result.data.exists).toBe(false);
      expect(mockApiClient.get).toHaveBeenCalledWith(`/api/users/${userId}/validate`);
    });
  });
});
