import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Edit, Trash2, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { timeslotService, TimeSlot } from '../../services/timeslotService';

interface TimeslotListProps {
  pressingId: string;
  selectedDate?: Date;
  onTimeslotUpdated?: () => void;
}

const TimeslotList: React.FC<TimeslotListProps> = ({
  pressingId,
  selectedDate,
  onTimeslotUpdated
}) => {
  const [timeslots, setTimeslots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTimeslots = async () => {
    if (!pressingId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Chargement des créneaux pour pressing:', pressingId);
      
      const filters: any = {
        includeUnavailable: true // Inclure tous les créneaux pour la gestion
      };
      
      if (selectedDate) {
        filters.date = timeslotService.formatDateForAPI(selectedDate);
      }
      
      const response = await timeslotService.getAvailableSlots(pressingId, filters);
      
      console.log('✅ Créneaux chargés:', response);
      setTimeslots(response.slots || []);
      
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des créneaux:', error);
      setError('Erreur lors du chargement des créneaux');
      setTimeslots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeslots();
  }, [pressingId, selectedDate]);

  const handleToggleSlot = async (slotId: string, currentStatus: string) => {
    try {
      console.log('🔄 Basculement du statut du créneau:', slotId, currentStatus);
      
      const isCurrentlyBlocked = currentStatus === 'blocked';
      await timeslotService.toggleBlockTimeSlot(slotId, !isCurrentlyBlocked, !isCurrentlyBlocked ? 'Bloqué manuellement' : undefined);
      
      toast.success('Statut du créneau mis à jour');
      await loadTimeslots(); // Recharger la liste
      
      if (onTimeslotUpdated) {
        onTimeslotUpdated();
      }
      
    } catch (error: any) {
      console.error('❌ Erreur lors du basculement:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce créneau ?')) {
      return;
    }
    
    try {
      console.log('🗑️ Suppression du créneau:', slotId);
      
      await timeslotService.deleteTimeSlot(slotId);
      
      toast.success('Créneau supprimé avec succès');
      await loadTimeslots(); // Recharger la liste
      
      if (onTimeslotUpdated) {
        onTimeslotUpdated();
      }
      
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression du créneau');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'full':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'full':
        return 'Complet';
      case 'blocked':
        return 'Bloqué';
      case 'closed':
        return 'Fermé';
      default:
        return status;
    }
  };

  const getSlotTypeText = (type: string) => {
    switch (type) {
      case 'regular':
        return 'Standard';
      case 'express':
        return 'Express';
      case 'premium':
        return 'Premium';
      case 'bulk':
        return 'Groupe';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-3 text-gray-600">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Chargement des créneaux...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">❌ {error}</div>
        <button
          onClick={loadTimeslots}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (timeslots.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Aucun créneau configuré
        </h3>
        <p className="text-gray-600 mb-4">
          {selectedDate 
            ? `Aucun créneau pour le ${selectedDate.toLocaleDateString('fr-FR')}`
            : 'Commencez par créer des créneaux pour votre planning'
          }
        </p>
        <button
          onClick={loadTimeslots}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Actualiser
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Créneaux configurés ({timeslots.length})
        </h3>
        <button
          onClick={loadTimeslots}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          title="Actualiser"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid gap-4">
        {timeslots.map((slot) => (
          <div
            key={slot._id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-900">
                    {slot.startTime} - {slot.endTime}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {slot.currentBookings || 0}/{slot.maxCapacity}
                  </span>
                </div>
                
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(slot.status)}`}>
                  {getStatusText(slot.status)}
                </span>
                
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {getSlotTypeText(slot.slotType)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleSlot(slot._id, slot.status)}
                  className={`p-2 rounded-lg transition-colors ${
                    slot.status === 'blocked' 
                      ? 'text-red-600 hover:bg-red-50' 
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                  title={slot.status === 'blocked' ? 'Débloquer' : 'Bloquer'}
                >
                  {slot.status === 'blocked' ? (
                    <ToggleLeft className="w-5 h-5" />
                  ) : (
                    <ToggleRight className="w-5 h-5" />
                  )}
                </button>
                
                <button
                  onClick={() => handleDeleteSlot(slot._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {new Date(slot.date).toLocaleDateString('fr-FR')}
                </span>
                
                {slot.specialPrice && (
                  <span className="text-green-600 font-medium">
                    Prix spécial: {slot.specialPrice} FCFA
                  </span>
                )}
                
                {slot.discount && (
                  <span className="text-orange-600 font-medium">
                    Remise: {slot.discount}%
                  </span>
                )}
              </div>
              
              {slot.blockReason && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <strong>Raison du blocage:</strong> {slot.blockReason}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimeslotList;
