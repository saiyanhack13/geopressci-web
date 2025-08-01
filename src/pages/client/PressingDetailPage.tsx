import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Clock, Phone, Calendar, ShoppingCart, Heart, Share2, MessageCircle, CheckCircle, XCircle, Camera, Award } from 'lucide-react';
import { getLogoPlaceholder, getCoverPlaceholder } from '../../utils/placeholders';
import { getPhotoWithFallback } from '../../utils/photoUtils';
import { Pressing, PressingService } from '../../types';
import { useGetPressingByIdQuery, useGetPressingServicesQuery, useToggleFavoriteMutation } from '../../services/api';
import Button from '../../components/ui/Button';
import ServiceSelector, { SelectedItem as ServiceSelectorItem } from '../../components/order/ServiceSelector';
import BookingCalendar from '../../components/order/BookingCalendar';
import PriceCalculator from '../../components/order/PriceCalculator';
import Loader from '../../components/ui/Loader';
import { toast } from 'react-hot-toast';

// Types pour les articles sélectionnés
interface SelectedItem {
  serviceId: string;
  serviceName: string;
  price: number;
  quantity: number;
}

const availableTimeSlots = ['09:00', '11:00', '14:00', '16:00'];

const PressingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Hooks API pour récupérer les données en temps réel
  const { 
    data: pressingData, 
    isLoading: pressingLoading, 
    error: pressingError 
  } = useGetPressingByIdQuery(id || '', { skip: !id });
  
  const { 
    data: servicesData = [], 
    isLoading: servicesLoading 
  } = useGetPressingServicesQuery(id || '', { skip: !id });

  const [toggleFavorite] = useToggleFavoriteMutation();

  // États locaux
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'reviews' | 'gallery'>('services');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [collectionDateTime, setCollectionDateTime] = useState<Date | undefined>();

  const handleBookingConfirmation = () => {
    if (!isBookingReady || !pressingData?.id) {
      toast.error('Veuillez sélectionner des services et une date de collecte');
      return;
    }

    // Vérifier que nous avons des articles sélectionnés et une date
    if (selectedItems.length === 0 || !collectionDateTime) {
      toast.error('Veuillez sélectionner au moins un service et une date de collecte');
      return;
    }

    // S'assurer que l'ID est une chaîne de caractères
    const pressingId = String(pressingData.id);
    
    // Préparer les données pour la page de commande avec TOUTES les informations des services
    const orderData = {
      selectedItems: selectedItems.map(item => {
        // Récupérer le service complet depuis les données API
        const fullService = servicesData.find(s => s._id === item.serviceId);
        
        if (!fullService) {
          console.warn(`⚠️ Service non trouvé pour ID: ${item.serviceId}`);
          return {
            serviceId: item.serviceId,
            name: 'Service non trouvé',
            price: item.price,
            quantity: item.quantity
          };
        }
        
        // Retourner TOUTES les informations du service
        return {
          // Informations de base
          serviceId: item.serviceId,
          quantity: item.quantity,
          
          // Informations complètes du service depuis la BD
          nom: fullService.nom || fullService.name || 'Service',
          description: fullService.description || '',
          prix: fullService.prix || fullService.price || item.price,
          categorie: fullService.categorie || fullService.category || 'Général',
          dureeMoyenne: fullService.dureeMoyenne || fullService.duration || 0,
          disponible: fullService.disponible !== undefined ? fullService.disponible : true,
          validite: fullService.validite || 30,
          
          // Options et images
          options: fullService.options || [],
          images: fullService.images || [],
          
          // Métadonnées
          createdAt: fullService.createdAt,
          updatedAt: fullService.updatedAt,
          
          // Pour compatibilité avec l'ancien format
          name: fullService.nom || fullService.name || 'Service',
          price: fullService.prix || fullService.price || item.price
        };
      }),
      
      // Convertir la date en ISO string pour la sérialisation
      collectionDateTime: collectionDateTime.toISOString(),
      
      // Informations du pressing
      pressingId,
      pressingName: pressingData.businessName,
      pressingAddress: pressingData.address || 'Adresse non disponible',
      
      // Informations supplémentaires pour la traçabilité
      metadata: {
        totalServices: selectedItems.length,
        totalDuration: selectedItems.reduce((total, item) => {
          const service = servicesData.find(s => s._id === item.serviceId);
          const duration = Number(service?.dureeMoyenne || service?.duration || 0);
          const quantity = Number(item.quantity) || 1;
          return total + (duration * quantity);
        }, 0),
        categories: Array.from(new Set(selectedItems.map(item => {
          const service = servicesData.find(s => s._id === item.serviceId);
          return service?.categorie || service?.category || 'Général';
        }))),
        sourcePageData: {
          pressingData: {
            id: pressingData.id,
            businessName: pressingData.businessName,
            address: pressingData.address,
            phone: pressingData.phone
          },
          servicesCount: servicesData.length,
          selectedCount: selectedItems.length
        }
      }
    };

    console.log('📅 Pré-navigation - Données de commande:', {
      collectionDateTime: {
        original: collectionDateTime,
        isoString: collectionDateTime.toISOString(),
        type: typeof collectionDateTime,
        isDate: collectionDateTime instanceof Date
      },
      selectedItems: orderData.selectedItems,
      pressingId: orderData.pressingId
    });
    
    // Utiliser la navigation avec state
    console.log('🔄 Navigation vers la page de commande...');
    navigate(
      `/client/orders/create?pressing=${encodeURIComponent(pressingId)}`,
      { 
        state: orderData, 
        replace: false 
      }
    );
    console.log('✅ Navigation effectuée');
  };

  const handleFavoriteToggle = async () => {
    if (!pressingData?.id) return;
    
    try {
      await toggleFavorite(pressingData.id).unwrap();
      setIsFavorite(!isFavorite);
      toast.success(isFavorite ? ' Retiré des favoris' : ' Ajouté aux favoris');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour des favoris');
    }
  };

  const handleShare = async () => {
    if (navigator.share && pressingData) {
      try {
        await navigator.share({
          title: pressingData.businessName,
          text: `Découvrez ${pressingData.businessName} sur Geopressci`,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback pour les navigateurs qui ne supportent pas Web Share API
        navigator.clipboard.writeText(window.location.href);
        toast.success(' Lien copié dans le presse-papiers');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(' Lien copié dans le presse-papiers');
    }
  };

  const handleCall = () => {
    if (pressingData?.phone) {
      const phoneNumber = pressingData.phone.startsWith('+') ? pressingData.phone : `+225${pressingData.phone}`;
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  const handleWhatsApp = () => {
    if (pressingData?.phone) {
      const phoneNumber = pressingData.phone.replace(/[^0-9]/g, '');
      const message = encodeURIComponent(`Bonjour, je suis intéressé par les services de ${pressingData.businessName}`);
      window.open(`https://wa.me/225${phoneNumber}?text=${message}`, '_blank');
    }
  };

  const isBookingReady = selectedItems.length > 0 && collectionDateTime !== undefined;

  // États de chargement et d'erreur
  if (pressingLoading || servicesLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  if (pressingError) {
    return (
      <div className="text-center py-16">
        <div className="text-red-500 mb-4">Erreur lors du chargement du pressing</div>
        <Button onClick={() => window.location.reload()}>Réessayer</Button>
      </div>
    );
  }

  if (!pressingData) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-500 mb-4">Pressing non trouvé</div>
        <Button onClick={() => navigate('/client/search')}>Retour à la recherche</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section avec image et informations principales */}
      <div className="relative">
        {/* Image de couverture */}
        <div className="h-64 md:h-80 relative overflow-hidden">
          <img 
            src={getPhotoWithFallback(pressingData.photos, 1, () => getCoverPlaceholder())}
            alt="Couverture du pressing" 
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = getCoverPlaceholder();
            }}
          />
          <div className="absolute inset-0 bg-black/30"></div>
          
          {/* Boutons d'action */}
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleFavoriteToggle}
              className="bg-white/90 backdrop-blur-sm hover:bg-white"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleShare}
              className="bg-white/90 backdrop-blur-sm hover:bg-white"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </Button>
          </div>
          
          {/* Photo de profil */}
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl border-4 border-white bg-white shadow-lg overflow-hidden">
              <img 
                src={getPhotoWithFallback(pressingData.photos, 0, () => getLogoPlaceholder())}
                alt={`Logo de ${pressingData.businessName}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = getLogoPlaceholder();
                }}
              />
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl p-6 mt-12 md:mt-16">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{pressingData.businessName}</h1>
                <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
                  <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
                    <Star className="w-5 h-5 text-yellow-500 fill-current mr-1" />
                    <span className="font-medium">{(typeof pressingData.rating === 'object' ? (pressingData.rating as any)?.average || 0 : pressingData.rating || 0).toFixed(1)}</span>
                    <span className="text-sm ml-1">({typeof pressingData.rating === 'object' ? (pressingData.rating as any)?.count || 0 : 0} avis)</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-1 text-blue-600" />
                    <p className="text-gray-600">
                      {(() => {
                        const address = pressingData.address;
                        if (typeof address === 'string') {
                          return address;
                        }
                        
                        try {
                          // Try to parse if it's a JSON string
                          const parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
                          if (parsedAddress && typeof parsedAddress === 'object') {
                            const parts = [
                              parsedAddress.street,
                              parsedAddress.city,
                              parsedAddress.zipCode,
                              parsedAddress.country
                            ].filter(Boolean);
                            return parts.join(', ');
                          }
                          return address;
                        } catch (e) {
                          return address || 'Adresse non disponible';
                        }
                      })()}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-1 text-green-600" />
                    <p className="text-gray-600">
                      {pressingData.openingHours && pressingData.openingHours.length > 0
                        ? `Aujourd'hui: ${pressingData.openingHours[0].open} - ${pressingData.openingHours[0].close}`
                        : 'Horaires non disponibles'}
                    </p>
                  </div>
                </div>
                
                {/* Badges et statuts */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Ouvert maintenant
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    Livraison gratuite
                  </span>
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    Pressing certifié
                  </span>
                </div>
              </div>
              
              {/* Actions rapides */}
              <div className="flex md:flex-col gap-2">
                <Button onClick={handleCall} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                  <Phone className="w-4 h-4" />
                  Appeler
                </Button>
                <Button onClick={handleWhatsApp} variant="outline" className="flex items-center gap-2 border-green-600 text-green-600 hover:bg-green-50">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="container mx-auto px-4 mt-8">
        <div className="bg-white rounded-xl shadow-lg">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { id: 'services', label: ' Services & Réservation', count: servicesData.length },
                { id: 'reviews', label: ' Avis clients', count: typeof pressingData.rating === 'object' ? (pressingData.rating as any)?.count || 0 : 0 },
                { id: 'gallery', label: ' Galerie', count: pressingData.photos?.length || 0 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 text-sm bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'services' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Colonne principale : Services et Booking */}
                <div className="lg:col-span-2 space-y-8">
                  <ServiceSelector 
                    key={`service-selector-${pressingData.id}`}
                    services={servicesData} 
                    onSelectionChange={(items: ServiceSelectorItem[]) => {
                      console.log('🔧 ServiceSelector items reçus:', items);
                      console.log('🔧 ServicesData structure:', servicesData);
                      
                      const mappedItems: SelectedItem[] = items.map((item, index) => {
                        // Trouver le service correspondant dans servicesData pour récupérer le vrai ID
                        const matchingService = servicesData.find(s => 
                          s.name === item.name && s.price === item.price
                        );
                        
                        const serviceId = matchingService?._id || 
                                         matchingService?.id || 
                                         item.serviceId || 
                                         (item as any).id || 
                                         `fallback-${index}`;
                        
                        console.log('🔧 Mapping item:', { 
                          original: item, 
                          matchingService, 
                          finalServiceId: serviceId 
                        });
                        
                        return {
                          serviceId,
                          serviceName: item.name,
                          price: item.price,
                          quantity: item.quantity
                        };
                      });
                      console.log('🔧 Mapped items:', mappedItems);
                      setSelectedItems(mappedItems);
                    }} 
                  />
                  <BookingCalendar 
                    onDateTimeChange={setCollectionDateTime} 
                    availableTimeSlots={availableTimeSlots}
                    pressingId={pressingData.id}
                  />
                </div>

                {/* Colonne latérale : Résumé et Paiement */}
                <aside className="lg:col-span-1">
                  <div className="sticky top-24 space-y-4">
                    <PriceCalculator selectedItems={selectedItems.map(item => ({
          serviceId: item.serviceId,
          name: item.serviceName,
          price: item.price,
          quantity: item.quantity
        }))} />
                    <Button 
                      size="lg" 
                      className="w-full bg-blue-600 hover:bg-blue-700" 
                      disabled={!isBookingReady} 
                      onClick={handleBookingConfirmation}
                    >
                      {isBookingReady ? '✅ Confirmer la réservation' : '📋 Sélectionnez vos services'}
                    </Button>
                    {!isBookingReady && (
                      <p className="text-sm text-center text-gray-500">
                        Veuillez choisir au moins un service et un créneau
                      </p>
                    )}
                    
                    {/* Informations de contact */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-3">📞 Contact direct</h4>
                      <div className="space-y-2">
                        <button 
                          onClick={handleCall}
                          className="w-full text-left p-2 hover:bg-gray-100 rounded flex items-center gap-2"
                        >
                          <Phone className="w-4 h-4 text-green-600" />
                          <span className="text-sm">{pressingData.phone ? (pressingData.phone.startsWith('+') ? pressingData.phone : `+225 ${pressingData.phone}`) : 'Non disponible'}</span>
                        </button>
                        <button 
                          onClick={handleWhatsApp}
                          className="w-full text-left p-2 hover:bg-gray-100 rounded flex items-center gap-2"
                        >
                          <MessageCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">WhatsApp Business</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <Star className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Avis clients</h3>
                  <p className="text-gray-600">Les avis clients seront bientôt disponibles</p>
                </div>
              </div>
            )}

            {activeTab === 'gallery' && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Galerie photos</h3>
                  <p className="text-gray-600">Les photos du pressing seront bientôt disponibles</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PressingDetailPage;
