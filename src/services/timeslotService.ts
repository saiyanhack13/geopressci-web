import axiosApi from './axiosApi';

export interface TimeSlot {
  _id: string;
  pressing: string;
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  currentBookings: number;
  availableSpots: number;
  status: 'available' | 'full' | 'blocked' | 'closed';
  slotType: 'regular' | 'express' | 'premium' | 'bulk';
  specialPrice?: number;
  discount?: number;
  availableServices?: string[];
  isBlocked?: boolean;
  blockReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeSlotRequest {
  pressing: string;
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  slotType: 'regular' | 'express' | 'premium' | 'bulk';
  specialPrice?: number;
  discount?: number;
  availableServices?: string[];
  isBlocked?: boolean;
  blockReason?: string;
  isRecurring?: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
    endDate?: string;
  };
}

export interface BulkTimeSlotRequest {
  pressing: string;
  startDate: string;
  endDate: string;
  timeSlots: {
    startTime: string;
    endTime: string;
    maxCapacity: number;
    slotType: 'regular' | 'express' | 'premium' | 'bulk';
    specialPrice?: number;
  }[];
  daysOfWeek: number[];
  skipExistingSlots?: boolean;
}

export interface TimeSlotFilters {
  date?: string;
  startDate?: string;
  endDate?: string;
  slotType?: 'regular' | 'express' | 'premium' | 'bulk';
  minCapacity?: number;
  includeUnavailable?: boolean;
}



export interface TimeSlotStats {
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
  blockedSlots: number;
  occupancyRate: number;
  averageBookingsPerSlot: number;
  peakHours: string[];
  slotTypeDistribution: {
    regular: number;
    express: number;
    premium: number;
    bulk: number;
  };
}

