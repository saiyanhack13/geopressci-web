import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  Phone, 
  Clock, 
  Camera, 
  Edit, 
  Save, 
  X, 
  Upload,
  Star,
  Award,
  Shield,
  Truck,
  CreditCard,
  Wifi,
  Car,
  Accessibility,
  CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PressingProfile {
  id: string;
  businessName: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  coverImage?: string;
  openingHours: {
    [key: string]: { open: string; close: string; isOpen: boolean };
  };
  services: string[];
  amenities: string[];
  certifications: string[];
  paymentMethods: string[];
}

interface PressingProfileConfigProps {
  profile: PressingProfile;
  onSave: (profile: PressingProfile) => Promise<void>;
  onCancel: () => void;
}

const PressingProfileConfig: React.FC<PressingProfileConfigProps> = ({
  profile,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<PressingProfile>(profile);
  const [activeSection, setActiveSection] = useState<'basic' | 'hours' | 'services' | 'amenities'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const sections = [
    { id: 'basic', label: 'Informations', icon: User, color: 'bg-blue-100 text-blue-600' },
    { id: 'hours', label: 'Horaires', icon: Clock, color: 'bg-green-100 text-green-600' },
    { id: 'services', label: 'Services', icon: Star, color: 'bg-purple-100 text-purple-600' },
    { id: 'amenities', label: 'Équipements', icon: Award, color: 'bg-orange-100 text-orange-600' }
  ] as const;

  const daysOfWeek = [
    { key: 'monday', label: 'Lundi' },
    { key: 'tuesday', label: 'Mardi' },
    { key: 'wednesday', label: 'Mercredi' },
    { key: 'thursday', label: 'Jeudi' },
    { key: 'friday', label: 'Vendredi' },
    { key: 'saturday', label: 'Samedi' },
    { key: 'sunday', label: 'Dimanche' }
  ];

  const availableServices = [
    'Nettoyage à sec',
    'Lavage',
    'Repassage',
    'Retouches',
    'Teinture',
    'Détachage',
    'Service express',
    'Livraison à domicile',
    'Collecte à domicile'
  ];

  const availableAmenities = [
    { id: 'parking', label: 'Parking gratuit', icon: Car },
    { id: 'wifi', label: 'WiFi gratuit', icon: Wifi },
    { id: 'accessibility', label: 'Accès handicapés', icon: Accessibility },
    { id: 'delivery', label: 'Livraison', icon: Truck },
    { id: 'cards', label: 'Cartes bancaires', icon: CreditCard },
    { id: 'certified', label: 'Pressing certifié', icon: Shield }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleHoursChange = (day: string, field: 'open' | 'close' | 'isOpen', value: any) => {
    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day],
          [field]: value
        }
      }
    }));
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleFileUpload = (type: 'logo' | 'cover', file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas dépasser 5MB');
      return;
    }

    if (type === 'logo') {
      setLogoFile(file);
    } else {
      setCoverFile(file);
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    handleInputChange(type === 'logo' ? 'logo' : 'coverImage', previewUrl);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      toast.success('Profil mis à jour avec succès !');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.businessName.trim()) errors.push('Nom du pressing requis');
    if (!formData.address.trim()) errors.push('Adresse requise');
    if (!formData.phone.trim()) errors.push('Téléphone requis');
    if (!formData.email.trim()) errors.push('Email requis');
    
    return errors;
  };

  const errors = validateForm();
  const canSave = errors.length === 0;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Configuration du profil</h2>
            <p className="text-blue-100 text-sm">Optimisez votre présence en ligne</p>
          </div>
          <button
            onClick={onCancel}
            className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Section Navigation - Mobile Optimized */}
      <div className="border-b border-gray-200">
        <div className="flex overflow-x-auto scrollbar-hide">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex-shrink-0 flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeSection === section.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="whitespace-nowrap">{section.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[70vh] overflow-y-auto">
        {/* Basic Information */}
        {activeSection === 'basic' && (
          <div className="space-y-6">
            {/* Logo and Cover */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Logo du pressing
                </label>
                <div className="relative">
                  <div className="w-32 h-32 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                    {formData.logo ? (
                      <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('logo', e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full">
                    <Upload className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Image de couverture
                </label>
                <div className="relative">
                  <div className="w-full h-32 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                    {formData.coverImage ? (
                      <img src={formData.coverImage} alt="Couverture" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('cover', e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full">
                    <Upload className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Info Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom du pressing *
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Pressing Excellence"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="07 XX XX XX XX"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="contact@pressing.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Site web
                </label>
                <input
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://monpressing.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adresse complète *
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="123 Rue de la République, Abidjan"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Décrivez votre pressing, vos spécialités, votre expérience..."
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/500 caractères
              </p>
            </div>
          </div>
        )}

        {/* Opening Hours */}
        {activeSection === 'hours' && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Horaires d'ouverture</h3>
              <p className="text-blue-700 text-sm">
                Définissez vos horaires pour chaque jour de la semaine
              </p>
            </div>

            {daysOfWeek.map((day) => {
              const hours = formData.openingHours[day.key] || { open: '08:00', close: '18:00', isOpen: true };
              return (
                <div key={day.key} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{day.label}</h4>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hours.isOpen}
                        onChange={(e) => handleHoursChange(day.key, 'isOpen', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">Ouvert</span>
                    </label>
                  </div>

                  {hours.isOpen && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Ouverture
                        </label>
                        <input
                          type="time"
                          value={hours.open}
                          onChange={(e) => handleHoursChange(day.key, 'open', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Fermeture
                        </label>
                        <input
                          type="time"
                          value={hours.close}
                          onChange={(e) => handleHoursChange(day.key, 'close', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Services */}
        {activeSection === 'services' && (
          <div className="space-y-6">
            <div className="bg-purple-50 rounded-xl p-4">
              <h3 className="font-semibold text-purple-900 mb-2">Services proposés</h3>
              <p className="text-purple-700 text-sm">
                Sélectionnez tous les services que vous proposez
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableServices.map((service) => (
                <label
                  key={service}
                  className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.services.includes(service)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.services.includes(service)}
                    onChange={() => handleServiceToggle(service)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 mr-3"
                  />
                  <span className="font-medium text-gray-900">{service}</span>
                  {formData.services.includes(service) && (
                    <CheckCircle className="w-5 h-5 text-purple-600 ml-auto" />
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Amenities */}
        {activeSection === 'amenities' && (
          <div className="space-y-6">
            <div className="bg-orange-50 rounded-xl p-4">
              <h3 className="font-semibold text-orange-900 mb-2">Équipements et services</h3>
              <p className="text-orange-700 text-sm">
                Mettez en avant vos équipements et services additionnels
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {availableAmenities.map((amenity) => {
                const Icon = amenity.icon;
                return (
                  <label
                    key={amenity.id}
                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.amenities.includes(amenity.id)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity.id)}
                      onChange={() => handleAmenityToggle(amenity.id)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 mr-3"
                    />
                    <Icon className="w-5 h-5 text-gray-600 mr-3" />
                    <span className="font-medium text-gray-900">{amenity.label}</span>
                    {formData.amenities.includes(amenity.id) && (
                      <CheckCircle className="w-5 h-5 text-orange-600 ml-auto" />
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
          <div className="text-sm text-gray-600">
            {!canSave && (
              <div className="text-red-600">
                <span className="font-medium">Erreurs:</span> {errors.join(', ')}
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave || isSaving}
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Sauvegarder
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PressingProfileConfig;
