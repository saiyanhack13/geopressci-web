import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Clock, Phone, Calendar, ShoppingCart, Heart, Share2, MessageCircle, CheckCircle, XCircle, Camera, Award } from 'lucide-react';
import { getLogoPlaceholder, getCoverPlaceholder } from '../../utils/placeholders';
import { getPhotoWithFallback } from '../../utils/photoUtils';
import { Pressing, PressingService } from '../../types';
import { useGetPressingByIdQuery, useToggleFavoriteMutation, useGetCurrentUserQuery } from '../../services/api';
import { 
  useGetPressingServicesQuery,
  useGetPressingPhotosQuery,
  useGetBusinessHoursQuery,
  useGetCurrentOpenStatusQuery,
  useGetPublicPressingReviewsQuery,
  useCreatePressingReviewMutation,
  useGetPublicPressingOrdersQuery,
  useGetPublicPressingServicesQuery,
  useGetPublicBusinessHoursQuery
} from '../../services/pressingApi';
import Button from '../../components/ui/Button';
import ServiceSelector, { SelectedItem as ServiceSelectorItem } from '../../components/order/ServiceSelector';
import { timeslotService, TimeSlot } from '../../services/timeslotService';
import BookingCalendar from '../../components/order/BookingCalendar';
import PriceCalculator from '../../components/order/PriceCalculator';
import Loader from '../../components/ui/Loader';
import { toast } from 'react-hot-toast';
import { toLocalISOString, toLocalDateString, createLocalDateTime, formatDateTimeForDisplay } from '../../utils/dateUtils';

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
  
  // Récupérer les données de l'utilisateur connecté
  const { 
    data: currentUser, 
    isLoading: userLoading 
  } = useGetCurrentUserQuery();
  
  // Utiliser les APIs publiques pour les données en temps réel
  const { 
    data: servicesData = [], 
    isLoading: servicesLoading 
  } = useGetPublicPressingServicesQuery(id || '', { skip: !id });

  const { 
    data: reviewsData, 
    isLoading: reviewsLoading 
  } = useGetPublicPressingReviewsQuery(id || '', { skip: !id });

  const { 
    data: ordersData, 
    isLoading: ordersLoading 
  } = useGetPublicPressingOrdersQuery(id || '', { skip: !id });

  const { 
    data: businessHours, 
    isLoading: hoursLoading 
  } = useGetPublicBusinessHoursQuery(id || '', { skip: !id });
  
  const { 
    data: currentOpenStatus 
  } = useGetCurrentOpenStatusQuery(undefined, { 
    skip: !id,
    pollingInterval: 60000 // Mise à jour toutes les minutes
  });

  // Mutation pour créer un avis
  const [createReview, { isLoading: isCreatingReview }] = useCreatePressingReviewMutation();

  const [toggleFavorite] = useToggleFavoriteMutation();

  // États locaux
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'reviews' | 'gallery' | 'orders' | 'hours'>('services');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [collectionDateTime, setCollectionDateTime] = useState<{ date: Date; time: string } | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  
  // États pour les créneaux temps réel
  const [availableTimeslots, setAvailableTimeslots] = useState<TimeSlot[]>([]);
  const [timeslotsLoading, setTimeslotsLoading] = useState(false);
  const [lastTimeslotUpdate, setLastTimeslotUpdate] = useState<Date>(new Date());

  // Fonction pour recharger les créneaux disponibles en temps réel
  const loadAvailableTimeslots = async () => {
    if (!id) return;
    
    setTimeslotsLoading(true);
    try {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      const response = await timeslotService.getAvailableSlots(id, {
        startDate: today.toISOString().split('T')[0],
        endDate: nextWeek.toISOString().split('T')[0],
        includeUnavailable: false
      });
      
      setAvailableTimeslots(response.slots);
      setLastTimeslotUpdate(new Date());
      
      console.log('🕐 Créneaux disponibles rechargés:', response.slots.length);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des créneaux:', error);
    } finally {
      setTimeslotsLoading(false);
    }
  };
  
  // Recharger les créneaux au montage et périodiquement
  React.useEffect(() => {
    if (id) {
      loadAvailableTimeslots();
      
      // Recharger toutes les 30 secondes pour avoir les créneaux en temps réel
      const interval = setInterval(loadAvailableTimeslots, 30000);
      return () => clearInterval(interval);
    }
  }, [id]);

  // États pour les avis
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

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
      
      // Informations de créneau depuis BookingCalendar - Utiliser les utilitaires de date
      collectionDateTime: toLocalISOString(createLocalDateTime(collectionDateTime.date, collectionDateTime.time)),
      deliveryDateTime: toLocalISOString(createLocalDateTime(collectionDateTime.date, collectionDateTime.time)), // Par défaut même jour
      collectionDate: toLocalDateString(collectionDateTime.date),
      collectionTime: collectionDateTime.time,
      
      // Informations détaillées du créneau
      timeSlotInfo: {
        startTime: collectionDateTime.time,
        endTime: '18:00', // Heure de fin par défaut (sera calculée selon le créneau)
        type: 'regular', // Type par défaut
        capacity: 10, // Capacité par défaut
        isDefault: true, // Marquer comme créneau par défaut si pas d'infos spécifiques
        period: collectionDateTime.time < '12:00' ? 'morning' : 'afternoon'
      },
      
      // Informations du pressing
      pressingId,
      pressingName: pressingData.businessName,
      pressingAddress: pressingData.address || 'Adresse non disponible',
      
      // Informations client (récupérées depuis l'utilisateur connecté)
      customerInfo: {
        firstName: currentUser?.prenom || currentUser?.firstName || '',
        lastName: currentUser?.nom || currentUser?.lastName || '',
        phoneNumber: currentUser?.telephone || currentUser?.phone || '',
        email: currentUser?.email || ''
      },
      
      // Adresse de livraison par défaut
      deliveryAddress: {
        fullAddress: pressingData.address || 'Adresse non disponible',
        instructions: '',
        coordinates: {
          lat: 0,
          lng: 0
        }
      },
      
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

    console.log('📅 Pré-navigation - Données de commande complètes:', {
      collectionDateTime: {
        original: collectionDateTime,
        selectedDate: toLocalDateString(collectionDateTime.date),
        selectedTime: collectionDateTime.time,
        displayText: formatDateTimeForDisplay(collectionDateTime.date, collectionDateTime.time),
        isoString: orderData.collectionDateTime,
        type: typeof collectionDateTime
      },
      timeSlotInfo: orderData.timeSlotInfo,
      selectedItems: orderData.selectedItems.length,
      pressingId: orderData.pressingId,
      customerInfo: orderData.customerInfo,
      deliveryAddress: orderData.deliveryAddress
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
      const phone = pressingData.phone.startsWith('+') ? pressingData.phone : `+225${pressingData.phone}`;
      const message = encodeURIComponent(`Bonjour, je souhaite prendre rendez-vous pour un service de pressing.`);
      window.open(`https://wa.me/${phone.replace('+', '')}?text=${message}`, '_blank');
    }
  };

  // Fonction pour soumettre un avis
  const handleSubmitReview = async () => {
    if (!id || !reviewComment.trim()) {
      toast.error('Veuillez saisir un commentaire');
      return;
    }

    try {
      await createReview({
        pressingId: id,
        rating: reviewRating,
        comment: reviewComment.trim()
      }).unwrap();
      
      toast.success('✅ Votre avis a été publié avec succès !');
      setShowReviewForm(false);
      setReviewComment('');
      setReviewRating(5);
    } catch (error: any) {
      console.error('Erreur lors de la création de l\'avis:', error);
      toast.error(error?.data?.message || 'Erreur lors de la publication de l\'avis');
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
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab('services')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'services'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🛍️ Services & Réservation
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'reviews'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ⭐ Avis clients {reviewsData?.total ? `(${reviewsData.total})` : ''}
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📦 Commandes {ordersData?.totalOrders ? `(${ordersData.totalOrders})` : ''}
              </button>
              <button
                onClick={() => setActiveTab('hours')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'hours'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🕒 Horaires
              </button>
              <button
                onClick={() => setActiveTab('gallery')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'gallery'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📷 Galerie
              </button>
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
                      console.log('🔧 PressingDetailPage - ServiceSelector items reçus:', items);
                      console.log('🔧 PressingDetailPage - ServicesData structure:', servicesData);
                      
                      // Vérifier que chaque item a un serviceId unique
                      const uniqueServiceIds = new Set(items.map(item => item.serviceId));
                      if (uniqueServiceIds.size !== items.length) {
                        console.warn('⚠️ ATTENTION: Des services ont des IDs dupliqués!');
                        items.forEach((item, index) => {
                          console.warn(`Service ${index}:`, {
                            serviceId: item.serviceId,
                            name: item.name,
                            quantity: item.quantity
                          });
                        });
                      }
                      
                      const mappedItems: SelectedItem[] = items.map((item, index) => {
                        // Utiliser directement le serviceId du ServiceSelector (qui est maintenant fiable)
                        const serviceId = item.serviceId;
                        
                        // Trouver le service correspondant pour validation
                        const matchingService = servicesData.find(s => 
                          (s._id === serviceId) || 
                          (s.id === serviceId) ||
                          (s.name === item.name && s.price === item.price)
                        );
                        
                        console.log(`🔧 Mapping service ${index + 1}:`, { 
                          serviceId,
                          name: item.name,
                          price: item.price,
                          quantity: item.quantity,
                          matchingServiceFound: !!matchingService,
                          matchingServiceId: matchingService?._id || matchingService?.id
                        });
                        
                        return {
                          serviceId,
                          serviceName: item.name,
                          price: item.price,
                          quantity: item.quantity
                        };
                      });
                      
                      console.log('🔧 PressingDetailPage - Services mappés individuellement:', mappedItems);
                      console.log('🔧 PressingDetailPage - Nombre de services sélectionnés:', mappedItems.length);
                      
                      // Vérifier l'individualisation
                      mappedItems.forEach((item, index) => {
                        console.log(`✅ Service ${index + 1} individualisé:`, {
                          id: item.serviceId,
                          nom: item.serviceName,
                          prix: item.price,
                          quantité: item.quantity,
                          sousTotal: item.price * item.quantity
                        });
                      });
                      
                      setSelectedItems(mappedItems);
                    }} 
                  />
                  {/* Indicateur de créneaux temps réel */}
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Créneaux disponibles: {availableTimeslots.length}
                        </span>
                        {timeslotsLoading && (
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                      <span className="text-xs text-blue-600">
                        Dernière mise à jour: {lastTimeslotUpdate.toLocaleTimeString()}
                      </span>
                    </div>
                    {availableTimeslots.length > 0 && (
                      <div className="mt-2 text-xs text-blue-700">
                        🚀 Nouveaux créneaux disponibles pour réservation immédiate!
                      </div>
                    )}
                  </div>
                  
                  <BookingCalendar 
                    onDateTimeChange={(dateTime, selectedSlot) => {
                      if (selectedSlot) {
                        setCollectionDateTime({
                          date: dateTime,
                          time: selectedSlot.startTime
                        });
                      } else {
                        setCollectionDateTime({
                          date: dateTime,
                          time: '09:00'
                        });
                      }
                      // Recharger les créneaux après sélection
                      loadAvailableTimeslots();
                    }} 
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
                {/* En-tête des avis avec bouton pour laisser un avis */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">Avis clients</h3>
                    {reviewsData && (
                      <p className="text-gray-600">
                        {reviewsData.total} avis • Note moyenne: {reviewsData.averageRating.toFixed(1)}/5 ⭐
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    ✍️ Laisser un avis
                  </Button>
                </div>

                {/* Formulaire pour laisser un avis */}
                {showReviewForm && (
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Votre avis sur ce pressing</h4>
                    
                    {/* Sélection de la note */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setReviewRating(star)}
                            className={`text-2xl ${
                              star <= reviewRating ? 'text-yellow-500' : 'text-gray-300'
                            } hover:text-yellow-400 transition-colors`}
                          >
                            ⭐
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Commentaire */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire</label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Partagez votre expérience avec ce pressing..."
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                      />
                    </div>

                    {/* Boutons */}
                    <div className="flex space-x-3">
                      <Button
                        onClick={handleSubmitReview}
                        disabled={isCreatingReview || !reviewComment.trim()}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isCreatingReview ? '⏳ Publication...' : '✅ Publier l\'avis'}
                      </Button>
                      <Button
                        onClick={() => setShowReviewForm(false)}
                        variant="outline"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}

                {/* Liste des avis */}
                {reviewsLoading ? (
                  <div className="text-center py-8">
                    <Loader />
                    <p className="mt-2 text-gray-600">Chargement des avis...</p>
                  </div>
                ) : reviewsData?.reviews?.length ? (
                  <div className="space-y-4">
                    {reviewsData.reviews.map((review) => (
                      <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h5 className="font-semibold text-gray-800">{review.customerName}</h5>
                            <div className="flex items-center space-x-2">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span
                                    key={star}
                                    className={star <= review.rating ? 'text-yellow-500' : 'text-gray-300'}
                                  >
                                    ⭐
                                  </span>
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-3">{review.comment}</p>
                        {review.response && (
                          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                            <p className="text-sm font-medium text-blue-800 mb-1">Réponse du pressing :</p>
                            <p className="text-blue-700">{review.response}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Aucun avis pour le moment</h4>
                    <p className="text-gray-600">Soyez le premier à laisser un avis sur ce pressing !</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-800">Commandes récentes</h3>
                  {ordersData && (
                    <div className="text-sm text-gray-600">
                      {ordersData.totalOrders} commandes totales • {ordersData.completedOrders} terminées
                    </div>
                  )}
                </div>

                {ordersLoading ? (
                  <div className="text-center py-8">
                    <Loader />
                    <p className="mt-2 text-gray-600">Chargement des commandes...</p>
                  </div>
                ) : ordersData?.recentOrders?.length ? (
                  <div className="space-y-4">
                    {ordersData.recentOrders.map((order) => (
                      <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h5 className="font-semibold text-gray-800">Commande #{order.orderNumber}</h5>
                            <p className="text-sm text-gray-600">
                              {order.customerName && `Client: ${order.customerName} • `}
                              {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg text-green-600">{order.totalAmount} FCFA</p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === 'livree' ? 'bg-green-100 text-green-800' :
                              order.status === 'en_traitement' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Aucune commande récente</h4>
                    <p className="text-gray-600">Les commandes de ce pressing apparaitront ici</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'hours' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-800">Horaires d'ouverture</h3>
                  {currentOpenStatus && (
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      currentOpenStatus.isOpen 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {currentOpenStatus.isOpen ? '✅ Ouvert maintenant' : '❌ Fermé maintenant'}
                    </div>
                  )}
                </div>

                {hoursLoading ? (
                  <div className="text-center py-8">
                    <Loader />
                    <p className="mt-2 text-gray-600">Chargement des horaires...</p>
                  </div>
                ) : businessHours?.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {businessHours.map((dayHours) => (
                      <div key={dayHours.day} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <h5 className="font-semibold text-gray-800 capitalize">
                            {dayHours.day === 'monday' ? 'Lundi' :
                             dayHours.day === 'tuesday' ? 'Mardi' :
                             dayHours.day === 'wednesday' ? 'Mercredi' :
                             dayHours.day === 'thursday' ? 'Jeudi' :
                             dayHours.day === 'friday' ? 'Vendredi' :
                             dayHours.day === 'saturday' ? 'Samedi' :
                             dayHours.day === 'sunday' ? 'Dimanche' : dayHours.day}
                          </h5>
                          <div className="text-right">
                            {dayHours.isClosed ? (
                              <span className="text-red-600 font-medium">Fermé</span>
                            ) : (
                              <div>
                                <p className="text-gray-800 font-medium">
                                  {dayHours.open} - {dayHours.close}
                                </p>
                                {dayHours.specialHours && (
                                  <p className="text-sm text-blue-600">
                                    Spécial: {dayHours.specialHours.open} - {dayHours.specialHours.close}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Horaires non disponibles</h4>
                    <p className="text-gray-600">Les horaires d'ouverture ne sont pas encore définis</p>
                  </div>
                )}

                {/* Informations supplémentaires */}
                {currentOpenStatus?.nextChange && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-blue-800">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Prochaine ouverture/fermeture: {new Date(currentOpenStatus.nextChange).toLocaleString('fr-FR')}
                    </p>
                  </div>
                )}
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
