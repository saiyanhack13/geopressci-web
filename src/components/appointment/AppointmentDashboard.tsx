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
  Eye,
  RefreshCw,
  Filter,
  Search,
  Plus,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';

import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { appointmentService, Appointment, AppointmentFilters } from '../../services/appointmentService';
import { timeslotService, TimeSlot } from '../../services/timeslotService';
import AppointmentBookingWorkflow from './AppointmentBookingWorkflow';

interface AppointmentDashboardProps {
  className?: string;
}

interface AppointmentStats {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
  totalSpent: number;
}

const AppointmentDashboard: React.FC<AppointmentDashboardProps> = ({ className }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<AppointmentStats>({
    total: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0,
    totalSpent: 0
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Modals
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // Formulaires
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedNewSlot, setSelectedNewSlot] = useState<TimeSlot | null>(null);
  
  // Filtres et recherche
  const [filters, setFilters] = useState<AppointmentFilters>({
    sortBy: 'appointmentDate',
    sortOrder: 'desc',
    limit: 20
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadAppointments();
    loadStats();
  }, [filters, statusFilter]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const filterParams: AppointmentFilters = {
        ...filters,
        ...(statusFilter !== 'all' && { status: statusFilter as any })
      };
      
      const response = await appointmentService.getAppointments(filterParams);
      let appointmentsList = response.appointments;
      
      // Filtrer par terme de recherche si nécessaire
      if (searchTerm) {
        appointmentsList = appointmentsList.filter(appointment => 
          appointment._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (typeof appointment.pressing === 'object' ? appointment.pressing.businessName : '').toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setAppointments(appointmentsList);
    } catch (error: any) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
      toast.error('Erreur lors du chargement des rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await appointmentService.getAppointmentStats();
      setStats({
        total: statsData.totalAppointments,
        upcoming: statsData.statusDistribution.pending + statsData.statusDistribution.confirmed,
        completed: statsData.statusDistribution.completed,
        cancelled: statsData.statusDistribution.cancelled + statsData.statusDistribution.no_show,
        totalSpent: statsData.totalRevenue
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment || !cancelReason.trim()) {
      toast.error('Veuillez indiquer la raison de l\'annulation');
      return;
    }

    setActionLoading('cancel');
    try {
      await appointmentService.cancelAppointment(selectedAppointment._id, {
        reason: cancelReason,
        refundRequested: true
      });
      
      toast.success('Rendez-vous annulé avec succès');
      setShowCancelModal(false);
      setCancelReason('');
      setSelectedAppointment(null);
      loadAppointments();
      loadStats();
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
        reason: rescheduleReason
      });
      
      toast.success('Rendez-vous reporté avec succès');
      setShowRescheduleModal(false);
      setRescheduleReason('');
      setSelectedNewSlot(null);
      setSelectedAppointment(null);
      loadAppointments();
    } catch (error: any) {
      console.error('Erreur lors du report:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du report');
    } finally {
      setActionLoading(null);
    }
  };

  const loadAvailableSlotsForReschedule = async (appointment: Appointment) => {
    try {
      const pressing = typeof appointment.pressing === 'object' ? appointment.pressing._id : appointment.pressing;
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const response = await timeslotService.getAvailableSlots(pressing, {
        startDate: timeslotService.formatDateForAPI(today),
        endDate: timeslotService.formatDateForAPI(nextWeek)
      });
      
      setAvailableSlots(response.slots.filter(slot => timeslotService.isSlotAvailable(slot)));
    } catch (error) {
      console.error('Erreur lors du chargement des créneaux:', error);
      toast.error('Erreur lors du chargement des créneaux disponibles');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      no_show: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      confirmed: <CheckCircle className="w-4 h-4" />,
      in_progress: <RefreshCw className="w-4 h-4" />,
      completed: <CheckCircle className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />,
      no_show: <AlertCircle className="w-4 h-4" />
    };
    return icons[status as keyof typeof icons] || icons.pending;
  };

  const canCancelAppointment = (appointment: Appointment) => {
    return appointmentService.canBeCancelled(appointment);
  };

  const canRescheduleAppointment = (appointment: Appointment) => {
    return appointmentService.canBeRescheduled(appointment);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête avec statistiques */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Mes rendez-vous</h1>
            <p className="text-gray-600 mt-1">Gérez vos rendez-vous de pressing</p>
          </div>
          <Button
            onClick={() => setShowBookingModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouveau rendez-vous
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total</p>
                <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">À venir</p>
                <p className="text-2xl font-bold text-yellow-800">{stats.upcoming}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Terminés</p>
                <p className="text-2xl font-bold text-green-800">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Annulés</p>
                <p className="text-2xl font-bold text-red-800">{stats.cancelled}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Dépensé</p>
                <p className="text-lg font-bold text-purple-800">
                  {stats.totalSpent.toLocaleString()} F
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un rendez-vous..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmés</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminés</option>
              <option value="cancelled">Annulés</option>
            </select>
          </div>
          
          <Button
            variant="outline"
            onClick={loadAppointments}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Liste des rendez-vous */}
      <div className="bg-white rounded-xl shadow-lg">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Chargement des rendez-vous...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun rendez-vous</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Aucun rendez-vous ne correspond à vos critères'
                : 'Vous n\'avez pas encore de rendez-vous'
              }
            </p>
            <Button onClick={() => setShowBookingModal(true)}>
              Prendre un rendez-vous
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {appointments.map((appointment) => {
              const pressing = typeof appointment.pressing === 'object' 
                ? appointment.pressing 
                : { businessName: 'Pressing', _id: appointment.pressing };
              const timeSlot = typeof appointment.timeSlot === 'object'
                ? appointment.timeSlot
                : null;

              return (
                <div key={appointment._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                          {getStatusIcon(appointment.status)}
                          {appointmentService.getStatusLabel(appointment.status)}
                        </span>
                        <span className="text-sm text-gray-500">
                          #{appointment._id}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {pressing.businessName}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(appointment.appointmentDate).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}
                        </div>
                        {timeSlot && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {timeSlot.startTime} - {timeSlot.endTime}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          {appointment.services.length} service(s)
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-blue-600">
                          {appointment.totalAmount.toLocaleString()} FCFA
                        </span>
                        {appointment.pickupAddress && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MapPin className="w-3 h-3" />
                            {appointment.pickupAddress.street.substring(0, 30)}...
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowDetailsModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {canRescheduleAppointment(appointment) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            loadAvailableSlotsForReschedule(appointment);
                            setShowRescheduleModal(true);
                          }}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {canCancelAppointment(appointment) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowCancelModal(true);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de réservation */}
      <Modal
        open={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title="Nouveau rendez-vous"
        className="max-w-2xl"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Pour prendre un nouveau rendez-vous, veuillez d'abord sélectionner un pressing et des services.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => setShowBookingModal(false)}>
              Fermer
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setShowBookingModal(false);
                window.location.href = '/client/search';
              }}
            >
              Rechercher un pressing
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal d'annulation */}
      <Modal
        open={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setCancelReason('');
          setSelectedAppointment(null);
        }}
        title="Annuler le rendez-vous"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Êtes-vous sûr de vouloir annuler ce rendez-vous ? Cette action ne peut pas être annulée.
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raison de l'annulation *
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Veuillez indiquer pourquoi vous annulez ce rendez-vous..."
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelModal(false);
                setCancelReason('');
                setSelectedAppointment(null);
              }}
            >
              Garder le rendez-vous
            </Button>
            <Button
              onClick={handleCancelAppointment}
              disabled={actionLoading === 'cancel' || !cancelReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading === 'cancel' ? 'Annulation...' : 'Annuler le rendez-vous'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de report */}
      <Modal
        open={showRescheduleModal}
        onClose={() => {
          setShowRescheduleModal(false);
          setRescheduleReason('');
          setSelectedNewSlot(null);
          setSelectedAppointment(null);
        }}
        title="Reporter le rendez-vous"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Sélectionnez un nouveau créneau pour reporter votre rendez-vous.
          </p>
          
          {availableSlots.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot._id}
                    variant={selectedNewSlot?._id === slot._id ? 'default' : 'outline'}
                    onClick={() => setSelectedNewSlot(slot)}
                    className="text-left p-3"
                  >
                    <div>
                      <div className="font-medium">
                        {new Date(slot.date).toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        })}
                      </div>
                      <div className="text-sm opacity-75">
                        {slot.startTime} - {slot.endTime}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison du report (optionnel)
                </label>
                <input
                  type="text"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Pourquoi reportez-vous ce rendez-vous ?"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun créneau disponible pour le moment</p>
            </div>
          )}
          
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowRescheduleModal(false);
                setRescheduleReason('');
                setSelectedNewSlot(null);
                setSelectedAppointment(null);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleRescheduleAppointment}
              disabled={actionLoading === 'reschedule' || !selectedNewSlot}
            >
              {actionLoading === 'reschedule' ? 'Report...' : 'Reporter le rendez-vous'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de détails */}
      <Modal
        open={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedAppointment(null);
        }}
        title="Détails du rendez-vous"
        className="max-w-2xl"
      >
        {selectedAppointment && (
          <div className="p-6">
            <div className="space-y-4">
              {/* Statut et numéro */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedAppointment.status)}`}>
                  {getStatusIcon(selectedAppointment.status)}
                  {appointmentService.getStatusLabel(selectedAppointment.status)}
                </span>
                <span className="text-sm text-gray-500">
                  #{selectedAppointment._id}
                </span>
              </div>
              
              {/* Pressing */}
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Pressing</h4>
                <p className="text-gray-600">
                  {typeof selectedAppointment.pressing === 'object' 
                    ? selectedAppointment.pressing.businessName 
                    : 'Pressing'
                  }
                </p>
              </div>
              
              {/* Date et heure */}
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Date et heure</h4>
                <p className="text-gray-600">
                  {appointmentService.formatAppointmentDateTime(selectedAppointment)}
                </p>
              </div>
              
              {/* Services */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Services</h4>
                <div className="space-y-2">
                  {selectedAppointment.services.map((service, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">
                        {typeof service.service === 'string' ? service.service : 'Service'} x{service.quantity}
                      </span>
                      <span className="font-medium text-gray-800">
                        {service.totalPrice.toLocaleString()} FCFA
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Adresses */}
              {selectedAppointment.pickupAddress && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">Adresse de collecte</h4>
                  <p className="text-gray-600">{selectedAppointment.pickupAddress.street}</p>
                </div>
              )}
              
              {selectedAppointment.deliveryAddress && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">Adresse de livraison</h4>
                  <p className="text-gray-600">{selectedAppointment.deliveryAddress.street}</p>
                </div>
              )}
              
              {/* Notes */}
              {selectedAppointment.notes && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">Instructions</h4>
                  <p className="text-gray-600">{selectedAppointment.notes}</p>
                </div>
              )}
              
              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Total</span>
                  <span className="text-xl font-bold text-blue-600">
                    {selectedAppointment.totalAmount.toLocaleString()} FCFA
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AppointmentDashboard;
