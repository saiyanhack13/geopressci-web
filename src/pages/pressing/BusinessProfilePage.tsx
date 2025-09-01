import React, { useState } from 'react';
import { Briefcase, ArrowLeft, Edit, MapPin, Phone, Clock, DollarSign, CheckCircle, XCircle, Percent, Star, Users, Package } from 'lucide-react';
import { useGetPressingProfileQuery, useUpdatePressingProfileMutation, useGetPressingServicesQuery, useGetPressingStatsQuery, PressingService } from '../../services/pressingApi';
import Loader from '../../components/ui/Loader';
import { toast } from 'react-hot-toast';
import { getLogoPlaceholder, getCoverPlaceholder } from '../../utils/placeholders';

interface Photo {
  url: string;
  caption?: string;
  isPrimary?: boolean;
  uploadedAt?: Date;
}

interface BusinessProfile {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  openingHours: string;
  services: string[];
  priceRange: string;
  isVerified: boolean;
  logoUrl: string;
  coverImageUrl: string;
  stats: {
    rating: number;
    reviews: number;
    clients: number;
    orders: number;
  };
  specialOffers: {
    title: string;
    description: string;
  }[];
}

export const BusinessProfilePage: React.FC = () => {
  // Hooks API pour récupérer et mettre à jour les données réelles
  const { 
    data: profileData, 
    isLoading, 
    error, 
    refetch 
  } = useGetPressingProfileQuery();
  
  const { 
    data: servicesData, 
    isLoading: isLoadingServices 
  } = useGetPressingServicesQuery();
  
  const { 
    data: statsData, 
    isLoading: isLoadingStats 
  } = useGetPressingStatsQuery();
  
  const [updateProfile, { isLoading: isUpdating }] = useUpdatePressingProfileMutation();
  
  const [isEditing, setIsEditing] = useState(false);
  
  // Convertir les données backend vers le format attendu par le composant
  const profile: BusinessProfile = profileData ? {
    name: profileData.businessName || 'Mon Pressing',
    description: profileData.description || 'Description de votre pressing',
    address: profileData.address ? 
      `${profileData.address.street}, ${profileData.address.district}, ${profileData.address.city}` :
      'Adresse non renseignée',
    phone: profileData.phone || 'Téléphone non renseigné',
    email: profileData.email || 'Email non renseigné',
    openingHours: profileData.businessHours && profileData.businessHours.length > 0 ?
      profileData.businessHours
        .filter(h => h.isOpen)
        .map(h => `${h.day}: ${h.open}-${h.close}`)
        .join(', ') :
      'Horaires non renseignés',
    services: servicesData && servicesData.length > 0 ?
      servicesData.map((service: PressingService) => service.name || service.nom || 'Service').filter(Boolean) :
      ['Aucun service ajouté'],
    priceRange: servicesData && servicesData.length > 0 ?
      (() => {
        const prices = servicesData.map((service: PressingService) => service.price || service.prix || 0).filter(p => p > 0);
        if (prices.length === 0) return 'Tarifs non définis';
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        return minPrice === maxPrice ? `${minPrice} FCFA` : `${minPrice} - ${maxPrice} FCFA`;
      })() :
      'Tarifs non définis',
    isVerified: profileData.isVerified || false,
    logoUrl: (profileData.photos && profileData.photos.length > 0) ? 
      (typeof profileData.photos[0] === 'string' ? profileData.photos[0] : (profileData.photos[0] as Photo).url) : getLogoPlaceholder(),
    coverImageUrl: (profileData.photos && profileData.photos.length > 1) ? 
      (typeof profileData.photos[1] === 'string' ? profileData.photos[1] : (profileData.photos[1] as Photo).url) : getCoverPlaceholder(),
    stats: {
      rating: typeof profileData.rating === 'object' && profileData.rating?.average 
        ? Number(profileData.rating.average) 
        : (typeof profileData.rating === 'number' ? profileData.rating : 0),
      reviews: typeof profileData.rating === 'object' && profileData.rating?.count 
        ? Number(profileData.rating.count) 
        : (profileData.reviewCount || 0),
      clients: statsData?.activeCustomers || 0,
      orders: statsData?.todayOrders || 0
    },
    specialOffers: [
      { title: 'Offre de bienvenue', description: '-20% sur votre première commande en ligne.' },
      { title: 'Fidélité récompensée', description: 'La 10ème commande est à -50%.' }
    ]
  } : {
    // Valeurs par défaut si pas de données
    name: 'Mon Pressing',
    description: 'Chargement...',
    address: 'Chargement...',
    phone: 'Chargement...',
    email: 'Chargement...',
    openingHours: 'Chargement...',
    services: ['Chargement...'],
    priceRange: 'Chargement...',
    isVerified: false,
    logoUrl: getLogoPlaceholder(),
    coverImageUrl: getCoverPlaceholder(),
    stats: { rating: 0, reviews: 0, clients: 0, orders: 0 },
    specialOffers: []
  };
  
  const [editedProfile, setEditedProfile] = useState(profile);

  const handleUpdateProfile = async () => {
    try {
      // Convertir les données du formulaire vers le format backend
      const updateData = {
        businessName: editedProfile.name,
        description: editedProfile.description,
        phone: editedProfile.phone,
        // Note: email et address ne peuvent pas être modifiés ici
        // Ils nécessitent des endpoints spécifiques
      };
      
      console.log('🔄 Mise à jour profil pressing:', updateData);
      
      await updateProfile(updateData).unwrap();
      
      setIsEditing(false);
      toast.success('🎉 Profil mis à jour avec succès !');
      
      // Recharger les données pour avoir la version la plus récente
      refetch();
    } catch (error: any) {
      console.error('❌ Erreur mise à jour profil:', error);
      toast.error(
        error?.data?.message || 
        'Erreur lors de la mise à jour du profil. Veuillez réessayer.'
      );
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({ ...prev, [name]: value }));
  };

  // Gestion des états de chargement et d'erreur
  if (isLoading || isLoadingServices || isLoadingStats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader size="lg" />
          <p className="mt-4 text-base text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8 max-w-md w-full text-center">
          <div className="text-red-500 mb-6">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2">Erreur de chargement</h2>
            <p className="text-sm sm:text-base text-gray-600">Impossible de charger le profil du pressing.</p>
          </div>
          <button 
            onClick={() => refetch()}
            className="w-full min-h-[44px] bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 focus:bg-blue-700 transition-colors font-medium text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Réessayer le chargement du profil"
          >
            🔄 Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile-First UI/UX 2025 */}
      <header className="bg-white shadow-sm border-b border-gray-200" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <button 
                onClick={() => window.history.back()}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-gray-700 focus:text-gray-700 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-label="Retourner à la page précédente"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <Briefcase className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 flex-shrink-0" aria-hidden="true" />
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate leading-tight">
                Mon Profil Business
              </h1>
            </div>
            
            <button
              onClick={() => { 
                setIsEditing(!isEditing);
                if (!isEditing) setEditedProfile(profile);
              }}
              className="min-h-[44px] flex items-center gap-2 bg-blue-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-blue-700 focus:bg-blue-700 transition-colors font-medium text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={isEditing ? 'Annuler les modifications' : 'Modifier le profil'}
            >
              <Edit className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              <span className="hidden sm:inline">{isEditing ? 'Annuler' : 'Modifier'}</span>
              <span className="sm:hidden">{isEditing ? 'Annuler' : 'Edit'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container - Mobile-First */}
      <main className="max-w-6xl mx-auto px-1 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12" role="main">
        
        {/* Cover Image and Logo - Mobile-First UI/UX 2025 */}
        <section className="relative mb-8 sm:mb-12 lg:mb-16" aria-labelledby="profile-header">
          <div className="h-48 sm:h-64 lg:h-80 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl overflow-hidden shadow-sm">
            <img 
              src={profile.coverImageUrl} 
              alt={`Image de couverture de ${profile.name}`}
              className="w-full h-full object-cover transition-opacity duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = getCoverPlaceholder();
              }}
              loading="lazy"
            />
          </div>
          
          {/* Logo Profile Picture */}
          <div className="absolute -bottom-8 sm:-bottom-12 lg:-bottom-16 left-1/2 -translate-x-1/2">
            <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-white rounded-full border-4 border-white shadow-xl overflow-hidden">
              <img 
                src={profile.logoUrl} 
                alt={`Logo de ${profile.name}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = getLogoPlaceholder();
                }}
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* Profile Name and Verification - Mobile-First Typography */}
        <section className="text-center mb-8 sm:mb-12" aria-labelledby="profile-info">
          <h2 id="profile-info" className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
            {profile.name}
          </h2>
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {profile.isVerified ? (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-full border border-green-200">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                <span className="font-medium text-sm sm:text-base">Profil vérifié</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-full border border-orange-200">
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                <span className="font-medium text-sm sm:text-base">Profil en attente de vérification</span>
              </div>
            )}
          </div>
        </section>

        {/* Stats Grid - Mobile-First UI/UX 2025 */}
        <section className="mb-8 sm:mb-12" aria-labelledby="stats-heading">
          <h3 id="stats-heading" className="sr-only">Statistiques du pressing</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* Rating Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 text-center hover:shadow-md transition-shadow">
              <div className="mb-3">
                <Star className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-yellow-500" aria-hidden="true" />
              </div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                {profile.stats.rating > 0 ? profile.stats.rating.toFixed(1) : '0.0'}
              </div>
              <div className="text-sm sm:text-base text-gray-600">
                ({profile.stats.reviews} avis)
              </div>
            </div>
            
            {/* Clients Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 text-center hover:shadow-md transition-shadow">
              <div className="mb-3">
                <Users className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-blue-500" aria-hidden="true" />
              </div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                {profile.stats.clients}
              </div>
              <div className="text-sm sm:text-base text-gray-600">
                Clients
              </div>
            </div>
            
            {/* Orders Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 text-center hover:shadow-md transition-shadow">
              <div className="mb-3">
                <Package className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-green-500" aria-hidden="true" />
              </div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                {profile.stats.orders}
              </div>
              <div className="text-sm sm:text-base text-gray-600">
                Commandes
              </div>
            </div>
            
            {/* Services Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 text-center hover:shadow-md transition-shadow">
              <div className="mb-3">
                <Briefcase className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-purple-500" aria-hidden="true" />
              </div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                {profile.services.length > 0 && profile.services[0] !== 'Aucun service ajouté' ? profile.services.length : 0}
              </div>
              <div className="text-sm sm:text-base text-gray-600">
                Services
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid - Mobile-First UI/UX 2025 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Left Column - Profile Information */}
          <section className="lg:col-span-2" aria-labelledby="profile-content">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 sm:p-8">
                {isEditing ? (
                  <div className="space-y-6">
                    <h3 id="profile-content" className="text-lg sm:text-xl font-bold text-gray-900 mb-6">Modifier le profil</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'entreprise</label>
                        <input 
                          type="text" 
                          name="name" 
                          value={editedProfile.name} 
                          onChange={handleInputChange} 
                          className="w-full min-h-[44px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                          aria-label="Nom de l'entreprise"
                        />
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea 
                          name="description" 
                          value={editedProfile.description} 
                          onChange={handleInputChange} 
                          rows={4} 
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-vertical"
                          aria-label="Description de l'entreprise"
                        />
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                        <input 
                          type="text" 
                          name="address" 
                          value={editedProfile.address} 
                          onChange={handleInputChange} 
                          className="w-full min-h-[44px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                          aria-label="Adresse de l'entreprise"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                        <input 
                          type="tel" 
                          name="phone" 
                          value={editedProfile.phone} 
                          onChange={handleInputChange} 
                          className="w-full min-h-[44px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                          aria-label="Numéro de téléphone"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input 
                          type="email" 
                          name="email" 
                          value={editedProfile.email} 
                          onChange={handleInputChange} 
                          className="w-full min-h-[44px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                          aria-label="Adresse email"
                        />
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Horaires d'ouverture</label>
                        <input 
                          type="text" 
                          name="openingHours" 
                          value={editedProfile.openingHours} 
                          onChange={handleInputChange} 
                          className="w-full min-h-[44px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                          aria-label="Horaires d'ouverture"
                          placeholder="Ex: Lun-Sam 8h-18h"
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 border-t border-gray-200">
                      <button 
                        onClick={() => setIsEditing(false)} 
                        disabled={isUpdating}
                        className="min-h-[44px] bg-gray-100 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-200 focus:bg-gray-200 disabled:opacity-50 font-medium text-base transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        aria-label="Annuler les modifications"
                      >
                        Annuler
                      </button>
                      <button 
                        onClick={handleUpdateProfile} 
                        disabled={isUpdating} 
                        className="min-h-[44px] bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium text-base transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        aria-label={isUpdating ? 'Sauvegarde en cours' : 'Sauvegarder les modifications'}
                      >
                        {isUpdating && (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                        )}
                        {isUpdating ? 'Sauvegarde...' : 'Sauvegarder'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div>
                      <h3 id="profile-content" className="text-lg sm:text-xl font-bold text-gray-900 mb-4">À propos de nous</h3>
                      <p className="text-base sm:text-lg text-gray-600 leading-relaxed whitespace-pre-wrap">{profile.description}</p>
                    </div>

                    <div className="border-t border-gray-200 pt-8">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">Nos services</h3>
                        <button 
                          onClick={() => window.location.href = '/pressing/services'}
                          className="min-h-[44px] text-blue-600 hover:text-blue-700 focus:text-blue-700 text-sm sm:text-base font-medium flex items-center gap-2 px-3 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          aria-label="Gérer les services du pressing"
                        >
                          <Edit className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                          Gérer les services
                        </button>
                      </div>
                      {profile.services.length > 0 && profile.services[0] !== 'Aucun service ajouté' ? (
                        <div className="flex flex-wrap gap-3">
                          {profile.services.map((service, index) => (
                            <span key={index} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm sm:text-base font-medium border border-blue-200">
                              {service}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" aria-hidden="true" />
                          <p className="text-base sm:text-lg font-medium mb-2">Aucun service ajouté pour le moment</p>
                          <p className="text-sm sm:text-base mb-6">Commencez par ajouter vos premiers services</p>
                          <button 
                            onClick={() => window.location.href = '/pressing/services'}
                            className="min-h-[44px] bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:bg-blue-700 transition-colors font-medium text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            aria-label="Ajouter votre premier service"
                          >
                            Ajouter votre premier service
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-200 pt-8">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">Offres spéciales</h3>
                      {profile.specialOffers.length > 0 ? (
                        <div className="space-y-4">
                          {profile.specialOffers.map((offer, index) => (
                            <div key={index} className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6">
                              <h4 className="font-semibold text-green-900 text-base sm:text-lg mb-2">{offer.title}</h4>
                              <p className="text-sm sm:text-base text-green-700 leading-relaxed">{offer.description}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-base">Aucune offre spéciale pour le moment</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Right Column - Contact & Actions */}
          <aside className="lg:col-span-1 space-y-6" aria-label="Informations de contact et actions">
            
            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Informations de contact</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 mt-1 text-blue-600 flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm sm:text-base text-gray-600 leading-relaxed">{profile.address}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" aria-hidden="true" />
                    <a href={`tel:${profile.phone}`} className="text-sm sm:text-base text-gray-600 hover:text-blue-600 transition-colors">
                      {profile.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" aria-hidden="true" />
                    <a href={`mailto:${profile.email}`} className="text-sm sm:text-base text-gray-600 hover:text-blue-600 transition-colors break-all">
                      {profile.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Hours & Pricing */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Horaires & Tarifs</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 mt-1 text-blue-600 flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm sm:text-base text-gray-600 leading-relaxed">{profile.openingHours}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 mt-1 text-blue-600 flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm sm:text-base text-gray-600 leading-relaxed">{profile.priceRange}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Actions rapides</h3>
                <div className="space-y-3">
                  <button 
                    className="w-full min-h-[44px] bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 focus:bg-blue-700 transition-colors font-medium text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Voir les commandes"
                  >
                    📦 Voir les commandes
                  </button>
                  <button 
                    className="w-full min-h-[44px] bg-gray-100 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-200 focus:bg-gray-200 transition-colors font-medium text-base focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    aria-label="Gérer les avis clients"
                  >
                    ⭐ Gérer les avis
                  </button>
                  <button 
                    className="w-full min-h-[44px] bg-gray-100 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-200 focus:bg-gray-200 transition-colors font-medium text-base focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    aria-label="Voir les statistiques"
                  >
                    📊 Voir les statistiques
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};
