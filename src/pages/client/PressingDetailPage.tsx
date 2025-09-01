import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Clock, Phone, Calendar, ShoppingCart, Heart, Share2, MessageCircle, CheckCircle, XCircle, Camera, Award, Send, Package, User, CreditCard, Truck } from 'lucide-react';
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
import CustomerReviews from '../../components/reviews/CustomerReviews';
import PhotoGallery from '../../components/pressing/PhotoGallery';
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

  // Fonctions pour contacter directement le pressing
  const handleCall = () => {
    if (!pressingData?.phone) {
      toast.error('Numéro de téléphone non disponible');
      return;
    }
    
    // Nettoyer et formater le numéro
    const cleanPhone = pressingData.phone.replace(/[^+\d]/g, '');
    const phoneUrl = `tel:${cleanPhone}`;
    
    window.location.href = phoneUrl;
  };

  const handleDirectWhatsApp = () => {
    if (!pressingData?.phone) {
      toast.error('Numéro WhatsApp non disponible');
      return;
    }
    
    // Nettoyer et formater le numéro pour WhatsApp
    let phone = pressingData.phone.replace(/[^\d]/g, '');
    
    // Ajouter le code pays si nécessaire (225 pour la Côte d'Ivoire)
    if (!phone.startsWith('225') && phone.length === 8) {
      phone = '225' + phone;
    }
    
    // Message de contact initial
    const message = encodeURIComponent(
      `Bonjour ${pressingData.businessName || 'pressing'} 👋\n\n` +
      `Je souhaiterais avoir des informations sur vos services.\n\n` +
      `Merci !`
    );
    
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
    
    // Ouvrir dans un nouvel onglet
    window.open(whatsappUrl, '_blank');
  };

  // États pour la commande WhatsApp
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: currentUser?.prenom ? `${currentUser.prenom} ${currentUser.nom || ''}`.trim() : '',
    phone: currentUser?.telephone || '',
    address: ''
  });

  // Frais de service par défaut
  const COLLECTION_FEE = 500; // Frais de collecte fixe
  const DELIVERY_FEE = 1000;   // Frais de livraison (négociable)
  
  // États pour les options de service
  const [includeCollection, setIncludeCollection] = useState(true); // Collecte activée par défaut
  const [includeDelivery, setIncludeDelivery] = useState(true);     // Livraison activée par défaut

  // Générer le message WhatsApp automatiquement
  useEffect(() => {
    if (selectedItems.length > 0 && collectionDateTime && collectionDateTime.date) {
      const services = selectedItems.map(item => 
        `• ${item.serviceName} (x${item.quantity}) - ${item.price * item.quantity} FCFA`
      ).join('\n');
      
      const subtotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Calculer les frais selon les options sélectionnées
      const collectionCost = includeCollection ? COLLECTION_FEE : 0;
      const deliveryCost = includeDelivery ? DELIVERY_FEE : 0;
      const totalWithFees = subtotal + collectionCost + deliveryCost;
      
      const dateStr = collectionDateTime.date.toLocaleDateString('fr-FR');
      
      // Construire le message selon les options choisies
      let feesSection = '';
      if (collectionCost > 0) {
        feesSection += `🚚 *Frais de collecte:* ${COLLECTION_FEE} FCFA (fixe)\n`;
      }
      if (deliveryCost > 0) {
        feesSection += `🏠 *Frais de livraison:* ${DELIVERY_FEE} FCFA (négociable)\n`;
      }
      
      // Déterminer le mode de service
      let serviceMode = '';
      if (includeCollection && includeDelivery) {
        serviceMode = '🔄 *Mode:* Collecte + Livraison';
      } else if (includeCollection && !includeDelivery) {
        serviceMode = '📦 *Mode:* Collecte uniquement (à récupérer au pressing)';
      } else if (!includeCollection && includeDelivery) {
        serviceMode = '🏠 *Mode:* Livraison uniquement (à déposer au pressing)';
      } else {
        serviceMode = '🏪 *Mode:* Dépôt et récupération au pressing';
      }
      
      // Instructions de localisation selon le mode de service
      let locationInstructions = '';
      if (includeCollection || includeDelivery) {
        locationInstructions = `\n📍 *IMPORTANT - LOCALISATION:*\n`;
        
        if (includeCollection && includeDelivery) {
          locationInstructions += `🔄 *Pour la collecte ET la livraison:*\n` +
            `• Partagez votre localisation exacte en temps réel\n` +
            `• Utilisez le bouton "📍 Localisation" de WhatsApp\n` +
            `• Activez le partage en temps réel pendant 15-30 min\n` +
            `• Confirmez l'adresse de livraison si différente\n\n`;
        } else if (includeCollection) {
          locationInstructions += `📦 *Pour la collecte:*\n` +
            `• Partagez votre localisation exacte en temps réel\n` +
            `• Utilisez le bouton "📍 Localisation" de WhatsApp\n` +
            `• Activez le partage en temps réel pendant 15-30 min\n` +
            `• Soyez disponible à l'heure convenue\n\n`;
        } else if (includeDelivery) {
          locationInstructions += `🏠 *Pour la livraison:*\n` +
            `• Partagez votre localisation exacte de livraison\n` +
            `• Utilisez le bouton "📍 Localisation" de WhatsApp\n` +
            `• Activez le partage en temps réel pendant 15-30 min\n` +
            `• Confirmez si l'adresse de livraison est différente\n\n`;
        }
        
        locationInstructions += `💡 *Comment partager votre localisation:*\n` +
          `1️⃣ Cliquez sur le bouton "📎" ou "+" dans WhatsApp\n` +
          `2️⃣ Sélectionnez "📍 Localisation"\n` +
          `3️⃣ Choisissez "Partager la localisation en temps réel"\n` +
          `4️⃣ Sélectionnez la durée (15-30 minutes recommandées)\n` +
          `5️⃣ Confirmez le partage\n\n`;
      }
      
      const message = `🧺 *NOUVELLE COMMANDE PRESSING*\n\n` +
        `👤 *Client:* ${customerInfo.name}\n` +
        `📱 *Téléphone:* ${customerInfo.phone}\n` +
        `📍 *Adresse:* ${customerInfo.address}\n\n` +
        `🏪 *Pressing:* ${pressingData?.businessName}\n\n` +
        `${serviceMode}\n\n` +
        `📋 *Services demandés:*\n${services}\n\n` +
        `💰 *Sous-total services:* ${subtotal} FCFA\n` +
        feesSection +
        `💳 *TOTAL ${deliveryCost > 0 ? 'ESTIMÉ' : 'FINAL'}:* ${totalWithFees} FCFA\n\n` +
        `📅 *Date ${includeCollection ? 'de collecte' : 'de dépôt'} souhaitée:* ${dateStr} à ${collectionDateTime.time}\n` +
        locationInstructions +
        (deliveryCost > 0 ? `💬 *Note:* Les frais de livraison peuvent être négociés selon la distance.\n\n` : '') +
        `✅ *Merci de confirmer la disponibilité et les détails de cette commande.*`;
      
      setWhatsappMessage(message);
    }
  }, [selectedItems, collectionDateTime, customerInfo, pressingData, includeCollection, includeDelivery]);

  const handleWhatsApp = () => {
    if (selectedItems.length === 0) {
      toast.error('Veuillez sélectionner au moins un service');
      return;
    }
    setShowWhatsAppModal(true);
  };

  const handleSendWhatsApp = () => {
    if (!pressingData?.phone) {
      toast.error('Numéro de téléphone du pressing non disponible');
      return;
    }
    
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      toast.error('Veuillez remplir toutes vos informations');
      return;
    }
    
    // Vérifier qu'au moins une option de service est sélectionnée
    if (!includeCollection && !includeDelivery) {
      toast.error('Veuillez sélectionner au moins une option de service (collecte ou livraison)');
      return;
    }

    const phone = pressingData.phone.startsWith('+') ? pressingData.phone : `+225${pressingData.phone}`;
    
    const encodedMessage = encodeURIComponent(whatsappMessage);
    window.open(`https://wa.me/${phone.replace('+', '')}?text=${encodedMessage}`, '_blank');
    
    setShowWhatsAppModal(false);
    
    // Message de succès personnalisé selon les options
    let successMessage = '🚀 Commande envoyée sur WhatsApp!';
    if (includeCollection && includeDelivery) {
      successMessage += ' (Collecte + Livraison)';
    } else if (includeCollection) {
      successMessage += ' (Collecte uniquement)';
    } else if (includeDelivery) {
      successMessage += ' (Livraison uniquement)';
    }
    
    toast.success(successMessage);
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
                <Button onClick={handleDirectWhatsApp} variant="outline" className="flex items-center gap-2 border-green-600 text-green-600 hover:bg-green-50">
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
                    {/* Résumé de commande avec frais */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        Résumé de la commande
                      </h3>
                      
                      {selectedItems.length > 0 ? (
                        <div className="space-y-3">
                          {/* Services sélectionnés */}
                          <div className="space-y-2">
                            {selectedItems.map((item, index) => (
                              <div key={index} className="flex justify-between items-center text-sm">
                                <span className="text-gray-700">
                                  {item.serviceName} (x{item.quantity})
                                </span>
                                <span className="font-medium text-gray-900">
                                  {item.price * item.quantity} FCFA
                                </span>
                              </div>
                            ))}
                          </div>
                          
                          {/* Sous-total */}
                          <div className="border-t pt-3">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Sous-total services:</span>
                              <span className="font-medium text-gray-900">
                                {selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)} FCFA
                              </span>
                            </div>
                          </div>
                          
                          {/* Options de service avec cases à cocher */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-700">Options de service:</h4>
                            
                            {/* Option Collecte */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  id="collection-option"
                                  checked={includeCollection}
                                  onChange={(e) => setIncludeCollection(e.target.checked)}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <label htmlFor="collection-option" className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                                  <Truck className="w-4 h-4 text-blue-600" />
                                  Collecte à domicile
                                </label>
                              </div>
                              <span className={`text-sm font-medium ${includeCollection ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                                {COLLECTION_FEE} FCFA
                              </span>
                            </div>
                            
                            {/* Option Livraison */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  id="delivery-option"
                                  checked={includeDelivery}
                                  onChange={(e) => setIncludeDelivery(e.target.checked)}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <label htmlFor="delivery-option" className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                                  <Package className="w-4 h-4 text-green-600" />
                                  Livraison à domicile
                                </label>
                              </div>
                              <div className="text-right">
                                <span className={`text-sm font-medium ${includeDelivery ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                                  {DELIVERY_FEE} FCFA
                                </span>
                                {includeDelivery && (
                                  <p className="text-xs text-orange-600">*négociable</p>
                                )}
                              </div>
                            </div>
                            
                            {/* Message d'aide selon les options */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-xs text-blue-800">
                                {includeCollection && includeDelivery && (
                                  <>🔄 <strong>Service complet:</strong> Nous collectons et livrons vos vêtements</>
                                )}
                                {includeCollection && !includeDelivery && (
                                  <>📦 <strong>Collecte uniquement:</strong> Nous collectons, vous récupérez au pressing</>
                                )}
                                {!includeCollection && includeDelivery && (
                                  <>🏠 <strong>Livraison uniquement:</strong> Vous déposez au pressing, nous livrons</>
                                )}
                                {!includeCollection && !includeDelivery && (
                                  <>🏪 <strong>Service au pressing:</strong> Dépôt et récupération directement au pressing</>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          {/* Total */}
                          <div className="border-t pt-3">
                            <div className="flex justify-between items-center font-semibold text-lg">
                              <span className="text-gray-800">
                                TOTAL {includeDelivery ? 'ESTIMÉ' : 'FINAL'}:
                              </span>
                              <span className="text-green-600">
                                {selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 
                                 (includeCollection ? COLLECTION_FEE : 0) + 
                                 (includeDelivery ? DELIVERY_FEE : 0)} FCFA
                              </span>
                            </div>
                          </div>
                          
                          {/* Note explicative */}
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                            <p className="text-xs text-amber-800">
                              💡 <strong>Personnalisez votre service:</strong>
                            </p>
                            <ul className="text-xs text-amber-700 mt-1 space-y-1">
                              <li>• Cochez/décochez les options selon vos besoins</li>
                              <li>• Les frais de livraison peuvent être négociés via WhatsApp</li>
                              <li>• Seules les options sélectionnées seront envoyées au pressing</li>
                            </ul>
                          </div>
                          
                          {/* Information sur la localisation */}
                          {(includeCollection || includeDelivery) && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                              <p className="text-xs text-green-800 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <strong>Localisation requise:</strong>
                              </p>
                              <ul className="text-xs text-green-700 mt-1 space-y-1">
                                {includeCollection && (
                                  <li>• 📦 Partagez votre localisation exacte pour la collecte</li>
                                )}
                                {includeDelivery && (
                                  <li>• 🏠 Partagez votre localisation exacte pour la livraison</li>
                                )}
                                <li>• 🔄 Utilisez le partage en temps réel sur WhatsApp (15-30 min)</li>
                                <li>• 🎯 Cela permet au pressing de vous localiser précisément</li>
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm">Aucun service sélectionné</p>
                        </div>
                      )}
                    </div>
                    {/* Boutons d'action principaux */}
                    <div className="space-y-3">
                      <Button 
                        size="lg" 
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-xl shadow-lg" 
                        disabled={selectedItems.length === 0} 
                        onClick={handleWhatsApp}
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        {selectedItems.length > 0 ? '📱 Commander via WhatsApp' : '📋 Sélectionnez vos services'}
                      </Button>
                      
                      <Button 
                        size="lg" 
                        variant="outline"
                        className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-4 rounded-xl" 
                        disabled={!isBookingReady} 
                        onClick={handleBookingConfirmation}
                      >
                        <Calendar className="w-5 h-5 mr-2" />
                        {isBookingReady ? '🗓️ Réservation classique' : '📅 Réservation (bientôt)'}
                      </Button>
                    </div>
                    {selectedItems.length === 0 && (
                      <p className="text-sm text-center text-gray-500 bg-gray-50 p-3 rounded-lg">
                        💡 Sélectionnez vos services ci-dessus pour commander
                      </p>
                    )}
                    
                    {selectedItems.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800 text-center font-medium">
                          ✅ {selectedItems.length} service{selectedItems.length > 1 ? 's' : ''} sélectionné{selectedItems.length > 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-green-600 text-center mt-1">
                          Commandez directement via WhatsApp pour un service rapide!
                        </p>
                      </div>
                    )}
                    
                    {/* Informations de contact améliorées */}
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 border border-blue-100">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Phone className="w-5 h-5 text-blue-600" />
                        Contact direct
                      </h4>
                      <div className="space-y-3">
                        <button 
                          onClick={handleCall}
                          className="w-full bg-white hover:bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Phone className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-gray-800">Appeler</p>
                            <p className="text-sm text-gray-600">
                              {pressingData.phone ? (pressingData.phone.startsWith('+') ? pressingData.phone : `+225 ${pressingData.phone}`) : 'Non disponible'}
                            </p>
                          </div>
                        </button>
                        
                        <button 
                          onClick={() => selectedItems.length > 0 ? handleWhatsApp() : toast.error('Sélectionnez d\'abord vos services')}
                          className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg p-3 flex items-center gap-3 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-white">WhatsApp Business</p>
                            <p className="text-sm text-green-100">
                              {selectedItems.length > 0 ? 'Commander maintenant' : 'Sélectionnez vos services'}
                            </p>
                          </div>
                          <Send className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      
                      {/* Avantages WhatsApp */}
                      <div className="mt-4 bg-white/50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-700 mb-2">✨ Avantages WhatsApp:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          <li>• 🚀 Réponse rapide garantie</li>
                          <li>• 💬 Discussion directe avec le pressing</li>
                          <li>• 📸 Envoi de photos si nécessaire</li>
                          <li>• ⏰ Confirmation immédiate</li>
                          <li>• 💰 Négociation des frais de livraison</li>
                          <li>• 📍 Adaptation selon votre localisation</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <CustomerReviews pressingId={id || ''} />
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
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      ✅ Ouvert maintenant (6h-20h)
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
                            <div>
                              <p className="text-green-600 font-medium">
                                06:00 - 20:00
                              </p>
                            </div>
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
                <PhotoGallery 
                  pressingId={id || ''}
                  isOwner={false} // Set to true if current user owns this pressing
                  onUploadPhoto={async (file, description) => {
                    console.log('Upload photo:', file, description);
                    toast.success('Photo ajoutée avec succès !');
                  }}
                  onDeletePhoto={async (photoId) => {
                    console.log('Delete photo:', photoId);
                    toast.success('Photo supprimée');
                  }}
                  onSetMainPhoto={async (photoId) => {
                    console.log('Set main photo:', photoId);
                    toast.success('Photo principale mise à jour');
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CustomerReviews 
          pressingId={id || ''}
        />
      </div>
      
      {/* Modal WhatsApp amélioré */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="bg-green-600 text-white p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Commander via WhatsApp</h3>
                <p className="text-green-100 text-sm">{pressingData?.businessName}</p>
              </div>
              <button 
                onClick={() => setShowWhatsAppModal(false)}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 max-h-[calc(90vh-80px)] overflow-y-auto">
              {/* Informations client */}
              <div className="space-y-4 mb-6">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Vos informations
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Votre nom complet"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Votre numéro"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse de collecte *</label>
                  <textarea
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={2}
                    placeholder="Adresse complète pour la collecte"
                  />
                </div>
              </div>
              
              {/* Résumé de la commande */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Résumé de votre commande
                </h4>
                
                <div className="space-y-2 mb-3">
                  {selectedItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{item.serviceName} (x{item.quantity})</span>
                      <span className="font-medium text-gray-900">{item.price * item.quantity} FCFA</span>
                    </div>
                  ))}
                </div>
                
                {/* Sous-total */}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center text-sm mb-3">
                    <span className="text-gray-600">Sous-total services:</span>
                    <span className="font-medium text-gray-900">
                      {selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)} FCFA
                    </span>
                  </div>
                </div>
                
                {/* Options de service */}
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-gray-700">Options de service:</h5>
                  
                  {/* Option Collecte */}
                  <div className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="modal-collection-option"
                        checked={includeCollection}
                        onChange={(e) => setIncludeCollection(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <label htmlFor="modal-collection-option" className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                        <Truck className="w-4 h-4 text-blue-600" />
                        Collecte
                      </label>
                    </div>
                    <span className={`text-sm font-medium ${includeCollection ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                      {COLLECTION_FEE} FCFA
                    </span>
                  </div>
                  
                  {/* Option Livraison */}
                  <div className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="modal-delivery-option"
                        checked={includeDelivery}
                        onChange={(e) => setIncludeDelivery(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <label htmlFor="modal-delivery-option" className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                        <Package className="w-4 h-4 text-green-600" />
                        Livraison
                      </label>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium ${includeDelivery ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                        {DELIVERY_FEE} FCFA
                      </span>
                      {includeDelivery && (
                        <p className="text-xs text-orange-600">*négociable</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Total final */}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center font-semibold text-lg">
                    <span>TOTAL {includeDelivery ? 'ESTIMÉ' : 'FINAL'}:</span>
                    <span className="text-green-600">
                      {selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 
                       (includeCollection ? COLLECTION_FEE : 0) + 
                       (includeDelivery ? DELIVERY_FEE : 0)} FCFA
                    </span>
                  </div>
                </div>
                
                {collectionDateTime && collectionDateTime.date && (
                  <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Collecte souhaitée: {collectionDateTime.date.toLocaleDateString('fr-FR')} à {collectionDateTime.time}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Information importante sur la localisation */}
              {(includeCollection || includeDelivery) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    📍 Important : Localisation requise
                  </h4>
                  <div className="text-sm text-blue-700 space-y-2">
                    <p className="font-medium">
                      {includeCollection && includeDelivery && "Pour la collecte ET la livraison :"}
                      {includeCollection && !includeDelivery && "Pour la collecte :"}
                      {!includeCollection && includeDelivery && "Pour la livraison :"}
                    </p>
                    <ul className="text-xs space-y-1 ml-4">
                      <li>• Vous devrez partager votre localisation exacte en temps réel</li>
                      <li>• Utilisez le bouton "📍 Localisation" dans WhatsApp</li>
                      <li>• Activez le partage pendant 15-30 minutes</li>
                      <li>• Cela permet au pressing de vous localiser précisément</li>
                    </ul>
                    <p className="text-xs font-medium text-blue-800 mt-2">
                      💡 Des instructions détaillées seront incluses dans le message WhatsApp
                    </p>
                  </div>
                </div>
              )}
              
              {/* Aperçu du message */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Message qui sera envoyé
                </h4>
                <div className="bg-white rounded-lg p-3 text-sm text-gray-700 max-h-40 overflow-y-auto border">
                  <pre className="whitespace-pre-wrap font-sans">{whatsappMessage}</pre>
                </div>
              </div>
              
              {/* Boutons d'action */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowWhatsAppModal(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSendWhatsApp}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Envoyer sur WhatsApp
                </Button>
              </div>
              
              {/* Note informative */}
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  💡 <strong>Comment ça marche:</strong> Votre commande sera envoyée directement au pressing via WhatsApp. 
                  Le pressing vous contactera pour confirmer les détails et organiser la collecte.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PressingDetailPage;
