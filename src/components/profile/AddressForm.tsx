import React, { useState, useEffect } from 'react';
import { MapPin, Home, Building, Plus, Trash2, Edit3, Navigation } from 'lucide-react';
import { Address } from '../../types';

interface AddressFormProps {
  addresses: Address[];
  onAddAddress: (address: Omit<Address, 'id'>) => Promise<void>;
  onUpdateAddress: (id: string, address: Partial<Address>) => Promise<void>;
  onDeleteAddress: (id: string) => void;
  onSetDefault: (id: string) => void;
  loading?: boolean;
}

const ABIDJAN_NEIGHBORHOODS = [
  'Cocody', 'Plateau', 'Yopougon', 'Adjamé', 'Treichville', 
  'Marcory', 'Koumassi', 'Port-Bouët', 'Abobo', 'Attécoubé',
  'Bingerville', 'Anyama', 'Songon', 'Grand-Bassam'
];

export const AddressForm: React.FC<AddressFormProps> = ({
  addresses,
  onAddAddress,
  onUpdateAddress,
  onDeleteAddress,
  onSetDefault,
  loading = false
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    label: 'home' as 'home' | 'work' | 'other',
    street: '',
    neighborhood: '',
    city: 'Abidjan',
    country: 'Côte d\'Ivoire',
    location: undefined as { lat: number; lng: number } | undefined
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [gettingLocation, setGettingLocation] = useState(false);

  const resetForm = () => {
    setFormData({
      label: 'home',
      street: '',
      neighborhood: '',
      city: 'Abidjan',
      country: 'Côte d\'Ivoire',
      location: undefined
    });
    setErrors({});
    setIsAdding(false);
    setEditingId(null);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.street.trim()) {
      newErrors.street = 'La rue est requise';
    }

    if (!formData.neighborhood?.trim()) {
      newErrors.neighborhood = 'Le quartier est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }));
          setGettingLocation(false);
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
          setGettingLocation(false);
        }
      );
    } else {
      setGettingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const addressData = {
        ...formData,
        isDefault: addresses.length === 0
      };

      try {
        if (editingId) {
          await onUpdateAddress(editingId, addressData);
        } else {
          await onAddAddress(addressData);
        }
        resetForm();
      } catch (error) {
        console.error('Error saving address:', error);
      }
    }
  };

  const startEdit = (address: Address) => {
    setFormData({
      label: address.label || 'home',
      street: address.street,
      neighborhood: address.neighborhood || '',
      city: address.city,
      country: address.country,
      location: address.location
    });
    setEditingId(address.id || address._id || '');
    setIsAdding(true);
  };

  const getTypeIcon = (label: string) => {
    switch (label) {
      case 'home': return '🏠';
      case 'work': return '🏢';
      default: return '📍';
    }
  };

  const getTypeLabel = (label: string) => {
    switch (label) {
      case 'home': return 'Domicile';
      case 'work': return 'Travail';
      default: return 'Autre';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Adresses de livraison</h2>
        </div>
        
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter une adresse
          </button>
        )}
      </div>

      {/* Liste des adresses */}
      <div className="space-y-4 mb-6">
        {addresses.map((address) => (
          <div
            key={address.id}
            className={`p-4 border rounded-lg ${
              address.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{getTypeIcon(address.label || 'other')}</span>
                  <span className="font-medium text-gray-900">{getTypeLabel(address.label || 'other')}</span>
                  {address.isDefault && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      Par défaut
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm">
                  {address.street}, {address.neighborhood || ''}, {address.city}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {getTypeLabel(address.label || 'other')}
                  {address.location && ' • Géolocalisée'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!address.isDefault && (
                  <button
                    onClick={() => onSetDefault(address.id || address._id || '')}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Définir par défaut
                  </button>
                )}
                <button
                  onClick={() => startEdit(address)}
                  className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteAddress(address.id || address._id || '')}
                  className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                  disabled={address.isDefault}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {addresses.length === 0 && !isAdding && (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune adresse enregistrée</p>
            <p className="text-sm">Ajoutez votre première adresse de livraison</p>
          </div>
        )}
      </div>

      {/* Formulaire d'ajout/modification */}
      {isAdding && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingId ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type et nom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'adresse
                </label>
                <select
                  value={formData.label}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    label: e.target.value as 'home' | 'work' | 'other' 
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="home">🏠 Domicile</option>
                  <option value="work">🏢 Travail</option>
                  <option value="other">📍 Autre</option>
                </select>
              </div>


            </div>

            {/* Rue */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rue / Adresse *
              </label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.street ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Numéro et nom de rue"
              />
              {errors.street && (
                <p className="text-red-500 text-sm mt-1">{errors.street}</p>
              )}
            </div>

            {/* Quartier et ville */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quartier *
                </label>
                <select
                  value={formData.neighborhood || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.neighborhood ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Sélectionner un quartier</option>
                  {ABIDJAN_NEIGHBORHOODS.map(neighborhood => (
                    <option key={neighborhood} value={neighborhood}>
                      {neighborhood}
                    </option>
                  ))}
                </select>
                {errors.neighborhood && (
                  <p className="text-red-500 text-sm mt-1">{errors.neighborhood}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Abidjan"
                />
              </div>
            </div>

            {/* Géolocalisation */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Géolocalisation</p>
                <p className="text-sm text-gray-600">
                  {formData.location 
                    ? '📍 Position enregistrée' 
                    : 'Ajoutez votre position pour une livraison plus précise'
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Navigation className="w-4 h-4" />
                {gettingLocation ? 'Localisation...' : 'Ma position'}
              </button>
            </div>

            {/* Boutons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Enregistrement...' : editingId ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
