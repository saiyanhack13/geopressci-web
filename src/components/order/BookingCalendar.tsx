import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Calendar from '../ui/Calendar';
import { Clock, Calendar as CalendarIcon, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BookingCalendarProps {
  onDateTimeChange: (dateTime: Date | undefined) => void;
  availableTimeSlots?: string[]; // ex: ['09:00', '11:00', '14:00']
  pressingId?: string;
  className?: string;
}

// Créneaux par défaut pour les pressings d'Abidjan
const DEFAULT_TIME_SLOTS = {
  morning: ['08:00', '09:00', '10:00', '11:00'],
  afternoon: ['14:00', '15:00', '16:00', '17:00'],
  evening: ['18:00', '19:00']
};

const BookingCalendar: React.FC<BookingCalendarProps> = ({ 
  onDateTimeChange, 
  availableTimeSlots,
  pressingId,
  className 
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleDateChange = async (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(undefined);
    onDateTimeChange(undefined);
    
    if (date && pressingId) {
      setLoading(true);
      try {
        // Simuler un appel API pour récupérer les créneaux disponibles
        await loadAvailableSlots(date, pressingId);
      } catch (error) {
        console.error('Erreur lors du chargement des créneaux:', error);
        toast.error('Erreur lors du chargement des créneaux disponibles');
      } finally {
        setLoading(false);
      }
    }
  };

  const loadAvailableSlots = async (date: Date, pressingId: string) => {
    // Simulation d'appel API - à remplacer par l'API réelle
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    let slots: string[] = [];
    if (isWeekend) {
      // Horaires réduits le weekend
      slots = ['09:00', '10:00', '14:00', '15:00'];
    } else {
      // Horaires complets en semaine
      slots = [
        ...DEFAULT_TIME_SLOTS.morning,
        ...DEFAULT_TIME_SLOTS.afternoon,
        ...DEFAULT_TIME_SLOTS.evening
      ];
    }
    
    // Simuler quelques créneaux déjà pris
    const unavailableSlots = ['10:00', '15:00'];
    const availableSlots = slots.filter(slot => !unavailableSlots.includes(slot));
    
    setTimeSlots(availableSlots);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (selectedDate) {
      const [hours, minutes] = time.split(':').map(Number);
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(hours, minutes, 0, 0);
      onDateTimeChange(newDateTime);
      toast.success(`📅 Créneau sélectionné: ${formatDateTime(newDateTime)}`);
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

  const getTimeSlotCategory = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return 'Matin';
    if (hour < 18) return 'Après-midi';
    return 'Soir';
  };

  const groupedTimeSlots = () => {
    const slots = availableTimeSlots || timeSlots;
    const grouped: { [key: string]: string[] } = {};
    
    slots.forEach(slot => {
      const category = getTimeSlotCategory(slot);
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(slot);
    });
    
    return grouped;
  };

  // Charger les créneaux par défaut au montage
  useEffect(() => {
    if (!availableTimeSlots) {
      setTimeSlots([
        ...DEFAULT_TIME_SLOTS.morning,
        ...DEFAULT_TIME_SLOTS.afternoon
      ]);
    }
  }, [availableTimeSlots]);

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
            <div className="space-y-4">
              {Object.entries(groupedTimeSlots()).map(([category, slots]) => (
                <div key={category}>
                  <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                    {category === 'Matin' && '🌅'}
                    {category === 'Après-midi' && '☀️'}
                    {category === 'Soir' && '🌆'}
                    {category}
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    {slots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? 'default' : 'outline'}
                        onClick={() => handleTimeSelect(time)}
                        className={`w-full transition-all duration-200 ${
                          selectedTime === time 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                            : 'hover:bg-blue-50 hover:border-blue-300'
                        }`}
                      >
                        {selectedTime === time && <CheckCircle className="w-4 h-4 mr-1" />}
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
              
              {(availableTimeSlots || timeSlots).length === 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-500">Aucun créneau disponible pour cette date</p>
                  <p className="text-sm text-gray-400 mt-1">Veuillez choisir une autre date</p>
                </div>
              )}
            </div>
          )}
          
          {selectedTime && selectedDate && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Créneau confirmé</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                📅 {formatDateTime(new Date(selectedDate.getTime() + parseInt(selectedTime.split(':')[0]) * 3600000 + parseInt(selectedTime.split(':')[1]) * 60000))}
              </p>
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
