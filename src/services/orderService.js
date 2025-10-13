// Order Management Service
// Quản lý đơn hàng và tích hợp với các service khác

import { InventoryService } from './inventoryService';
import { PaymentService } from './paymentService';
import { ordersAPI } from './api';

export class OrderService {
  // Create order with inventory check
  static async createOrderWithInventoryCheck(orderData) {
    try {
      // 1. Check inventory availability
      const availability = await InventoryService.checkAvailability(
        orderData.ticketTypeId, 
        orderData.quantity
      );

      if (!availability.canPurchase) {
        throw new Error(`Không đủ vé. Chỉ còn ${availability.availableQuantity} vé.`);
      }

      // 2. Reserve tickets temporarily
      const reservation = await InventoryService.reserveTickets(
        orderData.ticketTypeId,
        orderData.quantity
      );

      if (!reservation.success) {
        throw new Error('Không thể tạm giữ vé. Vui lòng thử lại.');
      }

      // 3. Create order
      const order = await ordersAPI.create(orderData);

      return {
        success: true,
        order,
        reservationId: reservation.reservationId,
        expiresAt: reservation.expiresAt
      };
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  // Process payment and complete order
  static async processOrderPayment(orderId, paymentData) {
    try {
      // 1. Validate payment
      const validation = PaymentService.validatePaymentAmount(
        paymentData.amount,
        paymentData.walletBalance,
        paymentData.paymentMethod
      );

      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // 2. Calculate fees
      const paymentCalculation = PaymentService.calculateFees(
        paymentData.amount,
        paymentData.paymentMethod
      );

      // 3. Process payment
      let paymentResult;
      if (paymentData.paymentMethod === 'wallet') {
        paymentResult = await PaymentService.processWalletPayment(
          orderId,
          paymentCalculation.total
        );
      } else {
        paymentResult = await PaymentService.processExternalPayment(
          orderId,
          paymentCalculation.total,
          paymentData.paymentMethod
        );
      }

      // 4. Update order status to paid
      const updatedOrder = await ordersAPI.updateStatus(orderId, 'Paid');

      // 5. Update inventory
      const order = await ordersAPI.getById(orderId);
      await InventoryService.updateInventoryAfterPurchase(
        order.ticketTypeId,
        order.quantity
      );

      return {
        success: true,
        order: updatedOrder,
        payment: paymentResult,
        tickets: await this.generateTicketsForOrder(orderId)
      };
    } catch (error) {
      console.error('Error processing order payment:', error);
      throw error;
    }
  }

  // Generate tickets for completed order
  static async generateTicketsForOrder(orderId) {
    try {
      // This would typically call the backend to generate tickets
      // For now, return mock data
      const order = await ordersAPI.getById(orderId);
      
      const tickets = [];
      for (let i = 0; i < order.quantity; i++) {
        tickets.push({
          ticketId: `ticket_${orderId}_${i + 1}`,
          serialNumber: `EVENT${order.eventId}-${orderId}-${i + 1}`,
          status: 'Assigned',
          issuedAt: new Date().toISOString()
        });
      }

      return tickets;
    } catch (error) {
      console.error('Error generating tickets:', error);
      throw error;
    }
  }

  // Cancel order and release inventory
  static async cancelOrder(orderId) {
    try {
      // 1. Get order details
      const order = await ordersAPI.getById(orderId);

      // 2. Cancel order
      const cancelledOrder = await ordersAPI.updateStatus(orderId, 'Cancelled');

      // 3. Release inventory (if not already processed)
      if (order.status === 'Pending') {
        // Release reserved tickets
        // This would typically involve calling the backend
        console.log('Releasing inventory for cancelled order:', orderId);
      }

      return {
        success: true,
        order: cancelledOrder
      };
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }

  // Get order with full details
  static async getOrderWithDetails(orderId) {
    try {
      const order = await ordersAPI.getById(orderId);
      
      // Add additional details like tickets, payment info, etc.
      const orderWithDetails = {
        ...order,
        tickets: await this.getOrderTickets(orderId),
        paymentHistory: await this.getOrderPaymentHistory(orderId)
      };

      return orderWithDetails;
    } catch (error) {
      console.error('Error getting order details:', error);
      throw error;
    }
  }

  // Get tickets for an order
  static async getOrderTickets(orderId) {
    try {
      // This would call the tickets API
      // For now, return mock data
      return [
        {
          ticketId: 1,
          serialNumber: `EVENT1-${orderId}-1`,
          status: 'Assigned',
          issuedAt: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('Error getting order tickets:', error);
      return [];
    }
  }

  // Get payment history for an order
  static async getOrderPaymentHistory(orderId) {
    try {
      // This would call the payment API
      // For now, return mock data
      return [
        {
          paymentId: 1,
          amount: 500000,
          method: 'wallet',
          status: 'Succeeded',
          timestamp: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('Error getting payment history:', error);
      return [];
    }
  }

  // Get order statistics
  static async getOrderStatistics(userId) {
    try {
      const orders = await ordersAPI.getMyOrders();
      
      const stats = {
        totalOrders: orders.length,
        totalSpent: orders.reduce((sum, order) => sum + order.amount, 0),
        pendingOrders: orders.filter(order => order.status === 'Pending').length,
        paidOrders: orders.filter(order => order.status === 'Paid').length,
        cancelledOrders: orders.filter(order => order.status === 'Cancelled').length
      };

      return stats;
    } catch (error) {
      console.error('Error getting order statistics:', error);
      return {
        totalOrders: 0,
        totalSpent: 0,
        pendingOrders: 0,
        paidOrders: 0,
        cancelledOrders: 0
      };
    }
  }
}

export default OrderService;
