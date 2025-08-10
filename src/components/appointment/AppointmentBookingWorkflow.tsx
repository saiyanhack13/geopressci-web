import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store/types';
import { toast } from 'react-hot-toast';
import {
  Calendar,
  Clock,
  MapPin,
  Package,
  CreditCard,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  User,
  Phone,
  Mail,
  AlertCircle,
  Loader2
} from 'lucide-react';

import Button from '../ui/Button';
import Modal from '../ui/Modal';
import BookingCalendar from '../order/BookingCalendar';
import { appointmentService, CreateAppointmentRequest } from '../../services/appointmentService';
import { timeslotService, TimeSlot } from '../../services/timeslotService';

interface AppointmentBookingWorkflowProps {
  pressingId: string;
  selectedServices: Array<{
    serviceId: string;
    serviceName: string;
    price: number;
    quantity: number;
  }>;
  onBookingComplete?: (appointmentId: string) => void;
  onCancel?: () => void;
  className?: string;
}

interface BookingStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

interface Address {
  street: string;
  city: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

const AppointmentBookingWorkflow: React.FC<AppointmentBookingWorkflowProps> = ({
  pressingId,
  selectedServices,
  onBookingComplete,
  onCancel,
  className
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  // États du workflow
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  
  // Adresses
  const [pickupAddress, setPickupAddress] = useState<Address>({
    street: '',
    city: 'Abidjan',
    coordinates: { latitude: 5.316667, longitude: -4.033333 }
  });
  const [deliveryAddress, setDeliveryAddress] = useState<Address>({
    street: '',
    city: 'Abidjan',
    coordinates: { latitude: 5.316667, longitude: -4.033333 }
  });
  const [sameAddress, setSameAddress] = useState(true);
  
  // Notes et instructions
  const [notes, setNotes] = useState('');
  
  // Calculs
  const totalAmount = selectedServices.reduce((sum, service) => 
    sum + (service.price * service.quantity), 0
  );

  const steps: BookingStep[] = [
    {
      id: 1,
      title: 'Date et heure',
      description: 'Choisissez quand nous devons venir',
      completed: !!selectedSlot && !!selectedDate
    },
    {
      id: 2,
      title: 'Adresses',
      description: 'Où collecter et livrer vos vêtements',
      completed: pickupAddress.street !== '' && (sameAddress || deliveryAddress.street !== '')
    },
    {
      id: 3,
      title: 'Confirmation',
      description: 'Vérifiez et confirmez votre rendez-vous',
      completed: false
    }
  ];

  const handleDateTimeChange = (dateTime: Date | undefined, slot?: TimeSlot) => {
    setSelectedDate(dateTime);
    setSelectedSlot(slot || null);
  };

  const handleNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBookingSubmit = async () => {
    if (!user || !selectedSlot || !selectedDate) {
      toast.error('Informations manquantes pour créer le rendez-vous');
      return;
    }

    setLoading(true);
    try {
      const appointmentData: CreateAppointmentRequest = {
        pressing: pressingId,
        timeSlot: selectedSlot._id,
        services: selectedServices.map(service => ({
          service: service.serviceId,
          quantity: service.quantity
        })),
        notes,
        pickupAddress,
        deliveryAddress: sameAddress ? pickupAddress : deliveryAddress
      };

      const appointment = await appointmentService.createAppointment(appointmentData);
      
      toast.success('🎉 Rendez-vous créé avec succès!');
      onBookingComplete?.(appointment._id);
      
      // Rediriger vers la page de suivi des rendez-vous
      navigate('/client/appointments');
      
    } catch (error: any) {
      console.error('Erreur lors de la création du rendez-vous:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la création du rendez-vous';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Planifiez votre collecte
              </h3>
              <p className="text-gray-600">
                Choisissez le jour et l'heure qui vous conviennent le mieux
              </p>
            </div>
            
            <BookingCalendar
              pressingId={pressingId}
              selectedServices={selectedServices.map(s => s.serviceId)}
              onDateTimeChange={handleDateTimeChange}
              onSlotSelect={setSelectedSlot}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Adresses de service
              </h3>
              <p className="text-gray-600">
                Indiquez où nous devons collecter et livrer vos vêtements
              </p>
            </div>

            {/* Adresse de collecte */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Adresse de collecte
              </h4>
              <input
                type="text"
                placeholder="Adresse complète (rue, quartier, commune)"
                value={pickupAddress.street}
                onChange={(e) => setPickupAddress({
                  ...pickupAddress,
                  street: e.target.value
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Option même adresse */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="sameAddress"
                checked={sameAddress}
                onChange={(e) => setSameAddress(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="sameAddress" className="text-sm text-gray-700">
                Livrer à la même adresse
              </label>
            </div>

            {/* Adresse de livraison */}
            {!sameAddress && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Adresse de livraison
                </h4>
                <input
                  type="text"
                  placeholder="Adresse complète (rue, quartier, commune)"
                  value={deliveryAddress.street}
                  onChange={(e) => setDeliveryAddress({
                    ...deliveryAddress,
                    street: e.target.value
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions spéciales (optionnel)
              </label>
              <textarea
                placeholder="Indications d'accès, préférences particulières..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Confirmez votre rendez-vous
              </h3>
              <p className="text-gray-600">
                Vérifiez les détails avant de finaliser
              </p>
            </div>

            {/* Récapitulatif */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
              {/* Date et heure */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-800">Date et heure</p>
                    <p className="text-sm text-gray-600">
                      {selectedDate?.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-800">
                    {selectedSlot?.startTime} - {selectedSlot?.endTime}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedSlot && timeslotService.getSlotTypeLabel(selectedSlot.slotType)}
                  </p>
                </div>
              </div>

              {/* Services */}
              <div className="py-3 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <Package className="w-5 h-5 text-blue-600" />
                  <p className="font-medium text-gray-800">Services sélectionnés</p>
                </div>
                <div className="space-y-2">
                  {selectedServices.map((service, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">
                        {service.serviceName} x{service.quantity}
                      </span>
                      <span className="font-medium text-gray-800">
                        {(service.price * service.quantity).toLocaleString()} FCFA
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Adresses */}
              <div className="py-3 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <p className="font-medium text-gray-800">Adresses</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Collecte: </span>
                    <span className="text-gray-800">{pickupAddress.street}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Livraison: </span>
                    <span className="text-gray-800">
                      {sameAddress ? pickupAddress.street : deliveryAddress.street}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-3">
                <span className="text-lg font-semibold text-gray-800">Total</span>
                <span className="text-xl font-bold text-blue-600">
                  {totalAmount.toLocaleString()} FCFA
                </span>
              </div>
            </div>

            {/* Notes */}
            {notes && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Instructions spéciales:</strong> {notes}
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      {/* En-tête avec étapes */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Réserver un rendez-vous
          </h2>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          )}
        </div>

        {/* Indicateur d'étapes */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                currentStep === step.id
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : step.completed
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'bg-white border-gray-300 text-gray-400'
              }`}>
                {step.completed ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  currentStep === step.id ? 'text-blue-600' : 
                  step.completed ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="w-4 h-4 text-gray-300 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contenu de l'étape */}
      <div className="p-6">
        {renderStepContent()}
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-gray-200 flex justify-between">
        <Button
          variant="outline"
          onClick={handlePreviousStep}
          disabled={currentStep === 1}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Précédent
        </Button>

        {currentStep < steps.length ? (
          <Button
            onClick={handleNextStep}
            disabled={!steps[currentStep - 1].completed}
            className="flex items-center gap-2"
          >
            Suivant
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleBookingSubmit}
            disabled={loading || !steps[currentStep - 1].completed}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Confirmer le rendez-vous
          </Button>
        )}
      </div>
    </div>
  );
};

export default AppointmentBookingWorkflow;
