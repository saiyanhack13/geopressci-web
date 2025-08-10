import axiosApi from './axiosApi';

export interface AppointmentServiceItem {
  service: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Address {
  street: string;
  city: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface Appointment {
  _id: string;
  client: string | {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  pressing: string | {
    _id: string;
    businessName: string;
    phone: string;
    address: string;
  };
  timeSlot: string | {
    _id: string;
    date: string;
    startTime: string;
    endTime: string;
    slotType: string;
  };
  order?: string;
  services: AppointmentServiceItem[];
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  appointmentDate: string;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  notes?: string;
  internalNotes?: string;
  pickupAddress?: Address;
  deliveryAddress?: Address;
  estimatedDuration?: number;
  actualDuration?: number;
  specialInstructions?: string;
  cancellation?: {
    reason: string;
    cancelledAt: string;
    cancelledBy: string;
    refundRequested: boolean;
  };
  rescheduleHistory?: Array<{
    oldTimeSlot: string;
    newTimeSlot: string;
    reason: string;
    rescheduledAt: string;
  }>;
  rating?: {
    score: number;
    comment: string;
    date: string;
  };
  reminders: {
    sent24h: boolean;
    sent2h: boolean;
    sent30min: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentRequest {
  pressing: string;
  timeSlot: string;
  services: {
    service: string;
    quantity: number;
  }[];
  notes?: string;
  pickupAddress?: Address;
  deliveryAddress?: Address;
}

export interface AppointmentFilters {
  status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  pressing?: string;
  client?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: 'appointmentDate' | 'createdAt' | 'status' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
}

export interface AppointmentStats {
  totalAppointments: number;
  statusDistribution: {
    pending: number;
    confirmed: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    no_show: number;
  };
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
  averageRevenue: number;
  totalRevenue: number;
  appointmentsByDay: Array<{
    date: string;
    count: number;
    revenue: number;
  }>;
}

class AppointmentServiceClass {
  /**
   * Crée un nouveau rendez-vous
   */
  async createAppointment(appointmentData: CreateAppointmentRequest): Promise<Appointment> {
    try {
      const response = await axiosApi.post('/appointments', appointmentData);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la création du rendez-vous:', error);
      throw error;
    }
  }

  /**
   * Récupère la liste des rendez-vous avec filtres
   */
  async getAppointments(filters: AppointmentFilters = {}): Promise<{
    appointments: Appointment[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }> {
    try {
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.pressing) params.append('pressing', filters.pressing);
      if (filters.client) params.append('client', filters.client);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await axiosApi.get(`/appointments?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des rendez-vous:', error);
      throw error;
    }
  }

  /**
   * Récupère un rendez-vous par ID
   */
  async getAppointmentById(appointmentId: string): Promise<Appointment> {
    try {
      const response = await axiosApi.get(`/appointments/${appointmentId}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du rendez-vous:', error);
      throw error;
    }
  }

  /**
   * Confirme un rendez-vous (pressing/admin uniquement)
   */
  async confirmAppointment(appointmentId: string, confirmationData: {
    estimatedDuration?: number;
    specialInstructions?: string;
    internalNotes?: string;
  } = {}): Promise<Appointment> {
    try {
      const response = await axiosApi.patch(`/appointments/${appointmentId}/confirm`, confirmationData);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la confirmation du rendez-vous:', error);
      throw error;
    }
  }

  /**
   * Annule un rendez-vous
   */
  async cancelAppointment(appointmentId: string, cancellationData: {
    reason: string;
    refundRequested?: boolean;
  }): Promise<Appointment> {
    try {
      const response = await axiosApi.patch(`/appointments/${appointmentId}/cancel`, cancellationData);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de l\'annulation du rendez-vous:', error);
      throw error;
    }
  }

  /**
   * Reporte un rendez-vous
   */
  async rescheduleAppointment(appointmentId: string, rescheduleData: {
    newTimeSlot: string;
    reason?: string;
  }): Promise<Appointment> {
    try {
      const response = await axiosApi.patch(`/appointments/${appointmentId}/reschedule`, rescheduleData);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors du report du rendez-vous:', error);
      throw error;
    }
  }

  /**
   * Marque un rendez-vous comme terminé (pressing/admin uniquement)
   */
  async completeAppointment(appointmentId: string, completionData: {
    actualDuration?: number;
    qualityNotes?: string;
    completionPhotos?: string[];
    nextAppointmentSuggested?: boolean;
  } = {}): Promise<Appointment> {
    try {
      const response = await axiosApi.patch(`/appointments/${appointmentId}/complete`, completionData);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la completion du rendez-vous:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des rendez-vous
   */
  async getAppointmentStats(filters: {
    pressing?: string;
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
  } = {}): Promise<AppointmentStats> {
    try {
      const params = new URLSearchParams();
      if (filters.pressing) params.append('pressing', filters.pressing);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.groupBy) params.append('groupBy', filters.groupBy);

      const response = await axiosApi.get(`/appointments/stats?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Récupère les rendez-vous du jour pour un pressing
   */
  async getTodayAppointments(pressingId?: string): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0];
    const filters: AppointmentFilters = {
      startDate: today,
      endDate: today,
      sortBy: 'appointmentDate',
      sortOrder: 'asc'
    };

    if (pressingId) {
      filters.pressing = pressingId;
    }

    const result = await this.getAppointments(filters);
    return result.appointments;
  }

  /**
   * Récupère les rendez-vous à venir pour un client
   */
  async getUpcomingAppointments(clientId?: string, limit: number = 10): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0];
    const filters: AppointmentFilters = {
      startDate: today,
      status: 'confirmed',
      sortBy: 'appointmentDate',
      sortOrder: 'asc',
      limit
    };

    if (clientId) {
      filters.client = clientId;
    }

    const result = await this.getAppointments(filters);
    return result.appointments;
  }

  /**
   * Vérifie si un rendez-vous peut être annulé
   */
  canBeCancelled(appointment: Appointment): boolean {
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return false;
    }

    // Vérifier si le rendez-vous est dans moins de 2 heures
    const appointmentTime = new Date(appointment.appointmentDate);
    const now = new Date();
    const timeDiff = appointmentTime.getTime() - now.getTime();
    const hoursUntilAppointment = timeDiff / (1000 * 60 * 60);

    return hoursUntilAppointment > 2;
  }

  /**
   * Vérifie si un rendez-vous peut être reporté
   */
  canBeRescheduled(appointment: Appointment): boolean {
    return this.canBeCancelled(appointment);
  }

  /**
   * Calcule le temps restant avant un rendez-vous
   */
  getTimeUntilAppointment(appointment: Appointment): {
    days: number;
    hours: number;
    minutes: number;
    totalMinutes: number;
  } {
    const appointmentTime = new Date(appointment.appointmentDate);
    const now = new Date();
    const timeDiff = appointmentTime.getTime() - now.getTime();

    if (timeDiff <= 0) {
      return { days: 0, hours: 0, minutes: 0, totalMinutes: 0 };
    }

    const totalMinutes = Math.floor(timeDiff / (1000 * 60));
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    return { days, hours, minutes, totalMinutes };
  }

  /**
   * Formate la date et l'heure d'un rendez-vous
   */
  formatAppointmentDateTime(appointment: Appointment): string {
    const date = new Date(appointment.appointmentDate);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtient le statut en français
   */
  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      pending: 'En attente',
      confirmed: 'Confirmé',
      in_progress: 'En cours',
      completed: 'Terminé',
      cancelled: 'Annulé',
      no_show: 'Absent'
    };
    return statusLabels[status] || status;
  }

  /**
   * Obtient la couleur du statut pour l'affichage
   */
  getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      pending: 'yellow',
      confirmed: 'blue',
      in_progress: 'purple',
      completed: 'green',
      cancelled: 'red',
      no_show: 'gray'
    };
    return statusColors[status] || 'gray';
  }

  /**
   * Calcule le montant total des services
   */
  calculateTotalAmount(services: AppointmentServiceItem[]): number {
    return services.reduce((total, service) => total + service.totalPrice, 0);
  }

  /**
   * Groupe les rendez-vous par statut
   */
  groupAppointmentsByStatus(appointments: Appointment[]): { [status: string]: Appointment[] } {
    return appointments.reduce((groups, appointment) => {
      const status = appointment.status;
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(appointment);
      return groups;
    }, {} as { [status: string]: Appointment[] });
  }

  /**
   * Filtre les rendez-vous par date
   */
  filterAppointmentsByDate(appointments: Appointment[], startDate: Date, endDate: Date): Appointment[] {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      return appointmentDate >= startDate && appointmentDate <= endDate;
    });
  }
}

export const appointmentService = new AppointmentServiceClass();
export default appointmentService;
