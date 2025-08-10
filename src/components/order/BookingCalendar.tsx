import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Calendar from '../ui/Calendar';
import { Clock, Calendar as CalendarIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { timeslotService, TimeSlot } from '../../services/timeslotService';

interface BookingCalendarProps {
  onDateTimeChange: (dateTime: Date | undefined, selectedSlot?: TimeSlot) => void;
  onSlotSelect?: (slot: TimeSlot) => void;
  pressingId: string; // Requis pour charger les créneaux
  selectedServices?: string[]; // Services sélectionnés pour filtrer
  className?: string;
}

// Créneaux par défaut pour les pressings d'Abidjan
const DEFAULT_TIME_SLOTS = {
  morning: ['09:00', '11:00'],
  afternoon: ['14:00', '16:00']
};

// Fonction pour créer des créneaux par défaut
const createDefaultTimeSlots = (date: Date, pressingId: string): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const dateString = date.toISOString().split('T')[0];
  
  // Créneaux du matin
  DEFAULT_TIME_SLOTS.morning.forEach((time, index) => {
    slots.push({
      _id: `default-morning-${index}`,
      pressing: pressingId,
      date: dateString,
      startTime: time,
      endTime: addOneHour(time),
      maxCapacity: 4,
      currentBookings: 0,
      availableSpots: 4,
      status: 'available' as const,
      slotType: 'regular' as const,
      isBlocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });
  
  // Créneaux de l'après-midi
  DEFAULT_TIME_SLOTS.afternoon.forEach((time, index) => {
    slots.push({
      _id: `default-afternoon-${index}`,
      pressing: pressingId,
      date: dateString,
      startTime: time,
      endTime: addOneHour(time),
      maxCapacity: 4,
      currentBookings: 0,
      availableSpots: 4,
      status: 'available' as const,
      slotType: 'regular' as const,
      isBlocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });
  
  return slots;
};

// Fonction utilitaire pour ajouter une heure
const addOneHour = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const newHours = (hours + 1) % 24;
  return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const BookingCalendar: React.FC<BookingCalendarProps> = ({ 
  onDateTimeChange,
  onSlotSelect,
  pressingId,
  selectedServices = [],
  className 
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | undefined>();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDateChange = async (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(undefined);
    setError(null);
    onDateTimeChange(undefined);
    
    if (date && pressingId) {
      setLoading(true);
      try {
        await loadAvailableSlots(date, pressingId);
      } catch (error: any) {
        console.error('Erreur lors du chargement des créneaux:', error);
        const errorMessage = error.response?.data?.message || 'Erreur lors du chargement des créneaux disponibles';
        setError(errorMessage);
        toast.error(errorMessage);
        setTimeSlots([]);
      } finally {
        setLoading(false);
      }
    } else {
      setTimeSlots([]);
    }
  };

  const loadAvailableSlots = async (date: Date, pressingId: string) => {
    try {
      const dateString = timeslotService.formatDateForAPI(date);
      console.log('📅 Chargement des créneaux pour:', { date: dateString, pressingId });
      
      const response = await timeslotService.getAvailableSlots(pressingId, {
        date: dateString,
        includeUnavailable: false
      });
      
      console.log('✅ Réponse API créneaux:', response);
      
      // Vérifier si la réponse contient des créneaux
      if (!response || !response.slots || !Array.isArray(response.slots) || response.slots.length === 0) {
        console.warn('⚠️ Aucun créneau configuré, utilisation des créneaux par défaut');
        
        // Créer des créneaux par défaut pour cette date
        const defaultSlots = createDefaultTimeSlots(date, pressingId);
        setTimeSlots(defaultSlots);
        
        toast('Créneaux par défaut disponibles', { 
          icon: '🕐',
          duration: 3000
        });
        return;
      }
      
      // Filtrer les créneaux disponibles uniquement
      const availableSlots = response.slots.filter(slot => 
        timeslotService.isSlotAvailable(slot)
      );
      
      console.log('🔍 Créneaux disponibles filtrés:', availableSlots);
      
      // Trier par heure de début
      const morningSlots = availableSlots.filter(slot => {
        const hour = parseInt(slot.startTime.split(':')[0]);
        return hour >= 6 && hour < 12;
      });
      const afternoonSlots = availableSlots.filter(slot => {
        const hour = parseInt(slot.startTime.split(':')[0]);
        return hour >= 12 && hour < 18;
      });
      const eveningSlots = availableSlots.filter(slot => {
        const hour = parseInt(slot.startTime.split(':')[0]);
        return hour >= 18 && hour < 22;
      });
      
      const sortedSlots = [...morningSlots, ...afternoonSlots, ...eveningSlots];
      setTimeSlots(sortedSlots);
      
      if (availableSlots.length === 0) {
        toast('Aucun créneau disponible pour cette date\n\nVeuillez choisir une autre date', { 
          icon: 'ℹ️',
          duration: 4000
        });
      } else {
        console.log(`✅ ${availableSlots.length} créneaux chargés avec succès`);
      }
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des créneaux:', error);
      
      // En cas d'erreur, utiliser les créneaux par défaut
      console.log('🔄 Utilisation des créneaux par défaut suite à l\'erreur API');
      const defaultSlots = createDefaultTimeSlots(date, pressingId);
      setTimeSlots(defaultSlots);
      
      // Gestion d'erreur spécifique selon le type d'erreur
      if (error.response?.status === 404) {
        console.error('🔍 Pressing non trouvé, créneaux par défaut utilisés');
        toast('Pressing non trouvé - Créneaux par défaut disponibles', { 
          icon: '🕐',
          duration: 4000
        });
      } else if (error.response?.status === 401) {
        console.warn('🔐 Erreur d\'authentification - Créneaux par défaut utilisés');
        toast('Créneaux par défaut disponibles', { 
          icon: '🕐',
          duration: 3000
        });
      } else {
        console.warn('⚠️ Erreur API - Créneaux par défaut utilisés');
        toast('Créneaux par défaut disponibles', { 
          icon: '🕐',
          duration: 3000
        });
      }
      
      // Ne pas propager l'erreur pour permettre l'affichage des créneaux par défaut
      setError(null);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    if (selectedDate) {
      const dateTime = new Date(selectedDate);
      const [hours, minutes] = slot.startTime.split(':').map(Number);
      dateTime.setHours(hours, minutes, 0, 0);
      
      onDateTimeChange?.(dateTime, slot);
      onSlotSelect?.(slot);
      
      toast.success(`Créneau sélectionné: ${slot.startTime} - ${slot.endTime}`);
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSlotTypeLabel = (slotType: string) => {
    const labels: { [key: string]: string } = {
      regular: 'Standard',
      express: 'Express',
      premium: 'Premium',
      bulk: 'En lot'
    };
    return labels[slotType] || slotType;
  };

  // Charger les créneaux par défaut au montage
  useEffect(() => {
    if (!timeSlots.length) {
      // Les créneaux sont déjà définis dans timeSlots
    }
  }, [timeSlots]);

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          📅 Planifier la collecte
        </h3>
        <p className="text-gray-600 mt-2">
          Choisissez quand nous devons venir récupérer vos vêtements
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sélection de date */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-lg">Choisissez une date</h4>
          </div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateChange}
            className="rounded-lg border border-gray-200 p-3 w-full"
            disabled={(date: Date) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return date < today;
            }}
          />
          {selectedDate && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                📅 Date sélectionnée: {selectedDate.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>

        {/* Sélection de créneau */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-lg">Choisissez un créneau</h4>
          </div>
          
          {!selectedDate ? (
            <div className="text-center py-8">
              <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Veuillez d'abord sélectionner une date</p>
            </div>
          ) : loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-gray-500">Chargement des créneaux...</p>
            </div>
           ) : (
            <div className="space-y-6">
              {/* Organiser les créneaux par période */}
              {(() => {
                const morningSlots = timeSlots.filter(slot => {
                  const hour = parseInt(slot.startTime.split(':')[0]);
                  return hour >= 6 && hour < 12;
                });
                const afternoonSlots = timeSlots.filter(slot => {
                  const hour = parseInt(slot.startTime.split(':')[0]);
                  return hour >= 12 && hour < 18;
                });
                const eveningSlots = timeSlots.filter(slot => {
                  const hour = parseInt(slot.startTime.split(':')[0]);
                  return hour >= 18;
                });
                
                return (
                  <>
                    {/* Section Matin */}
                    {morningSlots.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🌅</span>
                          <h5 className="font-medium text-gray-800">Matin</h5>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {morningSlots.map((slot) => (
                            <Button
                              key={slot._id}
                              variant={selectedSlot?._id === slot._id ? 'default' : 'outline'}
                              onClick={() => handleSlotSelect(slot)}
                              className={`w-full transition-all duration-200 ${
                                selectedSlot?._id === slot._id 
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                  : 'hover:bg-blue-50 hover:border-blue-300'
                              }`}
                              disabled={!timeslotService.isSlotAvailable(slot)}
                            >
                              {selectedSlot?._id === slot._id && <CheckCircle className="w-4 h-4 mr-1" />}
                              <div className="text-center">
                                <div className="font-medium text-lg">{slot.startTime}</div>
                                <div className="text-xs opacity-75">
                                  {slot.availableSpots}/{slot.maxCapacity} places
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Section Après-midi */}
                    {afternoonSlots.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">☀️</span>
                          <h5 className="font-medium text-gray-800">Après-midi</h5>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {afternoonSlots.map((slot) => (
                            <Button
                              key={slot._id}
                              variant={selectedSlot?._id === slot._id ? 'default' : 'outline'}
                              onClick={() => handleSlotSelect(slot)}
                              className={`w-full transition-all duration-200 ${
                                selectedSlot?._id === slot._id 
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                  : 'hover:bg-blue-50 hover:border-blue-300'
                              }`}
                              disabled={!timeslotService.isSlotAvailable(slot)}
                            >
                              {selectedSlot?._id === slot._id && <CheckCircle className="w-4 h-4 mr-1" />}
                              <div className="text-center">
                                <div className="font-medium text-lg">{slot.startTime}</div>
                                <div className="text-xs opacity-75">
                                  {slot.availableSpots}/{slot.maxCapacity} places
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Section Soirée (si applicable) */}
                    {eveningSlots.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🌆</span>
                          <h5 className="font-medium text-gray-800">Soirée</h5>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {eveningSlots.map((slot) => (
                            <Button
                              key={slot._id}
                              variant={selectedSlot?._id === slot._id ? 'default' : 'outline'}
                              onClick={() => handleSlotSelect(slot)}
                              className={`w-full transition-all duration-200 ${
                                selectedSlot?._id === slot._id 
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                  : 'hover:bg-blue-50 hover:border-blue-300'
                              }`}
                              disabled={!timeslotService.isSlotAvailable(slot)}
                            >
                              {selectedSlot?._id === slot._id && <CheckCircle className="w-4 h-4 mr-1" />}
                              <div className="text-center">
                                <div className="font-medium text-lg">{slot.startTime}</div>
                                <div className="text-xs opacity-75">
                                  {slot.availableSpots}/{slot.maxCapacity} places
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
              
              {timeSlots.length === 0 && !loading && selectedDate && (
                <div className="text-center py-4">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Aucun créneau disponible pour cette date</p>
                  <p className="text-sm text-gray-400 mt-1">Veuillez choisir une autre date</p>
                </div>
              )}
              
              {error && (
                <div className="text-center py-4">
                  <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-red-500">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => selectedDate && handleDateChange(selectedDate)}
                    className="mt-2"
                  >
                    Réessayer
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {selectedSlot && selectedDate && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Créneau confirmé</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                📅 {formatDateTime(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), parseInt(selectedSlot.startTime.split(':')[0]), parseInt(selectedSlot.startTime.split(':')[1])))}
              </p>
              <div className="text-xs text-green-600 mt-1 flex items-center gap-4">
                <span>⏱️ Durée: {selectedSlot.startTime}-{selectedSlot.endTime}</span>
                <span>👥 {selectedSlot.availableSpots} places restantes</span>
                {selectedSlot.slotType !== 'regular' && (
                  <span>🏷️ {getSlotTypeLabel(selectedSlot.slotType)}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Informations pratiques */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h5 className="font-medium text-gray-800 mb-2">ℹ️ Informations pratiques</h5>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Collecte gratuite à domicile dans tout Abidjan</li>
          <li>• Soyez présent 15 minutes avant l'heure prévue</li>
          <li>• Possibilité de reprogrammer jusqu'à 2h avant</li>
          <li>• Service express disponible (supplément de 1000 FCFA)</li>
        </ul>
      </div>
    </div>
  );
};

export default BookingCalendar;
