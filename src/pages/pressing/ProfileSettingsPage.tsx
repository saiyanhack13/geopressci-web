import React, { useState, useEffect, ChangeEvent } from 'react';
import { toast } from 'react-hot-toast';
import { 
  useGetPressingProfileQuery, 
  useUpdatePressingProfileMutation, 
  useGetDeliveryZonesQuery,
  useCreateDeliveryZoneMutation,
  useUpdateDeliveryZoneMutation,
  useDeleteDeliveryZoneMutation,
  DeliveryZone
} from '../../services/pressingApi';
import PressingLayout from '../../components/pressing/PressingLayout';
import { Button, Card, FormGroup, Input, Select, FormActions } from '../../components/ui/ResponsiveForm';
import { Skeleton } from '../../components/ui/SkeletonLoader';
import { Clock, MapPin, Phone, Mail, Globe, Info, Plus, Trash2, Save, X, Briefcase, Bell, Camera, LogOut } from 'lucide-react';
import { Tab } from '@headlessui/react';
import { cn } from '../../lib/utils';
import { useErrorHandler, withErrorHandling } from '../../utils/errorHandling';
import { createConnectionMonitor } from '../../utils/errorHandling';
import AddressLocationManager from '../../components/pressing/AddressLocationManager';

// Types de base
interface BusinessHours {
  day: string;
  open: string;
  close: string;
  isOpen: boolean; // Utilisé par l'API
}

interface PressingInfo {
  businessName: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    district: string;
    postalCode: string;
    country: string;
    coordinates: { lat: number; lng: number };
  };
  description: string;
  businessHours: BusinessHours[];
  notifications: {
    emailOrders: boolean;
    smsOrders: boolean;
    emailReviews: boolean;
    emailReports: boolean;
  };
  photos: string[];
  website?: string;
  logo?: string;
}

interface OpeningHours {
  [key: string]: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
}

// Using DeliveryZone type from API

interface NotificationSettings {
  emailOrders: boolean;
  smsOrders: boolean;
  emailReviews: boolean;
  emailReports: boolean;
}

const tabs = [
  { id: 'info', label: 'Infos' },
  { id: 'hours', label: 'Horaires' },
  { id: 'delivery', label: 'Zones de livraison' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'photos', label: 'Photos' },
];

// Mappage des jours en français
const FRENCH_DAYS = {
  monday: 'lundi',
  tuesday: 'mardi',
  wednesday: 'mercredi',
  thursday: 'jeudi',
  friday: 'vendredi',
  saturday: 'samedi',
  sunday: 'dimanche'
} as const;

type DayKey = keyof typeof FRENCH_DAYS;

