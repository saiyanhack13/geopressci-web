import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/types';
import { toast } from 'react-hot-toast';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CreditCard, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  Loader2,
  AlertCircle,
  User,
  Package
} from 'lucide-react';

import Button from '../ui/Button';
import BookingCalendar from '../order/BookingCalendar';
import { appointmentService, CreateAppointmentRequest, Appointment } from '../../services/appointmentService';
import { TimeSlot } from '../../services/timeslotService';

interface AppointmentBookingFlowProps {
  pressingId: string;
  selectedServices: Array<{
    _id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  onAppointmentCreated?: (appointment: Appointment) => void;
  onCancel?: () => void;
  className?: string;
}

interface BookingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

const AppointmentBookingFlow: React.FC<AppointmentBookingFlowProps> = ({
  pressingId,
  selectedServices,
  onAppointmentCreated,
  onCancel,
  className
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | undefined>();
  const [pickupAddress, setPickupAddress] = useState({
    street: '',
    city: 'Abidjan',
    coordinates: { latitude: 5.3364, longitude: -4.0267 }
  });
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: 'Abidjan',
    coordinates: { latitude: 5.3364, longitude: -4.0267 }
  });
  const [notes, setNotes] = useState('');
  const [sameAsPickup, setSameAsPickup] = useState(true);
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);

  const steps: BookingStep[] = [
    {
      id: 'datetime',
      title: 'Date et heure',
      description: 'Choisissez votre créneau',
      icon: <Calendar className="w-5 h-5" />,
      completed: !!selectedDateTime && !!selectedSlot
    },
    {
      id: 'address',
      title: 'Adresses',
      description: 'Collecte et livraison',
      icon: <MapPin className="w-5 h-5" />,
      completed: pickupAddress.street.length > 0
    },
    {
      id: 'review',
      title: 'Récapitulatif',
      description: 'Vérifiez vos informations',
      icon: <CheckCircle className="w-5 h-5" />,
      completed: false
    },
    {
      id: 'confirmation',
      title: 'Confirmation',
      description: 'Rendez-vous créé',
      icon: <CheckCircle className="w-5 h-5" />,
      completed: !!createdAppointment
    }
  ];

  const totalAmount = selectedServices.reduce((total, service) => 
    total + (service.price * service.quantity), 0
  );

  const handleDateTimeChange = (dateTime: Date | undefined, slot?: TimeSlot) => {
    setSelectedDateTime(dateTime);
    setSelectedSlot(slot);
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateAppointment = async () => {
    if (!selectedSlot || !user) {
      toast.error('Informations manquantes pour créer le rendez-vous');
      return;
    }

    setLoading(true);
    try {
      const appointmentData: CreateAppointmentRequest = {
        pressing: pressingId,
        timeSlot: selectedSlot._id,
        services: selectedServices.map(service => ({
          service: service._id,
          quantity: service.quantity
        })),
        notes: notes.trim() || undefined,
        pickupAddress: pickupAddress.street ? {
          street: pickupAddress.street,
          city: pickupAddress.city,
          coordinates: pickupAddress.coordinates
        } : undefined,
        deliveryAddress: !sameAsPickup && deliveryAddress.street ? {
          street: deliveryAddress.street,
          city: deliveryAddress.city,
          coordinates: deliveryAddress.coordinates
        } : undefined
      };

      const appointment = await appointmentService.createAppointment(appointmentData);
      setCreatedAppointment(appointment);
      setCurrentStep(3); // Aller à l'étape de confirmation
      
      toast.success('🎉 Rendez-vous créé avec succès !');
      onAppointmentCreated?.(appointment);
      
    } catch (error: any) {
      console.error('Erreur lors de la création du rendez-vous:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la création du rendez-vous';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0: // DateTime step
        return selectedDateTime && selectedSlot;
      case 1: // Address step
        return pickupAddress.street.length > 0;
      case 2: // Review step
        return true;
      default:
        return false;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className={`
            flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200
            ${index === currentStep 
              ? 'bg-blue-600 border-blue-600 text-white' 
              : step.completed 
                ? 'bg-green-600 border-green-600 text-white'
                : 'bg-gray-100 border-gray-300 text-gray-400'
            }
          `}>
            {step.completed && index !== currentStep ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              step.icon
            )}
          </div>
          <div className="ml-3 hidden sm:block">
            <p className={`text-sm font-medium ${
              index === currentStep ? 'text-blue-600' : 
              step.completed ? 'text-green-600' : 'text-gray-500'
            }`}>
              {step.title}
            </p>
            <p className="text-xs text-gray-400">{step.description}</p>
          </div>
          {index < steps.length - 1 && (
            <div className={`
              w-8 h-0.5 mx-4 transition-all duration-200
              ${step.completed ? 'bg-green-600' : 'bg-gray-300'}
            `} />
          )}
        </div>
      ))}
    </div>
  );

  const renderDateTimeStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Choisissez votre créneau
        </h2>
        <p className="text-gray-600">
          Sélectionnez la date et l'heure qui vous conviennent le mieux
        </p>
      </div>
      
      <BookingCalendar
        pressingId={pressingId}
        onDateTimeChange={handleDateTimeChange}
        onSlotSelect={setSelectedSlot}
        selectedServices={selectedServices.map(s => s._id)}
      />
    </div>
  );

  const renderAddressStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Adresses de collecte et livraison
        </h2>
        <p className="text-gray-600">
          Indiquez où nous devons récupérer et livrer vos vêtements
        </p>
      </div>

      {/* Adresse de collecte */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Adresse de collecte
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse complète *
            </label>
            <input
              type="text"
              value={pickupAddress.street}
              onChange={(e) => setPickupAddress(prev => ({ ...prev, street: e.target.value }))}
              placeholder="Ex: 123 Rue de la Paix, Cocody"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ville
            </label>
            <input
              type="text"
              value={pickupAddress.city}
              onChange={(e) => setPickupAddress(prev => ({ ...prev, city: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Adresse de livraison */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            Adresse de livraison
          </h3>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={sameAsPickup}
              onChange={(e) => setSameAsPickup(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Même adresse que la collecte</span>
          </label>
        </div>

        {!sameAsPickup && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse complète
              </label>
              <input
                type="text"
                value={deliveryAddress.street}
                onChange={(e) => setDeliveryAddress(prev => ({ ...prev, street: e.target.value }))}
                placeholder="Ex: 456 Avenue de la République, Plateau"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville
              </label>
              <input
                type="text"
                value={deliveryAddress.city}
                onChange={(e) => setDeliveryAddress(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Notes optionnelles */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Instructions spéciales (optionnel)
        </h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex: Sonnez 3 fois, appartement au 2ème étage, traitement délicat requis..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
          maxLength={500}
        />
        <p className="text-xs text-gray-500 mt-1">{notes.length}/500 caractères</p>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Récapitulatif de votre rendez-vous
        </h2>
        <p className="text-gray-600">
          Vérifiez toutes les informations avant de confirmer
        </p>
      </div>

      {/* Informations du rendez-vous */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Date et heure
        </h3>
        {selectedDateTime && selectedSlot && (
          <div className="space-y-2">
            <p className="text-gray-700">
              📅 {selectedDateTime.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
            <p className="text-gray-700">
              ⏰ {selectedSlot.startTime} - {selectedSlot.endTime}
            </p>
            <p className="text-sm text-gray-500">
              Type: {selectedSlot.slotType === 'regular' ? 'Standard' : 
                     selectedSlot.slotType === 'express' ? 'Express' : 
                     selectedSlot.slotType === 'premium' ? 'Premium' : 'En lot'}
            </p>
          </div>
        )}
      </div>

      {/* Services sélectionnés */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-green-600" />
          Services sélectionnés
        </h3>
        <div className="space-y-3">
          {selectedServices.map((service, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="font-medium text-gray-800">{service.name}</p>
                <p className="text-sm text-gray-500">Quantité: {service.quantity}</p>
              </div>
              <p className="font-semibold text-gray-800">
                {(service.price * service.quantity).toLocaleString()} FCFA
              </p>
            </div>
          ))}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <p className="text-lg font-bold text-gray-800">Total</p>
              <p className="text-xl font-bold text-blue-600">
                {totalAmount.toLocaleString()} FCFA
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Adresses */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-purple-600" />
          Adresses
        </h3>
        <div className="space-y-4">
          <div>
            <p className="font-medium text-gray-700 mb-1">📍 Collecte</p>
            <p className="text-gray-600">{pickupAddress.street}, {pickupAddress.city}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-1">🏠 Livraison</p>
            <p className="text-gray-600">
              {sameAsPickup ? 
                `${pickupAddress.street}, ${pickupAddress.city}` :
                `${deliveryAddress.street}, ${deliveryAddress.city}`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Instructions spéciales
          </h3>
          <p className="text-gray-700 italic">"{notes}"</p>
        </div>
      )}
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🎉 Rendez-vous confirmé !
        </h2>
        <p className="text-gray-600">
          Votre rendez-vous a été créé avec succès. Vous recevrez une confirmation par SMS et email.
        </p>
      </div>

      {createdAppointment && (
        <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-left">
          <h3 className="font-semibold text-green-800 mb-3">Détails du rendez-vous</h3>
          <div className="space-y-2 text-sm text-green-700">
            <p><strong>ID:</strong> {createdAppointment._id}</p>
            <p><strong>Statut:</strong> {appointmentService.getStatusLabel(createdAppointment.status)}</p>
            <p><strong>Date:</strong> {appointmentService.formatAppointmentDateTime(createdAppointment)}</p>
            <p><strong>Montant:</strong> {createdAppointment.totalAmount.toLocaleString()} FCFA</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          📱 Vous recevrez des rappels automatiques 24h, 2h et 30min avant votre rendez-vous
        </p>
        <p className="text-sm text-gray-600">
          🔄 Vous pouvez annuler ou reporter votre rendez-vous jusqu'à 2h avant l'heure prévue
        </p>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderDateTimeStep();
      case 1:
        return renderAddressStep();
      case 2:
        return renderReviewStep();
      case 3:
        return renderConfirmationStep();
      default:
        return null;
    }
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      {renderStepIndicator()}
      
      <div className="min-h-[600px]">
        {renderCurrentStep()}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        <div>
          {currentStep > 0 && currentStep < 3 && (
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Précédent
            </Button>
          )}
        </div>

        <div className="flex gap-3">
          {currentStep < 3 && (
            <Button
              variant="outline"
              onClick={onCancel}
            >
              Annuler
            </Button>
          )}
          
          {currentStep < 2 && (
            <Button
              onClick={handleNextStep}
              disabled={!canProceedToNext()}
              className="flex items-center gap-2"
            >
              Suivant
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
          
          {currentStep === 2 && (
            <Button
              onClick={handleCreateAppointment}
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Confirmer le rendez-vous
                </>
              )}
            </Button>
          )}
          
          {currentStep === 3 && (
            <Button
              onClick={() => window.location.href = '/client/appointments'}
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Voir mes rendez-vous
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentBookingFlow;