class TimeslotService {
  /**
   * Récupère les créneaux disponibles pour un pressing
   */
  async getAvailableSlots(pressingId: string, filters: TimeSlotFilters = {}): Promise<{
    slots: TimeSlot[];
    totalSlots: number;
    availableSlots: number;
    totalCapacity: number;
    availableCapacity: number;
  }> {
    try {
      const params = new URLSearchParams();
      
      if (filters.date) params.append('date', filters.date);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.slotType) params.append('slotType', filters.slotType);
      if (filters.minCapacity) params.append('minCapacity', filters.minCapacity.toString());
      if (filters.includeUnavailable) params.append('includeUnavailable', filters.includeUnavailable.toString());

      const response = await axiosApi.get(`/pressings/${pressingId}/available-slots?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des créneaux:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau créneau horaire
   */
  async createTimeSlot(pressingId: string, slotData: {
    date: string;
    startTime: string;
    endTime: string;
    maxCapacity?: number;
    slotType?: 'regular' | 'express' | 'premium' | 'bulk';
    specialPrice?: number;
    discount?: number;
    availableServices?: string[];
    recurrence?: {
      isRecurring: boolean;
      frequency: 'daily' | 'weekly' | 'monthly';
      endDate: string;
    };
  }): Promise<TimeSlot> {
    try {
      const response = await axiosApi.post(`/pressings/${pressingId}/time-slots`, slotData);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la création du créneau:', error);
      throw error;
    }
  }

  /**
   * Met à jour un créneau horaire
   */
  async updateTimeSlot(slotId: string, updateData: {
    maxCapacity?: number;
    specialPrice?: number;
    discount?: number;
    availableServices?: string[];
    internalNotes?: string;
  }): Promise<TimeSlot> {
    try {
      const response = await axiosApi.put(`/time-slots/${slotId}`, updateData);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du créneau:', error);
      throw error;
    }
  }

  /**
   * Bloque ou débloque un créneau
   */
  async toggleBlockTimeSlot(slotId: string, blocked: boolean, reason?: string): Promise<TimeSlot> {
    try {
      const response = await axiosApi.patch(`/time-slots/${slotId}/toggle-block`, {
        blocked,
        reason
      });
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors du blocage/déblocage du créneau:', error);
      throw error;
    }
  }

  /**
   * Supprime un créneau horaire
   */
  async deleteTimeSlot(slotId: string): Promise<void> {
    try {
      await axiosApi.delete(`/time-slots/${slotId}`);
    } catch (error) {
      console.error('Erreur lors de la suppression du créneau:', error);
      throw error;
    }
  }

  /**
   * Crée des créneaux en lot
   */
  async createBulkTimeSlots(pressingId: string, bulkData: BulkTimeSlotRequest): Promise<{
    created: number;
    skipped: number;
    errors: number;
    details: {
      createdSlots: string[];
      skippedSlots: string[];
      errorSlots: { slot: any; error: string }[];
    };
  }> {
    try {
      const response = await axiosApi.post(`/pressings/${pressingId}/bulk-time-slots`, bulkData);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la création en lot des créneaux:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des créneaux
   */
  async getSlotStats(pressingId: string, filters: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<TimeSlotStats> {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await axiosApi.get(`/pressings/${pressingId}/slot-stats?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Formate une date pour l'API (YYYY-MM-DD)
   */
  formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Parse une date depuis le format API
   */
  parseDateFromAPI(dateString: string): Date {
    return new Date(dateString);
  }

  /**
   * Vérifie si un créneau est disponible
   */
  isSlotAvailable(slot: TimeSlot): boolean {
    return slot.status === 'available' && slot.availableSpots > 0;
  }

  /**
   * Calcule le prix final d'un créneau avec remise
   */
  calculateSlotPrice(slot: TimeSlot, basePrice: number): number {
    let finalPrice = slot.specialPrice || basePrice;
    
    if (slot.discount && slot.discount > 0) {
      finalPrice = finalPrice * (1 - slot.discount / 100);
    }
    
    return Math.round(finalPrice);
  }

  /**
   * Groupe les créneaux par période de la journée
   */
  groupSlotsByPeriod(slots: TimeSlot[]): {
    morning: TimeSlot[];
    afternoon: TimeSlot[];
    evening: TimeSlot[];
  } {
    return slots.reduce((groups, slot) => {
      const hour = parseInt(slot.startTime.split(':')[0]);
      
      if (hour < 12) {
        groups.morning.push(slot);
      } else if (hour < 18) {
        groups.afternoon.push(slot);
      } else {
        groups.evening.push(slot);
      }
      
      return groups;
    }, { morning: [] as TimeSlot[], afternoon: [] as TimeSlot[], evening: [] as TimeSlot[] });
  }

  /**
   * Filtre les créneaux par type
   */
  filterSlotsByType(slots: TimeSlot[], type: string): TimeSlot[] {
    return slots.filter(slot => slot.slotType === type);
  }

  /**
   * Trouve le prochain créneau disponible
   */
  findNextAvailableSlot(slots: TimeSlot[]): TimeSlot | null {
    const availableSlots = slots
      .filter(slot => this.isSlotAvailable(slot))
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.startTime}`);
        const dateB = new Date(`${b.date}T${b.startTime}`);
        return dateA.getTime() - dateB.getTime();
      });

    return availableSlots.length > 0 ? availableSlots[0] : null;
  }

  /**
   * Génère des créneaux par défaut pour une semaine
   */
  generateDefaultWeeklySlots(startDate: Date): BulkTimeSlotRequest {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    return {
      pressing: '', // À remplir par l'appelant
      startDate: this.formatDateForAPI(startDate),
      endDate: this.formatDateForAPI(endDate),
      timeSlots: [
        { startTime: '08:00', endTime: '09:00', maxCapacity: 3, slotType: 'regular' },
        { startTime: '09:00', endTime: '10:00', maxCapacity: 5, slotType: 'regular' },
        { startTime: '10:00', endTime: '11:00', maxCapacity: 5, slotType: 'regular' },
        { startTime: '11:00', endTime: '12:00', maxCapacity: 3, slotType: 'regular' },
        { startTime: '14:00', endTime: '15:00', maxCapacity: 5, slotType: 'regular' },
        { startTime: '15:00', endTime: '16:00', maxCapacity: 5, slotType: 'express' },
        { startTime: '16:00', endTime: '17:00', maxCapacity: 3, slotType: 'regular' },
        { startTime: '17:00', endTime: '18:00', maxCapacity: 2, slotType: 'premium' },
        { startTime: '18:00', endTime: '19:00', maxCapacity: 2, slotType: 'premium' }
      ],
      daysOfWeek: [1, 2, 3, 4, 5, 6], // Lundi à Samedi
      skipExistingSlots: true
    };
  }

  /**
   * Obtient le libellé d'un type de créneau
   */
  getSlotTypeLabel(slotType: string): string {
    const labels: { [key: string]: string } = {
      regular: 'Standard',
      express: 'Express',
      premium: 'Premium',
      bulk: 'En lot'
    };
    return labels[slotType] || slotType;
  }

  /**
   * Bloque un créneau horaire
   */
  async blockTimeSlot(slotId: string, blockData: { reason: string }): Promise<TimeSlot> {
    try {
      const response = await axiosApi.patch(`/timeslots/${slotId}/block`, blockData);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors du blocage du créneau:', error);
      throw error;
    }
  }
}

export const timeslotService = new TimeslotService();
export default timeslotService;
