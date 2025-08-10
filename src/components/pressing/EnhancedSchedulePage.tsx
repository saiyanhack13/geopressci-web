import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/types';
import { toast } from 'react-hot-toast';
import {
  Calendar,
  Clock,
  Plus,
  Edit3,
  Trash2,
  Users,
  Settings,
  Filter,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';

import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { timeslotService, TimeSlot, CreateTimeSlotRequest } from '../../services/timeslotService';
import { appointmentService, Appointment } from '../../services/appointmentService';

interface EnhancedSchedulePageProps {
  pressingId: string;
  className?: string;
}

interface CalendarView {
  type: 'day' | 'week' | 'month';
  date: Date;
}

interface ScheduleStats {
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  revenue: number;
  occupancyRate: number;
}

const EnhancedSchedulePage: React.FC<EnhancedSchedulePageProps> = ({
  pressingId,
  className
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<CalendarView>({ type: 'week', date: new Date() });
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [stats, setStats] = useState<ScheduleStats | null>(null);
  const [filters, setFilters] = useState({
    slotType: '',
    status: '',
    showBlocked: true
  });

  // Formulaire de création/édition de créneau
  const [slotForm, setSlotForm] = useState<Partial<CreateTimeSlotRequest>>({
    date: '',
    startTime: '',
    endTime: '',
    maxCapacity: 4,
    slotType: 'regular',
    specialPrice: 0,
    isBlocked: false,
    blockReason: '',
    isRecurring: false,
    recurringPattern: {
      frequency: 'weekly',
      interval: 1,
      daysOfWeek: [],
      endDate: ''
    }
  });

  useEffect(() => {
    if (pressingId) {
      loadScheduleData();
    }
  }, [pressingId, view]);

  const loadScheduleData = async () => {
    setLoading(true);
    try {
      const startDate = getViewStartDate();
      const endDate = getViewEndDate();

      // Charger les créneaux
      const slotsResponse = await timeslotService.getAvailableSlots(pressingId, {
        startDate: timeslotService.formatDateForAPI(startDate),
        endDate: timeslotService.formatDateForAPI(endDate),
        includeUnavailable: true,
        slotType: filters.slotType as 'regular' | 'express' | 'premium' | 'bulk' || undefined
      });

      let filteredSlots = slotsResponse.slots;
      
      if (!filters.showBlocked) {
        filteredSlots = filteredSlots.filter(slot => !slot.isBlocked);
      }

      setTimeSlots(filteredSlots);

      // Charger les rendez-vous
      const appointmentsResponse = await appointmentService.getAppointments({
        pressing: pressingId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: filters.status as 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' || undefined,
        limit: 100
      });

      setAppointments(appointmentsResponse.appointments);

      // Calculer les statistiques
      calculateStats(filteredSlots, appointmentsResponse.appointments);

    } catch (error) {
      console.error('Erreur lors du chargement du planning:', error);
      toast.error('Erreur lors du chargement du planning');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (slots: TimeSlot[], appointments: Appointment[]) => {
    const totalSlots = slots.length;
    const bookedSlots = slots.filter(slot => slot.currentBookings > 0).length;
    const availableSlots = slots.filter(slot => 
      timeslotService.isSlotAvailable(slot)
    ).length;

    const revenue = appointments
      .filter(apt => apt.status === 'completed')
      .reduce((sum, apt) => sum + apt.totalAmount, 0);

    const occupancyRate = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0;

    setStats({
      totalSlots,
      bookedSlots,
      availableSlots,
      revenue,
      occupancyRate
    });
  };

  const getViewStartDate = () => {
    const date = new Date(view.date);
    switch (view.type) {
      case 'day':
        return date;
      case 'week':
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        return startOfWeek;
      case 'month':
        return new Date(date.getFullYear(), date.getMonth(), 1);
      default:
        return date;
    }
  };

  const getViewEndDate = () => {
    const date = new Date(view.date);
    switch (view.type) {
      case 'day':
        return date;
      case 'week':
        const endOfWeek = new Date(date);
        endOfWeek.setDate(date.getDate() - date.getDay() + 6);
        return endOfWeek;
      case 'month':
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
      default:
        return date;
    }
  };

  const handleCreateSlot = async () => {
    try {
      if (!slotForm.date || !slotForm.startTime || !slotForm.endTime) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }

      await timeslotService.createTimeSlot(pressingId, {
        date: slotForm.date!,
        startTime: slotForm.startTime!,
        endTime: slotForm.endTime!,
        maxCapacity: slotForm.maxCapacity || 4,
        slotType: slotForm.slotType as 'regular' | 'express' | 'premium' | 'bulk',
        specialPrice: slotForm.specialPrice || 0
      });

      toast.success('Créneau créé avec succès');
      setShowCreateModal(false);
      resetSlotForm();
      loadScheduleData();
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleEditSlot = async () => {
    if (!selectedSlot) return;

    try {
      await timeslotService.updateTimeSlot(selectedSlot._id, slotForm);
      toast.success('Créneau modifié avec succès');
      setShowEditModal(false);
      setSelectedSlot(null);
      resetSlotForm();
      loadScheduleData();
    } catch (error: any) {
      console.error('Erreur lors de la modification:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce créneau ?')) return;

    try {
      await timeslotService.deleteTimeSlot(slotId);
      toast.success('Créneau supprimé avec succès');
      loadScheduleData();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleBlockSlot = async (slotId: string, reason: string) => {
    try {
      await timeslotService.blockTimeSlot(slotId, { reason });
      toast.success('Créneau bloqué avec succès');
      loadScheduleData();
    } catch (error: any) {
      console.error('Erreur lors du blocage:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du blocage');
    }
  };

  const resetSlotForm = () => {
    setSlotForm({
      date: '',
      startTime: '',
      endTime: '',
      maxCapacity: 4,
      slotType: 'regular',
      specialPrice: 0,
      isBlocked: false,
      blockReason: '',
      isRecurring: false,
      recurringPattern: {
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [],
        endDate: ''
      }
    });
  };

  const openEditModal = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setSlotForm({
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      maxCapacity: slot.maxCapacity,
      slotType: slot.slotType,
      specialPrice: slot.specialPrice || 0,
      isBlocked: slot.isBlocked,
      blockReason: slot.blockReason || ''
    });
    setShowEditModal(true);
  };

  const getSlotStatusColor = (slot: TimeSlot) => {
    if (slot.isBlocked) return 'bg-red-100 border-red-300 text-red-800';
    if (slot.currentBookings >= slot.maxCapacity) return 'bg-gray-100 border-gray-300 text-gray-600';
    if (slot.currentBookings > 0) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    return 'bg-green-100 border-green-300 text-green-800';
  };

  const getSlotStatusIcon = (slot: TimeSlot) => {
    if (slot.isBlocked) return <XCircle className="w-4 h-4" />;
    if (slot.currentBookings >= slot.maxCapacity) return <AlertCircle className="w-4 h-4" />;
    if (slot.currentBookings > 0) return <Clock className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const renderCalendarHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Planning</h1>
        
        <div className="flex items-center gap-2">
          <Button
            variant={view.type === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView(prev => ({ ...prev, type: 'day' }))}
          >
            Jour
          </Button>
          <Button
            variant={view.type === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView(prev => ({ ...prev, type: 'week' }))}
          >
            Semaine
          </Button>
          <Button
            variant={view.type === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView(prev => ({ ...prev, type: 'month' }))}
          >
            Mois
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowStatsModal(true)}
          className="flex items-center gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          Statistiques
        </Button>
        
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau créneau
        </Button>
      </div>
    </div>
  );

  const renderFilters = () => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtres:</span>
        </div>
        
        <select
          value={filters.slotType}
          onChange={(e) => setFilters(prev => ({ ...prev, slotType: e.target.value }))}
          className="px-3 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="">Tous les types</option>
          <option value="regular">Standard</option>
          <option value="express">Express</option>
          <option value="premium">Premium</option>
          <option value="bulk">En lot</option>
        </select>
        
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          className="px-3 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmé</option>
          <option value="completed">Terminé</option>
          <option value="cancelled">Annulé</option>
        </select>
        
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.showBlocked}
            onChange={(e) => setFilters(prev => ({ ...prev, showBlocked: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Afficher les créneaux bloqués
        </label>
        
        <Button
          variant="outline"
          size="sm"
          onClick={loadScheduleData}
          className="ml-auto"
        >
          Appliquer
        </Button>
      </div>
    </div>
  );

  const renderTimeSlotCard = (slot: TimeSlot) => {
    const slotAppointments = appointments.filter(apt => 
      typeof apt.timeSlot === 'object' && apt.timeSlot._id === slot._id
    );

    return (
      <div
        key={slot._id}
        className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${getSlotStatusColor(slot)}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getSlotStatusIcon(slot)}
            <span className="font-medium">
              {slot.startTime} - {slot.endTime}
            </span>
            {slot.slotType !== 'regular' && (
              <span className="text-xs bg-white px-2 py-1 rounded">
                {timeslotService.getSlotTypeLabel(slot.slotType)}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => openEditModal(slot)}
              className="p-1 text-gray-500 hover:text-blue-600"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteSlot(slot._id)}
              className="p-1 text-gray-500 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="text-sm space-y-1">
          <div className="flex items-center justify-between">
            <span>Capacité:</span>
            <span>{slot.currentBookings}/{slot.maxCapacity}</span>
          </div>
          
          {slot.specialPrice && slot.specialPrice > 0 && (
            <div className="flex items-center justify-between">
              <span>Prix spécial:</span>
              <span>{slot.specialPrice.toLocaleString()} FCFA</span>
            </div>
          )}
          
          {slot.isBlocked && (
            <div className="text-red-600 text-xs mt-2">
              🚫 Bloqué: {slot.blockReason}
            </div>
          )}
          
          {slotAppointments.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs font-medium mb-1">Rendez-vous:</p>
              {slotAppointments.slice(0, 2).map(apt => (
                <div key={apt._id} className="text-xs text-gray-600">
                  • {typeof apt.client === 'object' ? apt.client.firstName : 'Client'}
                </div>
              ))}
              {slotAppointments.length > 2 && (
                <div className="text-xs text-gray-500">
                  +{slotAppointments.length - 2} autre(s)
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement du planning...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {renderCalendarHeader()}
      {renderFilters()}

      {/* Statistiques rapides */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total créneaux</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalSlots}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Réservés</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.bookedSlots}</p>
              </div>
              <Users className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Disponibles</p>
                <p className="text-2xl font-bold text-green-600">{stats.availableSlots}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taux occupation</p>
                <p className="text-2xl font-bold text-purple-600">{stats.occupancyRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenus</p>
                <p className="text-2xl font-bold text-blue-600">{stats.revenue.toLocaleString()}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>
      )}

      {/* Grille des créneaux */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Créneaux du {getViewStartDate().toLocaleDateString('fr-FR')} au {getViewEndDate().toLocaleDateString('fr-FR')}
        </h2>
        
        {timeSlots.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun créneau trouvé</h3>
            <p className="text-gray-600 mb-4">
              Créez votre premier créneau pour commencer à recevoir des réservations
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              Créer un créneau
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {timeSlots.map(renderTimeSlotCard)}
          </div>
        )}
      </div>

      {/* Modal de création */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer un nouveau créneau"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={slotForm.date}
                onChange={(e) => setSlotForm(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de créneau
              </label>
              <select
                value={slotForm.slotType}
                onChange={(e) => setSlotForm(prev => ({ ...prev, slotType: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="regular">Standard</option>
                <option value="express">Express</option>
                <option value="premium">Premium</option>
                <option value="bulk">En lot</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heure de début *
              </label>
              <input
                type="time"
                value={slotForm.startTime}
                onChange={(e) => setSlotForm(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heure de fin *
              </label>
              <input
                type="time"
                value={slotForm.endTime}
                onChange={(e) => setSlotForm(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacité maximale
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={slotForm.maxCapacity}
                onChange={(e) => setSlotForm(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix spécial (optionnel)
              </label>
              <input
                type="number"
                min="0"
                value={slotForm.specialPrice}
                onChange={(e) => setSlotForm(prev => ({ ...prev, specialPrice: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={slotForm.isBlocked}
                onChange={(e) => setSlotForm(prev => ({ ...prev, isBlocked: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Créneau bloqué</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={slotForm.isRecurring}
                onChange={(e) => setSlotForm(prev => ({ ...prev, isRecurring: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Créneau récurrent</span>
            </label>
          </div>
          
          {slotForm.isBlocked && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison du blocage
              </label>
              <input
                type="text"
                value={slotForm.blockReason}
                onChange={(e) => setSlotForm(prev => ({ ...prev, blockReason: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Maintenance, congés, etc."
              />
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleCreateSlot}>
              Créer le créneau
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal d'édition */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifier le créneau"
      >
        <div className="space-y-4">
          {/* Contenu similaire au modal de création */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleEditSlot}>
              Enregistrer les modifications
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EnhancedSchedulePage;
