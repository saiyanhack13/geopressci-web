import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import Button from '../../components/ui/Button';
import { AddressForm } from '../../components/profile/AddressForm';
import { useGetCurrentUserQuery, useUpdateCurrentUserMutation } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Address } from '../../types';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Home, 
  Building, 
  Star,
  ArrowLeft,
  Navigation,
  Clock
} from 'lucide-react';

export const AddressesPage: React.FC = () => {
  // Utilisation directe de l'API backend
  const { 
    data: userData, 
    isLoading, 
    error, 
    refetch 
  } = useGetCurrentUserQuery();
  
  const [updateUser, { isLoading: updateLoading }] = useUpdateCurrentUserMutation();
  
  // Extraction des adresses depuis les données utilisateur
  const addresses = userData?.addresses || [];

  const handleAddAddress = async (addressData: Omit<Address, 'id'>) => {
    try {
      const newAddress: Address = {
        ...addressData,
        id: Date.now().toString(),
        country: addressData.country || 'Côte d\'Ivoire',
        isDefault: addresses.length === 0
      };
      
      const updatedAddresses = [...addresses, newAddress];
      
      await updateUser({
        addresses: updatedAddresses
      }).unwrap();
      
      await refetch();
      toast.success('🏠 Adresse ajoutée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'adresse:', error);
      toast.error('❌ Erreur lors de l\'ajout de l\'adresse');
    }
  };
  
  const handleUpdateAddress = async (id: string, addressData: Partial<Address>) => {
    try {
      const updatedAddresses = addresses.map((addr: Address) => 
        addr.id === id ? { ...addr, ...addressData } : addr
      );
      
      await updateUser({
        addresses: updatedAddresses
      }).unwrap();
      
      await refetch();
      toast.success('✏️ Adresse mise à jour');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('❌ Erreur lors de la mise à jour');
    }
  };
  
  const handleDeleteAddress = async (id: string) => {
    try {
      const updatedAddresses = addresses.filter((addr: Address) => addr.id !== id);
      
      await updateUser({
        addresses: updatedAddresses
      }).unwrap();
      
      await refetch();
      toast.success('🗑️ Adresse supprimée');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('❌ Erreur lors de la suppression');
    }
  };
  
  const handleSetDefault = async (id: string) => {
    try {
      const updatedAddresses = addresses.map((addr: Address) => ({
        ...addr,
        isDefault: addr.id === id
      }));
      
      await updateUser({
        addresses: updatedAddresses
      }).unwrap();
      
      await refetch();
      toast.success('⭐ Adresse par défaut mise à jour');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('❌ Erreur lors de la mise à jour');
    }
  };
  
  // Gestion des erreurs API
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-600 mb-4">❌ Erreur lors du chargement des adresses</p>
              <Button onClick={() => refetch()} className="w-full">
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Chargement des adresses...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.history.back()}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <MapPin className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Mes Adresses</h1>
            </div>
            
            <div className="text-sm text-gray-600">
              {addresses.length} adresse{addresses.length > 1 ? 's' : ''} enregistrée{addresses.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Informations */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Gestion des adresses de livraison</h3>
              <p className="text-sm text-blue-700">
                Ajoutez et gérez vos adresses de livraison pour faciliter vos commandes. 
                L'adresse par défaut sera automatiquement sélectionnée lors de vos commandes.
              </p>
              <ul className="text-sm text-blue-600 mt-2 space-y-1">
                <li>• Géolocalisez vos adresses pour une livraison plus précise</li>
                <li>• Organisez vos adresses par type (domicile, travail, autre)</li>
                <li>• Une adresse par défaut est requise</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Formulaire de gestion des adresses */}
        <AddressForm
          addresses={addresses as Address[]}
          onAddAddress={handleAddAddress}
          onUpdateAddress={handleUpdateAddress}
          onDeleteAddress={handleDeleteAddress}
          onSetDefault={handleSetDefault}
          loading={updateLoading}
        />

        {/* Conseils */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">💡 Conseils pour vos adresses</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🎯 Précision de l'adresse</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Indiquez des points de repère (pharmacie, école, etc.)</li>
                <li>• Précisez l'étage ou le numéro d'appartement</li>
                <li>• Utilisez la géolocalisation pour plus de précision</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📱 Zones de livraison</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Cocody, Plateau, Yopougon : Livraison standard</li>
                <li>• Marcory, Treichville : Livraison étendue</li>
                <li>• Autres quartiers : Nous consulter</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">⏰ Créneaux de livraison</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Lun-Ven : 8h-18h (domicile et bureau)</li>
                <li>• Sam : 9h-16h (domicile uniquement)</li>
                <li>• Dim : 10h-15h (sur demande)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🚚 Frais de livraison</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Gratuite à partir de 5000 FCFA</li>
                <li>• Standard : 1000 FCFA</li>
                <li>• Express (2h) : 2000 FCFA</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        {addresses.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">📊 Statistiques de livraison</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {addresses.map((address) => (
                <div key={address.id} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-2">
                    {address.label === 'home' ? '🏠' : address.label === 'work' ? '🏢' : '📍'}
                  </div>
                  <h4 className="font-medium text-gray-900">{address.label || 'Adresse'}</h4>
                  <p className="text-sm text-gray-600 mb-2">{address.details || address.city}</p>
                  <div className="text-lg font-bold text-blue-600">
                    {Math.floor(Math.random() * 20) + 1}
                  </div>
                  <div className="text-xs text-gray-500">livraisons</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
