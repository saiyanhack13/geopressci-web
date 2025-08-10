import React, { useState } from 'react';
import { Calendar, Clock, Users, Plus, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { timeslotService, TimeSlot } from '../../services/timeslotService';

interface TimeslotCreatorProps {
  pressingId: string;
  onTimeslotCreated?: (timeslot: TimeSlot) => void;
  onClose?: () => void;
  selectedDate?: Date;
}

const TimeslotCreator: React.FC<TimeslotCreatorProps> = ({
  pressingId,
  onTimeslotCreated,
  onClose,
  selectedDate
}) => {
  const [formData, setFormData] = useState({
    date: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    maxCapacity: 4,
    slotType: 'regular' as 'regular' | 'express' | 'premium' | 'bulk',
    specialPrice: '',
    discount: '',
    availableServices: [] as string[],
    isRecurring: false,
    recurringFrequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    recurringEndDate: ''
  });

  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      console.log('🔄 Création du créneau:', formData);

      const slotData = {
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        maxCapacity: formData.maxCapacity,
        slotType: formData.slotType,
        ...(formData.specialPrice && { specialPrice: parseFloat(formData.specialPrice) }),
        ...(formData.discount && { discount: parseFloat(formData.discount) }),
        ...(formData.availableServices.length > 0 && { availableServices: formData.availableServices }),
        ...(formData.isRecurring && {
          recurrence: {
            isRecurring: true,
            frequency: formData.recurringFrequency,
            endDate: formData.recurringEndDate
          }
        })
      };

      const newTimeslot = await timeslotService.createTimeSlot(pressingId, slotData);
      
      console.log('✅ Créneau créé avec succès:', newTimeslot);
      toast.success(`Créneau créé avec succès pour ${formData.date} à ${formData.startTime}`);
      
      if (onTimeslotCreated) {
        onTimeslotCreated(newTimeslot);
      }
      
      if (onClose) {
        onClose();
      }
      
      // Réinitialiser le formulaire
      setFormData({
        ...formData,
        startTime: '09:00',
        endTime: '10:00',
        maxCapacity: 4,
        specialPrice: '',
        discount: ''
      });

    } catch (error: any) {
      console.error('❌ Erreur lors de la création du créneau:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la création du créneau';
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const timeOptions = [];
  for (let hour = 6; hour < 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(time);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Créer un nouveau créneau
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date et heures */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Heure de début
              </label>
              <select
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Heure de fin
              </label>
              <select
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Capacité et type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Capacité maximale
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.maxCapacity}
                onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de créneau
              </label>
              <select
                value={formData.slotType}
                onChange={(e) => setFormData({ ...formData, slotType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="regular">Standard</option>
                <option value="express">Express</option>
                <option value="premium">Premium</option>
                <option value="bulk">Groupe</option>
              </select>
            </div>
          </div>

          {/* Prix spécial et remise */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix spécial (optionnel)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.specialPrice}
                onChange={(e) => setFormData({ ...formData, specialPrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Prix en FCFA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remise % (optionnel)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Pourcentage de remise"
              />
            </div>
          </div>

          {/* Récurrence */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
                Créneau récurrent
              </label>
            </div>

            {formData.isRecurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fréquence
                  </label>
                  <select
                    value={formData.recurringFrequency}
                    onChange={(e) => setFormData({ ...formData, recurringFrequency: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="daily">Quotidien</option>
                    <option value="weekly">Hebdomadaire</option>
                    <option value="monthly">Mensuel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={formData.recurringEndDate}
                    onChange={(e) => setFormData({ ...formData, recurringEndDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={formData.date}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Annuler
              </button>
            )}
            <button
              type="submit"
              disabled={isCreating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Création...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Créer le créneau
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimeslotCreator;
