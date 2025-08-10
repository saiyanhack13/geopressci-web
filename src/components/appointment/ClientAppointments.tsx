import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/types';
import { toast } from 'react-hot-toast';
import {
  Calendar,
  Clock,
  MapPin,
  Package,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit3,
  Trash2,
  Loader2,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';

import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { appointmentService, Appointment, AppointmentFilters } from '../../services/appointmentService';
import { timeslotService, TimeSlot } from '../../services/timeslotService';

interface ClientAppointmentsProps {
  className?: string;
}

const ClientAppointments: React.FC<ClientAppointmentsProps> = ({ className }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedNewSlot, setSelectedNewSlot] = useState<TimeSlot | null>(null);
  const [filters, setFilters] = useState<AppointmentFilters>({
    sortBy: 'appointmentDate',
    sortOrder: 'asc',
    limit: 20
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user, filters]);

  const loadAppointments = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const clientFilters: AppointmentFilters = {
        ...filters,
        client: user._id
      };
      
      const response = await appointmentService.getAppointments(clientFilters);
      setAppointments(response.appointments);
    } catch (error: any) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
      toast.error('Erreur lors du chargement des rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment || !cancelReason.trim()) {
      toast.error('Veuillez indiquer une raison pour l\'annulation');
      return;
    }

    setActionLoading('cancel');
    try {
      await appointmentService.cancelAppointment(selectedAppointment._id, {
        reason: cancelReason.trim(),
        refundRequested: true
      });
      
      toast.success('Rendez-vous annulé avec succès');
      setShowCancelModal(false);
      setCancelReason('');
      setSelectedAppointment(null);
      loadAppointments();
    } catch (error: any) {
      console.error('Erreur lors de l\'annulation:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'annulation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRescheduleAppointment = async () => {
    if (!selectedAppointment || !selectedNewSlot) {
      toast.error('Veuillez sélectionner un nouveau créneau');
      return;
    }

    setActionLoading('reschedule');
    try {
      await appointmentService.rescheduleAppointment(selectedAppointment._id, {
        newTimeSlot: selectedNewSlot._id,
        reason: rescheduleReason.trim() || 'Changement de planning'
      });
      
      toast.success('Rendez-vous reporté avec succès');
      setShowRescheduleModal(false);
      setRescheduleReason('');
      setSelectedAppointment(null);
      setSelectedNewSlot(null);
      loadAppointments();
    } catch (error: any) {
      console.error('Erreur lors du report:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du report');
    } finally {
      setActionLoading(null);
    }
  };

  const loadAvailableSlotsForReschedule = async (appointment: Appointment) => {
    if (typeof appointment.pressing === 'string') return;
    
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const response = await timeslotService.getAvailableSlots(appointment.pressing._id, {
        startDate: timeslotService.formatDateForAPI(tomorrow),
        endDate: timeslotService.formatDateForAPI(nextWeek),
        includeUnavailable: false
      });
      
      const availableSlots = response.slots.filter(slot => 
        timeslotService.isSlotAvailable(slot)
      );
      
      setAvailableSlots(availableSlots);
    } catch (error) {
      console.error('Erreur lors du chargement des créneaux:', error);
      toast.error('Erreur lors du chargement des créneaux disponibles');
    }
  };

  const openCancelModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const openRescheduleModal = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    await loadAvailableSlotsForReschedule(appointment);
    setShowRescheduleModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'no_show':
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors = appointmentService.getStatusColor(status);
    return `bg-${colors}-100 text-${colors}-800 border-${colors}-200`;
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const pressingName = typeof appointment.pressing === 'object' 
      ? appointment.pressing.businessName.toLowerCase()
      : '';
    const status = appointmentService.getStatusLabel(appointment.status).toLowerCase();
    
    return pressingName.includes(searchLower) || 
           status.includes(searchLower) ||
           appointment.notes?.toLowerCase().includes(searchLower);
  });

  const upcomingAppointments = filteredAppointments.filter(apt => 
    new Date(apt.appointmentDate) > new Date() && 
    apt.status !== 'cancelled' && 
    apt.status !== 'completed'
  );

  const pastAppointments = filteredAppointments.filter(apt => 
    new Date(apt.appointmentDate) <= new Date() || 
    apt.status === 'cancelled' || 
    apt.status === 'completed'
  );

  const renderAppointmentCard = (appointment: Appointment) => {
    const canCancel = appointmentService.canBeCancelled(appointment);
    const canReschedule = appointmentService.canBeRescheduled(appointment);
    const timeUntil = appointmentService.getTimeUntilAppointment(appointment);
    
    return (
      <div key={appointment._id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {getStatusIcon(appointment.status)}
            <div>
              <h3 className="font-semibold text-gray-800">
                {typeof appointment.pressing === 'object' 
                  ? appointment.pressing.businessName 
                  : 'Pressing'}
              </h3>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                {appointmentService.getStatusLabel(appointment.status)}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-lg font-bold text-blue-600">
              {appointment.totalAmount.toLocaleString()} FCFA
            </p>
            {timeUntil.totalMinutes > 0 && appointment.status !== 'completed' && (
              <p className="text-sm text-gray-500">
                Dans {timeUntil.days > 0 ? `${timeUntil.days}j ` : ''}
                {timeUntil.hours > 0 ? `${timeUntil.hours}h ` : ''}
                {timeUntil.minutes}min
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{appointmentService.formatAppointmentDateTime(appointment)}</span>
          </div>
          
          {appointment.pickupAddress && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{appointment.pickupAddress.street}, {appointment.pickupAddress.city}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-gray-600">
            <Package className="w-4 h-4" />
            <span>{appointment.services.length} service(s) commandé(s)</span>
          </div>
          
          {appointment.notes && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700 italic">"{appointment.notes}"</p>
            </div>
          )}
        </div>

        {(canCancel || canReschedule) && (
          <div className="flex gap-2 pt-4 border-t border-gray-100">
            {canReschedule && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openRescheduleModal(appointment)}
                className="flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Reporter
              </Button>
            )}
            
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openCancelModal(appointment)}
                className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Annuler
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Chargement de vos rendez-vous...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mes rendez-vous</h1>
          <p className="text-gray-600">Gérez vos rendez-vous de pressing</p>
        </div>
        
        <Button
          onClick={loadAppointments}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </Button>
      </div>

      {/* Search and filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par pressing, statut ou notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <select
          value={filters.status || ''}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any || undefined }))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmé</option>
          <option value="in_progress">En cours</option>
          <option value="completed">Terminé</option>
          <option value="cancelled">Annulé</option>
        </select>
      </div>

      {/* Upcoming appointments */}
      {upcomingAppointments.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Rendez-vous à venir ({upcomingAppointments.length})
          </h2>
          <div className="grid gap-4">
            {upcomingAppointments.map(renderAppointmentCard)}
          </div>
        </div>
      )}

      {/* Past appointments */}
      {pastAppointments.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-600" />
            Historique ({pastAppointments.length})
          </h2>
          <div className="grid gap-4">
            {pastAppointments.map(renderAppointmentCard)}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredAppointments.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            Aucun rendez-vous trouvé
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filters.status 
              ? 'Aucun rendez-vous ne correspond à vos critères de recherche'
              : 'Vous n\'avez pas encore de rendez-vous programmé'
            }
          </p>
          <Button onClick={() => window.location.href = '/search'}>
            Trouver un pressing
          </Button>
        </div>
      )}

      {/* Cancel Modal */}
      <Modal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Annuler le rendez-vous"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 text-yellow-800 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Attention</span>
            </div>
            <p className="text-yellow-700 text-sm">
              L'annulation de ce rendez-vous est définitive. Un remboursement pourra être effectué selon les conditions du pressing.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raison de l'annulation *
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ex: Empêchement de dernière minute, changement de programme..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
            >
              Garder le rendez-vous
            </Button>
            <Button
              onClick={handleCancelAppointment}
              disabled={!cancelReason.trim() || actionLoading === 'cancel'}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading === 'cancel' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Annulation...
                </>
              ) : (
                'Confirmer l\'annulation'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        open={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        title="Reporter le rendez-vous"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-blue-700 text-sm">
              Sélectionnez un nouveau créneau pour reporter votre rendez-vous. Les créneaux disponibles pour les 7 prochains jours sont affichés ci-dessous.
            </p>
          </div>

          {availableSlots.length > 0 ? (
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Créneaux disponibles</h3>
              <div className="grid gap-2 max-h-64 overflow-y-auto">
                {availableSlots.map((slot) => (
                  <button
                    key={slot._id}
                    onClick={() => setSelectedNewSlot(slot)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedNewSlot?._id === slot._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          {new Date(slot.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}
                        </p>
                        <p className="text-sm text-gray-600">
                          {slot.startTime} - {slot.endTime}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {slot.availableSpots}/{slot.maxCapacity} places
                        </p>
                        {slot.slotType !== 'regular' && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {slot.slotType}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun créneau disponible pour les 7 prochains jours</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raison du report (optionnel)
            </label>
            <input
              type="text"
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              placeholder="Ex: Conflit d'horaire, changement de planning..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowRescheduleModal(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleRescheduleAppointment}
              disabled={!selectedNewSlot || actionLoading === 'reschedule'}
            >
              {actionLoading === 'reschedule' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Report...
                </>
              ) : (
                'Confirmer le report'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClientAppointments;
