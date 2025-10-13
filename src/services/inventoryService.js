// Inventory Management Service
// Quản lý kho vé và tính khả dụng

export class InventoryService {
  // Kiểm tra tính khả dụng của vé
  static async checkAvailability(ticketTypeId, requestedQuantity) {
    try {
      const response = await fetch(`/api/Ticket/event/${ticketTypeId}/types`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check ticket availability');
      }

      const ticketTypes = await response.json();
      const ticketType = ticketTypes.find(tt => tt.ticketTypeId === ticketTypeId);
      
      if (!ticketType) {
        return {
          available: false,
          availableQuantity: 0,
          canPurchase: false
        };
      }

      return {
        available: ticketType.availableQuantity > 0,
        availableQuantity: ticketType.availableQuantity,
        canPurchase: requestedQuantity <= ticketType.availableQuantity
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      return {
        available: false,
        availableQuantity: 0,
        canPurchase: false
      };
    }
  }

  // Reserve tickets (tạm giữ vé)
  static async reserveTickets(ticketTypeId, quantity) {
    try {
      // TODO: Implement reservation logic
      // This would typically:
      // 1. Check availability
      // 2. Create temporary reservation
      // 3. Set expiration time
      // 4. Return reservation ID
      
      return {
        success: true,
        reservationId: `res_${Date.now()}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      };
    } catch (error) {
      console.error('Error reserving tickets:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Release reservation (hủy tạm giữ)
  static async releaseReservation(reservationId) {
    try {
      // TODO: Implement release logic
      return {
        success: true
      };
    } catch (error) {
      console.error('Error releasing reservation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update inventory after successful purchase
  static async updateInventoryAfterPurchase(ticketTypeId, quantity) {
    try {
      // This is handled automatically by the backend when creating tickets
      // The inventory is updated when tickets are generated for the order
      // We just need to verify the purchase was successful
      
      return {
        success: true,
        message: 'Inventory updated successfully'
      };
    } catch (error) {
      console.error('Error updating inventory:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get inventory status for an event
  static async getEventInventory(eventId) {
    try {
      const response = await fetch(`/api/Ticket/event/${eventId}/types`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get event inventory');
      }

      const ticketTypes = await response.json();
      
      const totalSold = ticketTypes.reduce((sum, tt) => sum + (tt.quantity - tt.availableQuantity), 0);
      const totalAvailable = ticketTypes.reduce((sum, tt) => sum + tt.availableQuantity, 0);
      const totalRevenue = ticketTypes.reduce((sum, tt) => 
        sum + ((tt.quantity - tt.availableQuantity) * tt.price), 0);

      return {
        eventId,
        ticketTypes: ticketTypes.map(tt => ({
          ticketTypeId: tt.ticketTypeId,
          typeName: tt.typeName,
          totalQuantity: tt.quantity,
          availableQuantity: tt.availableQuantity,
          soldQuantity: tt.quantity - tt.availableQuantity,
          revenue: (tt.quantity - tt.availableQuantity) * tt.price
        })),
        totalRevenue,
        totalSold,
        totalAvailable
      };
    } catch (error) {
      console.error('Error getting event inventory:', error);
      return null;
    }
  }
}

export default InventoryService;