// Composant Textarea simple
const Textarea: React.FC<{
  label?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}> = ({ label, value, onChange, placeholder, rows = 3, className = '' }) => (
  <div className={`space-y-1 ${className}`}>
    {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
    />
  </div>
);

// Composant pour l'onglet d'informations
interface InfoTabProps {
  formData: PressingInfo;
  setFormData: React.Dispatch<React.SetStateAction<PressingInfo>>;
  isLoading: boolean;
}

const InfoTab: React.FC<InfoTabProps> = ({ formData, setFormData, isLoading }) => {
  const handleInputChange = (field: keyof PressingInfo, value: any) => {
    setFormData((prev: PressingInfo) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field: keyof PressingInfo['address'], value: any) => {
    setFormData((prev: PressingInfo) => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-12 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-12 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-12 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      
      {/* Basic Information Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              📋 Informations générales
            </h3>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
              Mettez à jour les informations de base de votre pressing pour une meilleure visibilité.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="sm:col-span-2">
              <label htmlFor="business-name" className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'entreprise *
              </label>
              <input
                id="business-name"
                type="text"
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                placeholder="Mon Pressing"
                required
                className="w-full min-h-[44px] px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                aria-describedby="business-name-help"
              />
              <p id="business-name-help" className="mt-1 text-sm text-gray-500">
                Le nom qui apparaîtra sur votre profil public
              </p>
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone *
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+225 XX XX XX XX"
                required
                className="w-full min-h-[44px] px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                aria-describedby="phone-help"
              />
              <p id="phone-help" className="mt-1 text-sm text-gray-500">
                Numéro principal de contact
              </p>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="contact@monpressing.ci"
                required
                className="w-full min-h-[44px] px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                aria-describedby="email-help"
              />
              <p id="email-help" className="mt-1 text-sm text-gray-500">
                Adresse email professionnelle
              </p>
            </div>
            
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                Site web
              </label>
              <input
                id="website"
                type="url"
                value={formData.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://monpressing.ci"
                className="w-full min-h-[44px] px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                aria-describedby="website-help"
              />
              <p id="website-help" className="mt-1 text-sm text-gray-500">
                Votre site web (optionnel)
              </p>
            </div>
          </div>
          
          <div className="mt-6 sm:mt-8">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description de votre pressing
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Décrivez votre pressing, vos services et ce qui vous rend unique. Cette description apparaîtra sur votre profil public..."
              rows={4}
              className="w-full p-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
              aria-describedby="description-help"
            />
            <p id="description-help" className="mt-1 text-sm text-gray-500">
              Présentez votre pressing en quelques phrases (recommandé : 100-300 mots)
            </p>
          </div>
        </div>
      </div>

      {/* Address and Location Card with Manual Selection */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              📍 Adresse et localisation
            </h3>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
              Définissez l'adresse complète et la position GPS précise de votre pressing.
            </p>
          </div>
          
          <AddressLocationManager
            address={formData.address}
            onAddressChange={(newAddress) => {
              setFormData(prev => ({
                ...prev,
                address: newAddress
              }));
            }}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

// Composant pour l'onglet des horaires d'ouverture
interface HoursTabProps {
  businessHours: OpeningHours;
  setBusinessHours: React.Dispatch<React.SetStateAction<OpeningHours>>;
  isLoading: boolean;
}

const HoursTab: React.FC<HoursTabProps> = ({ businessHours, setBusinessHours, isLoading }) => {
  const days = [
    { id: 'monday', label: 'Lundi' },
    { id: 'tuesday', label: 'Mardi' },
    { id: 'wednesday', label: 'Mercredi' },
    { id: 'thursday', label: 'Jeudi' },
    { id: 'friday', label: 'Vendredi' },
    { id: 'saturday', label: 'Samedi' },
    { id: 'sunday', label: 'Dimanche' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} height="80px" className="mb-2" />
        ))}
      </div>
    );
  }

  const updateHours = (dayId: string, field: string, value: string) => {
    setBusinessHours((prev: OpeningHours) => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        [field]: value
      }
    }));
  };

  const toggleDay = (dayId: string) => {
    setBusinessHours((prev: OpeningHours) => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        isOpen: !prev[dayId].isOpen
      }
    }));
  };

  return (
    <div className="space-y-4">
      {days.map((day) => (
        <div key={day.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={businessHours[day.id].isOpen}
                onChange={() => toggleDay(day.id)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="font-medium">{day.label}</span>
            </label>
            {businessHours[day.id].isOpen && (
              <span className="text-sm text-gray-500">
                {businessHours[day.id].openTime} - {businessHours[day.id].closeTime}
              </span>
            )}
          </div>
          
          {businessHours[day.id].isOpen && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ouverture</label>
                <input
                  type="time"
                  value={businessHours[day.id].openTime}
                  onChange={(e) => updateHours(day.id, 'openTime', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fermeture</label>
                <input
                  type="time"
                  value={businessHours[day.id].closeTime}
                  onChange={(e) => updateHours(day.id, 'closeTime', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export const ProfileSettingsPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { data: profile, isLoading, refetch } = useGetPressingProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdatePressingProfileMutation();
  const [hasChanges, setHasChanges] = useState(false);
  const [businessHours, setBusinessHours] = useState<OpeningHours>({
    monday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
    tuesday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
    wednesday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
    thursday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
    friday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
    saturday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
    sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
  });

  // RTK Query hooks for delivery zones
  const {
    data: deliveryZonesData,
    isLoading: isLoadingZones,
    refetch: refetchZones,
  } = useGetDeliveryZonesQuery({ activeOnly: false });
  const [createZone] = useCreateDeliveryZoneMutation();
  const [updateZone] = useUpdateDeliveryZoneMutation();
  const [deleteZone] = useDeleteDeliveryZoneMutation();
  
  // État local pour le formulaire
  const [formData, setFormData] = useState({
    businessName: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      district: '',
      postalCode: '',
      country: 'Côte d\'Ivoire',
      coordinates: { lat: 0, lng: 0 }, // default, should be updated with real values if available
    },
    description: '',
    businessHours: [] as BusinessHours[],
    notifications: {
      emailOrders: false,
      smsOrders: false,
      emailReviews: false,
      emailReports: false,
    },
    photos: [] as string[],
  });
  
  // Mise à jour du formulaire quand les données sont chargées
  useEffect(() => {
    if (profile) {
      setFormData({
        businessName: profile.businessName || '',
        phone: profile.phone || '',
        email: profile.email || '',
        address: {
          street: profile.address?.street || '',
          city: profile.address?.city || '',
          district: profile.address?.district || '',
          postalCode: profile.address?.postalCode || '',
          country: profile.address?.country || 'Côte d\'Ivoire',
          coordinates: profile.address?.coordinates || { lat: 0, lng: 0 },
        },
        description: profile.description || '',
        businessHours: profile.businessHours || [],
        notifications: {
          emailOrders: false,
          smsOrders: false,
          emailReviews: false,
          emailReports: false,
        },
        photos: profile.photos || [],
      });
    }
  }, [profile]);
  
  // Fonction pour gérer les changements d'input
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };
  
  // Fonction pour sauvegarder les modifications
  const handleSave = async () => {
    try {
      await updateProfile(formData).unwrap();
      toast.success('Profil mis à jour avec succès!');
      setHasChanges(false);
      refetch();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du profil');
      console.error('Erreur:', error);
    }
  };
  
  // Fonctions pour gérer les photos
  const handleAddPhoto = () => {
    // Logique pour ajouter une photo
    console.log('Ajouter une photo');
  };
  
  const handleEditPhoto = (index: number) => {
    // Logique pour éditer une photo
    console.log('Éditer photo', index);
  };
  
  const handleRemovePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
    setHasChanges(true);
  };
  
  // Gestion des changements des horaires d'ouverture
  const handleHoursChange = (dayKey: DayKey, field: 'open' | 'close' | 'isOpen', value: string | boolean) => {
    const day = FRENCH_DAYS[dayKey];
    
    setFormData(prev => {
      // Créer une copie du tableau businessHours
      const updatedHours = [...prev.businessHours];
      
      // Trouver l'index du jour dans le tableau businessHours
      const dayIndex = updatedHours.findIndex(h => h.day === day);
      
      // Si le jour n'existe pas encore, l'ajouter avec des valeurs par défaut
      if (dayIndex === -1) {
        const isOpen = field === 'isOpen' ? value as boolean : false;
        updatedHours.push({
          day,
          open: field === 'open' ? value as string : '',
          close: field === 'close' ? value as string : '',
          isOpen
        });
      } else {
        // Mettre à jour l'entrée existante
        const currentDay = updatedHours[dayIndex];
        const isOpen = field === 'isOpen' 
          ? value as boolean 
          : currentDay.isOpen;
        
        const updatedDay = {
          ...currentDay,
          [field]: field === 'isOpen' ? value : value,
          isOpen,
          ...(field === 'isOpen' && !value ? { 
            open: '', 
            close: '' 
          } : {})
        };
        
        // Ne pas ajouter de jour avec des champs vides
        if (field === 'isOpen' && !value) {
          updatedHours.splice(dayIndex, 1);
        } else {
          updatedHours[dayIndex] = updatedDay;
        }
      }
      
      // Filtrer les entrées invalides (sans heures d'ouverture/fermeture)
      const validHours = updatedHours.filter(h => 
        h.day && ((h.open && h.close) || !h.isOpen)
      );
      
      return {
        ...prev,
        businessHours: validHours as BusinessHours[]
      };
    });
    
    setHasChanges(true);
  };

  // Gestion des changements de formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as object),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    setHasChanges(true);
  };
  
  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(formData).unwrap();
      await refetch();
      toast.success('Profil mis à jour avec succès');
      setHasChanges(false);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour du profil');
    }
  };

  // Handlers for delivery zones
  const handleUpdateDeliveryZone = (zoneId: string, updates: Partial<DeliveryZone>) => {
    if (!deliveryZonesData) return;
    const zone = deliveryZonesData.find((z: any) => z.id === zoneId);
    if (!zone) return;
    updateZone({ ...zone, ...updates });
    setHasChanges(true);
  };

  const handleRemoveDeliveryZone = (zoneId: string) => {
    deleteZone(zoneId);
    setHasChanges(true);
  };

  const handleAddDeliveryZone = async () => {
    const zoneName = window.prompt('Nom de la nouvelle zone :');
    if (zoneName) {
      const newZone = await createZone({
        name: zoneName,
        deliveryFee: 0,
        minOrder: 0
      }).unwrap();
      setHasChanges(true);
    }
  };

  // Handler for notifications
  const handleNotificationChange = (field: keyof typeof formData.notifications, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  // Les fonctions pour les photos sont déjà définies plus haut

  const renderInfoTab = () => (
    <Card className="mb-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Informations du pressing</h3>
        <p className="mt-1 text-sm text-gray-500">Gérez les informations de base de votre pressing qui seront visibles par les clients.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
            Nom du pressing
          </label>
          <input
            id="businessName"
            name="businessName"
            type="text"
            value={formData.businessName}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              businessName: e.target.value
            }))}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Téléphone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              phone: e.target.value
            }))}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              email: e.target.value
            }))}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 mb-1">
            Rue
          </label>
          <input
            id="address.street"
            name="address.street"
            type="text"
            value={formData.address.street}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              address: { ...prev.address, street: e.target.value }
            }))}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 mb-1">
            Ville
          </label>
          <input
            id="address.city"
            name="address.city"
            type="text"
            value={formData.address.city}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              address: { ...prev.address, city: e.target.value }
            }))}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="address.district" className="block text-sm font-medium text-gray-700 mb-1">
            Quartier
          </label>
          <input
            id="address.district"
            name="address.district"
            type="text"
            value={formData.address.district}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              address: { ...prev.address, district: e.target.value }
            }))}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="address.postalCode" className="block text-sm font-medium text-gray-700 mb-1">
            Code postal
          </label>
          <input
            id="address.postalCode"
            name="address.postalCode"
            type="text"
            value={formData.address.postalCode}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              address: { ...prev.address, postalCode: e.target.value }
            }))}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              description: e.target.value
            }))}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Décrivez votre pressing en quelques mots..."
          />
        </div>
      </div>
      
      <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={!hasChanges}
        >
          <X size={16} className="mr-2" />
          Annuler
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isUpdating}
          isLoading={isUpdating}
          leftIcon={<Save size={16} />}
        >
          Enregistrer les modifications
        </Button>
      </div>
    </Card>
  );

  const renderHoursTab = () => (
    <Card className="mb-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Horaires d'ouverture</h3>
        <p className="mt-1 text-sm text-gray-500">Définissez les heures d'ouverture de votre pressing</p>
      </div>
      
      <div className="space-y-4">
        {Object.entries(FRENCH_DAYS).map(([key, label]) => (
          <div key={key} className="flex items-start justify-between py-3 border-b border-gray-200">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.businessHours.find(h => h.day === label)?.isOpen || false}
                onChange={e => handleHoursChange(key as DayKey, 'isOpen', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-3 block text-sm font-medium text-gray-700">
                {label.charAt(0).toUpperCase() + label.slice(1)}
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="time"
                value={formData.businessHours.find(h => h.day === label)?.open || ''}
                onChange={e => handleHoursChange(key as DayKey, 'open', e.target.value)}
                disabled={!formData.businessHours.find(h => h.day === label)?.isOpen}
                className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              />
              <span className="text-gray-500">-</span>
              <input
                type="time"
                value={formData.businessHours.find(h => h.day === label)?.close || ''}
                onChange={e => handleHoursChange(key as DayKey, 'close', e.target.value)}
                disabled={!formData.businessHours.find(h => h.day === label)?.isOpen}
                className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isUpdating}
          isLoading={isUpdating}
          leftIcon={<Save size={16} />}
        >
          Enregistrer les horaires
        </Button>
      </div>
    </Card>
  );

  const renderDeliveryTab = () => (
    <Card className="mb-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Zones de livraison</h3>
        <p className="mt-1 text-sm text-gray-500">Définissez les zones où vous proposez la livraison et les frais associés.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {deliveryZonesData?.map((zone: DeliveryZone) => (
          <div key={zone.id} className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow">
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={zone.isActive}
                  onChange={e => handleUpdateDeliveryZone(zone.id, { isActive: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <input
                  type="text"
                  value={zone.name}
                  onChange={e => handleUpdateDeliveryZone(zone.id, { name: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Nom de la zone"
                />
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">FCFA</span>
                  </div>
                  <input
                    type="number"
                    value={zone.deliveryFee}
                    onChange={e => handleUpdateDeliveryZone(zone.id, { deliveryFee: Number(e.target.value) })}
                    className="block w-32 pl-12 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveDeliveryZone(zone.id)}
              className="text-red-600 hover:text-red-900"
              title="Supprimer cette zone"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end">
        <Button
          type="button"
          onClick={handleAddDeliveryZone}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Ajouter une zone
        </Button>
      </div>
    </Card>
  );

  const renderNotificationsTab = () => (
    <Card className="mb-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
        <p className="mt-1 text-sm text-gray-500">Configurez les notifications que vous souhaitez recevoir.</p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Commandes par email</h4>
            <p className="text-sm text-gray-500">Recevoir les nouvelles commandes par email</p>
          </div>
          <input
            type="checkbox"
            checked={formData.notifications.emailOrders}
            onChange={e => handleNotificationChange('emailOrders', e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Commandes par SMS</h4>
            <p className="text-sm text-gray-500">Recevoir les nouvelles commandes par SMS</p>
          </div>
          <input
            type="checkbox"
            checked={formData.notifications.smsOrders}
            onChange={e => handleNotificationChange('smsOrders', e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Avis clients par email</h4>
            <p className="text-sm text-gray-500">Recevoir les nouveaux avis clients par email</p>
          </div>
          <input
            type="checkbox"
            checked={formData.notifications.emailReviews}
            onChange={e => handleNotificationChange('emailReviews', e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Rapports par email</h4>
            <p className="text-sm text-gray-500">Recevoir les rapports hebdomadaires par email</p>
          </div>
          <input
            type="checkbox"
            checked={formData.notifications.emailReports}
            onChange={e => handleNotificationChange('emailReports', e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
        </div>
      </div>
    </Card>
  );

  const renderPhotosTab = () => (
    <Card className="mb-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Photos du pressing</h3>
        <p className="mt-1 text-sm text-gray-500">Ajoutez des photos de votre pressing pour attirer plus de clients.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(formData.photos || []).map((photo, index) => (
          <div key={index} className="relative group">
            <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEditPhoto(index)} className="bg-blue-600 text-white p-1 rounded mr-1">
                ✏️ Éditer
              </button>
              <button onClick={() => handleRemovePhoto(index)} className="bg-red-600 text-white p-1 rounded">
                🗑️ Supprimer
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={handleAddPhoto}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
        >
          <div className="text-gray-400">
            <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mt-2 text-sm font-medium text-gray-900">Ajouter une photo</p>
            <p className="text-xs text-gray-500">Cliquez pour ajouter une nouvelle photo</p>
          </div>
        </button>
      </div>
    </Card>
  );

  const tabs = [
    { id: 0, label: 'Informations', icon: <Info size={18} className="mr-2" /> },
    { id: 1, label: 'Horaires', icon: <Clock size={18} className="mr-2" /> },
    { id: 2, label: 'Zones de livraison', icon: <MapPin size={18} className="mr-2" /> },
    { id: 3, label: 'Notifications', icon: <Bell size={18} className="mr-2" /> },
    { id: 4, label: 'Photos', icon: <Camera size={18} className="mr-2" /> },
  ];

  return (
    <PressingLayout 
      title="Paramètres du profil"
      description="Gérez les informations de votre pressing"
    >
      <div className="max-w-6xl mx-auto px-1 sm:px-6 lg:px-8">
        
        {/* Header Section - Mobile-First UI/UX 2025 */}
        <header className="mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              Paramètres du profil
            </h1>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl">
              Gérez les informations de votre pressing et personnalisez votre expérience
            </p>
          </div>
        </header>

        {/* Mobile-First Tab Navigation - UI/UX 2025 */}
        <nav className="mb-8" role="tablist" aria-label="Paramètres du profil">
          
          {/* Mobile Tab Selector */}
          <div className="sm:hidden">
            <label htmlFor="tab-select" className="sr-only">Sélectionner un onglet</label>
            <select
              id="tab-select"
              value={activeTab}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setActiveTab(Number(e.target.value))}
              className="w-full min-h-[44px] px-4 py-3 text-base font-medium bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              aria-label="Sélectionner une section des paramètres"
            >
              {tabs.map((tab, index) => (
                <option key={tab.id} value={index}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop/Tablet Tab Navigation */}
          <div className="hidden sm:block">
            <div className="bg-gray-50 rounded-2xl p-2 overflow-x-auto">
              <div className="flex space-x-2 min-w-max">
                {tabs.map((tab, index) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(index)}
                    className={cn(
                      'min-h-[44px] px-4 sm:px-6 py-3 rounded-xl font-medium text-sm sm:text-base transition-all duration-200 flex items-center gap-2 whitespace-nowrap',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                      activeTab === index
                        ? 'bg-white text-blue-700 shadow-sm border border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    )}
                    role="tab"
                    aria-selected={activeTab === index}
                    aria-controls={`tabpanel-${index}`}
                    id={`tab-${index}`}
                  >
                    <span className="text-lg sm:text-xl" aria-hidden="true">
                      {index === 0 && '📋'}
                      {index === 1 && '🕒'}
                      {index === 2 && '🚚'}
                      {index === 3 && '🔔'}
                      {index === 4 && '📸'}
                    </span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </nav>

        {/* Tab Content - Mobile-First Layout */}
        <main className="space-y-8">
          
          {/* Info Tab */}
          {activeTab === 0 && (
            <section 
              id="tabpanel-0" 
              role="tabpanel" 
              aria-labelledby="tab-0"
              className="focus:outline-none"
            >
              <InfoTab 
                formData={formData} 
                setFormData={setFormData} 
                isLoading={isLoading} 
              />
            </section>
          )}

          {/* Hours Tab */}
          {activeTab === 1 && (
            <section 
              id="tabpanel-1" 
              role="tabpanel" 
              aria-labelledby="tab-1"
              className="focus:outline-none"
            >
              <HoursTab 
                businessHours={businessHours} 
                setBusinessHours={setBusinessHours} 
                isLoading={isLoading} 
              />
            </section>
          )}

          {/* Delivery Tab */}
          {activeTab === 2 && (
            <section 
              id="tabpanel-2" 
              role="tabpanel" 
              aria-labelledby="tab-2"
              className="focus:outline-none"
            >
              {renderDeliveryTab()}
            </section>
          )}

          {/* Notifications Tab */}
          {activeTab === 3 && (
            <section 
              id="tabpanel-3" 
              role="tabpanel" 
              aria-labelledby="tab-3"
              className="focus:outline-none"
            >
              {renderNotificationsTab()}
            </section>
          )}

          {/* Photos Tab */}
          {activeTab === 4 && (
            <section 
              id="tabpanel-4" 
              role="tabpanel" 
              aria-labelledby="tab-4"
              className="focus:outline-none"
            >
              {renderPhotosTab()}
            </section>
          )}
        </main>

        {/* Save Changes Button - Fixed Position on Mobile */}
        {hasChanges && (
          <div className="sticky bottom-4 sm:static sm:mt-8 z-10">
            <div className="bg-white sm:bg-transparent p-4 sm:p-0 rounded-xl sm:rounded-none shadow-lg sm:shadow-none border sm:border-0 mx-4 sm:mx-0">
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => setHasChanges(false)}
                  className="min-h-[44px] px-6 py-3 text-base font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 focus:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:order-1"
                  aria-label="Annuler les modifications"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="min-h-[44px] px-6 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-xl hover:bg-blue-700 focus:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2 sm:order-2"
                  aria-label={isUpdating ? 'Sauvegarde en cours' : 'Enregistrer les modifications'}
                >
                  {isUpdating && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                  )}
                  {isUpdating ? 'Sauvegarde...' : '💾 Enregistrer les modifications'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Danger Zone - Enhanced UI/UX 2025 */}
      <aside className="mt-12 px-4 sm:px-6 lg:px-8" aria-labelledby="danger-zone-title">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-2xl overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-xl" aria-hidden="true">⚠️</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 id="danger-zone-title" className="text-lg sm:text-xl font-bold text-red-900 mb-3">
                    Zone dangereuse
                  </h3>
                  <p className="text-sm sm:text-base text-red-700 leading-relaxed mb-6">
                    La modification de ces paramètres peut affecter le fonctionnement de votre compte.
                    Cette action est irréversible.
                  </p>
                  <button
                    type="button"
                    className="min-h-[44px] inline-flex items-center gap-3 px-6 py-3 text-base font-medium text-white bg-red-600 border border-transparent rounded-xl hover:bg-red-700 focus:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    onClick={() => {}}
                    aria-label="Se déconnecter du compte"
                  >
                    <LogOut className="w-5 h-5" aria-hidden="true" />
                    Se déconnecter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </PressingLayout>
  );
};

// Default export for backward compatibility
export default ProfileSettingsPage;
