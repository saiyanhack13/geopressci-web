import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';

// Extract the hooks we need from the API
const { 
  useGetPressingByIdQuery, 
  useGetPressingServicesQuery,
  useGetCurrentUserQuery,
  useCreateOrderMutation 
} = api;
// UI Components
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import { Loader2, ArrowLeft, MapPin, Clock, Calendar, Package, CreditCard, Check, AlertCircle, Info, Edit3, Truck } from 'lucide-react';
import AddressMapSelector from '../../components/order/AddressMapSelector';
import { Skeleton } from '../../components/ui/SkeletonLoader';
import { formatPrice } from '../../utils/format';

// Types pour les données de l'API
import { 
  Pressing as PressingType, 
  PressingService as ServiceType, 
  PressingServiceCategory,
  User as UserType
} from '../../types';

// Interface pour l'adresse avec géolocalisation
interface Address {
  street?: string;
  city?: string;
  district?: string;
  postalCode?: string;
  country?: string;
  formattedAddress?: string;
  [key: string]: any;
}

// Types pour les réponses de l'API
interface PressingResponse extends Omit<PressingType, 'services'> {
  services?: ServiceType[];
  error?: string;
}

interface UserResponse {
  _id?: string;
  id?: string;
  nom?: string;
  prenom?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  telephone?: string;
  phoneNumber?: string;
  phone?: string;
  role?: 'client' | 'pressing' | 'admin';
  addresses?: Array<{
    isDefault: boolean;
    formattedAddress: string;
  }>;
  address?: string;
  dateOfBirth?: string;
  status?: 'active' | 'inactive' | 'suspended';
  isEmailVerified?: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  avatar?: string;
  totalOrders?: number;
  favoritePressed?: string;
  memberSince?: string;
  language?: 'fr' | 'en';
  theme?: 'light' | 'dark' | 'auto';
  currency?: string;
  timezone?: string;
  notifications?: {
    push?: boolean;
    email?: boolean;
    sms?: boolean;
    marketing?: boolean;
    orders?: boolean;
    promotions?: boolean;
  };
  privacy?: {
    profileVisibility?: 'public' | 'private';
    dataSharing?: boolean;
    analytics?: boolean;
    locationTracking?: boolean;
  };
  security?: {
    twoFactorAuth?: boolean;
  };
  error?: string;
}

// Les interfaces PressingType et UserType sont maintenant importées depuis les types partagés

// Interface pour les données du formulaire
interface OrderFormData {
  pickupDate: string;
  pickupTime: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryAddress: string;
  deliveryInstructions: string;
  specialInstructions: string;
  items: Array<{
    serviceId: string;
    quantity: number;
  }>;
}

// Schéma de validation avec Yup
const orderSchema = yup.object({
  pickupDate: yup.string().required('La date de collecte est requise'),
  pickupTime: yup.string().required('L\'heure de collecte est requise'),
  deliveryDate: yup.string().required('La date de livraison est requise'),
  deliveryTime: yup.string().required('L\'heure de livraison est requise'),
  deliveryAddress: yup.string().required('L\'adresse de livraison est requise'),
  deliveryInstructions: yup.string().default(''),
  specialInstructions: yup.string().default(''),
  items: yup
    .array(
      yup.object({
        serviceId: yup.string().required('Service requis'),
        quantity: yup.number().min(1, 'Minimum 1').required('Quantité requise'),
      })
    )
    .required()
    .default([]),
});

const OrderCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>(() => {
    // Initialisation propre pour éviter les clés undefined
    return {};
  });
  
  // États pour la géolocalisation et l'adresse
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(null);
  
  // Récupérer pressingId depuis les query parameters ou les données de navigation
  const searchParams = new URLSearchParams(location.search);
  const pressingIdFromQuery = searchParams.get('pressing');
  const pressingIdFromState = location.state?.pressingId;
  const pressingId = pressingIdFromQuery || pressingIdFromState;
  
  console.log('🎯 OrderCreatePage - PressingId debug:', {
    fromQuery: pressingIdFromQuery,
    fromState: pressingIdFromState,
    final: pressingId,
    search: location.search,
    state: location.state
  });
  
  // Récupérer les données de navigation depuis PressingDetailPage ou OrderReviewPage (mode édition)
  const navigationData: {
    selectedItems?: Array<{
      serviceId: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    collectionDateTime?: string;
    deliveryDateTime?: string;
    pressingId?: string;
    pressingName?: string;
    pressingAddress?: string;
    customerInfo?: {
      firstName: string;
      lastName: string;
      phoneNumber: string;
      email: string;
    };
    deliveryAddress?: {
      fullAddress: string;
      instructions?: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
    timeSlotInfo?: {
      startTime: string;
      endTime: string;
      type: string;
      capacity: number;
      isDefault: boolean;
      period: string;
    };
    editMode?: boolean;
  } | null = location.state as any;
  
  // Récupération des données du pressing
  // Récupération des données du pressing avec typage
  const { data: pressingResponse, isLoading: isLoadingPressing } = useGetPressingByIdQuery(
    pressingId || '',
    { skip: !pressingId }
  );
  const pressingData = pressingResponse as PressingResponse | undefined;

  // Récupération des services du pressing avec typage
  const { data: servicesResponse, isLoading: isLoadingServices } = useGetPressingServicesQuery(
    pressingId || '',
    { skip: !pressingId }
  );
  const servicesData = servicesResponse as ServiceType[] | undefined;
  
  // Debug: vérifier la structure des services
  useEffect(() => {
    if (servicesData) {
      console.log('🔍 ServicesData reçu (complet):', JSON.stringify(servicesData, null, 2));
      // Vérifier les services et leurs IDs
      const serviceDetails = servicesData.map(s => ({ 
        _id: s._id, 
        id: s.id, // Vérifier si l'ID est dans le champ id
        name: s.name,
        nom: s.nom,
        price: s.price,
        prix: s.prix,
        hasValidId: !!s._id || !!s.id
      }));
      console.log('🔍 Détails des services:', serviceDetails);
      
      // Vérifier les services avec IDs invalides
      const invalidServices = servicesData.filter(s => {
        const hasId = !!s._id || !!s.id;
        const hasName = !!s.name || !!s.nom;
        const hasPrice = !!s.price || !!s.prix;
        return !(hasId && hasName && hasPrice);
      });
      
      if (invalidServices.length > 0) {
        console.warn('⚠️ Services avec données invalides détectés:', {
          count: invalidServices.length,
          details: invalidServices.map(s => ({
            _id: s._id,
            id: s.id,
            name: s.name,
            nom: s.nom,
            price: s.price,
            prix: s.prix
          }))
        });
      }
    }
  }, [servicesData]);

  // Récupération des données de l'utilisateur avec typage
  const { data: userResponse, isFetching: isLoadingUser } = useGetCurrentUserQuery();
  const userData = userResponse as unknown as UserResponse | undefined;
  
  // Debug des données utilisateur
  useEffect(() => {
    if (userData) {
      console.log('👤 Données utilisateur récupérées (complètes):', {
        // Noms
        firstName: userData.firstName,
        lastName: userData.lastName,
        nom: userData.nom,
        prenom: userData.prenom,
        // Téléphones
        phoneNumber: userData.phoneNumber,
        telephone: userData.telephone,
        phone: userData.phone,
        // Email
        email: userData.email,
        // Autres
        addresses: userData.addresses,
        role: userData.role,
        _id: userData._id
      });
      
      // Test de l'affichage final
      const displayName = (() => {
        const firstName = userData.firstName || userData.prenom || '';
        const lastName = userData.lastName || userData.nom || '';
        if (firstName && lastName) return `${firstName} ${lastName}`;
        return firstName || lastName || userData.nom || userData.prenom || 'Non renseigné';
      })();
      
      const displayPhone = userData.phoneNumber || userData.telephone || userData.phone || 'Non renseigné';
      
      console.log('📋 Affichage final des infos client:', {
        nom: displayName,
        telephone: displayPhone,
        email: userData.email || 'Non renseigné'
      });
    } else {
      console.log('👤 Aucune donnée utilisateur disponible');
    }
  }, [userData]);

  // Mutation pour création de la commande
  const [createOrder, { isLoading: isSubmitting }] = useCreateOrderMutation();

  // Gestion du chargement
  const isLoading = isLoadingPressing || isLoadingServices || isLoadingUser;

  // Initialiser le formulaire
  const { 
    control, 
    handleSubmit, 
    formState: { errors }, 
    watch, 
    setValue 
  } = useForm<OrderFormData>({
    resolver: yupResolver(orderSchema) as any,
    defaultValues: {
      pickupDate: navigationData?.collectionDateTime ? new Date(navigationData.collectionDateTime).toISOString().split('T')[0] : '',
      pickupTime: navigationData?.collectionDateTime ? new Date(navigationData.collectionDateTime).toTimeString().slice(0, 5) : '',
      deliveryDate: navigationData?.deliveryDateTime ? new Date(navigationData.deliveryDateTime).toISOString().split('T')[0] : '',
      deliveryTime: navigationData?.deliveryDateTime ? new Date(navigationData.deliveryDateTime).toTimeString().slice(0, 5) : '',
      deliveryAddress: navigationData?.deliveryAddress?.fullAddress || userData?.addresses?.find(addr => addr.isDefault)?.formattedAddress || navigationData?.pressingAddress || '',
      deliveryInstructions: navigationData?.deliveryAddress?.instructions || '',
      specialInstructions: '',
      items: [],
    },
  });
  
  // Initialiser les services sélectionnés depuis les données de navigation
  useEffect(() => {
    console.log('🎯 OrderCreatePage - Données de navigation reçues:', navigationData);
    
    if (navigationData?.selectedItems && navigationData.selectedItems.length > 0) {
      const servicesMap: Record<string, number> = {};
      const formItems: Array<{ serviceId: string; quantity: number }> = [];
      
      navigationData.selectedItems.forEach(item => {
        console.log('🎯 OrderCreatePage - Traitement item:', item);
        
        // Protection contre les serviceId invalides
        if (!item.serviceId || item.serviceId === 'undefined') {
          console.warn('⚠️ Item avec serviceId invalide ignoré:', item);
          return;
        }
        
        servicesMap[item.serviceId] = item.quantity;
        formItems.push({
          serviceId: item.serviceId,
          quantity: item.quantity
        });
      });
      
      console.log('🎯 OrderCreatePage - Services map final:', servicesMap);
      console.log('🎯 OrderCreatePage - Form items final:', formItems);
      
      setSelectedServices(servicesMap);
      setValue('items', formItems);
    }
  }, [navigationData, setValue]);
  
  // Initialiser les coordonnées GPS en mode édition
  useEffect(() => {
    if (navigationData?.editMode && navigationData?.deliveryAddress?.coordinates) {
      setSelectedPosition(navigationData.deliveryAddress.coordinates);
      console.log('🎯 OrderCreatePage - Coordonnées GPS initialisées pour édition:', navigationData.deliveryAddress.coordinates);
    }
  }, [navigationData]);
  
  // Fonction helper pour obtenir le nom correct du service
  const getCorrectServiceName = (serviceId: string, importedName?: string): string => {
    console.log('🔍 getCorrectServiceName - Début:', { serviceId, importedName });
    
    const pressingService = servicesData?.find(s => {
      const sId = (s._id || s.id)?.toString().trim();
      const targetId = serviceId.toString().trim();
      console.log('🔍 getCorrectServiceName - Comparaison:', { sId, targetId, match: sId === targetId });
      return sId === targetId;
    });
    
    console.log('🔍 getCorrectServiceName - Service pressing trouvé:', pressingService);
    
    // Priorité: pressing service name > imported name (si pas "Service non trouvé")
    const correctName = pressingService?.nom || pressingService?.name;
    console.log('🔍 getCorrectServiceName - Nom correct:', correctName);
    
    if (correctName) {
      const result = correctName.trim();
      console.log('✅ getCorrectServiceName - Résultat (pressing):', result);
      return result;
    }
    
    // Si pas de service pressing et que le nom importé n'est pas le fallback
    if (importedName && importedName !== 'Service non trouvé') {
      const result = importedName.trim();
      console.log('✅ getCorrectServiceName - Résultat (importé):', result);
      return result;
    }
    
    console.log('⚠️ getCorrectServiceName - Aucun nom trouvé, fallback');
    return 'Service non trouvé';
  };

  // Fonctions utilitaires pour le formatage d'adresse
  const formatAddressSafe = (addr: any): string => {
    try {
      if (!addr) return 'Adresse non disponible';
      
      if (typeof addr === 'string') {
        return addr;
      }
      
      if (typeof addr === 'object') {
        if (addr.formattedAddress && typeof addr.formattedAddress === 'string') {
          return addr.formattedAddress;
        }
        
        const parts = [
          addr.street,
          addr.city,
          addr.postalCode,
          addr.country
        ].filter(Boolean);
        
        return parts.length > 0 ? parts.join(', ') : 'Adresse non disponible';
      }
      
      return String(addr);
    } catch (error) {
      console.error('Erreur lors du formatage de l\'adresse:', error);
      return 'Adresse non disponible';
    }
  };

  // Fonction utilitaire pour formater les dates
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return 'Date non disponible';
    }
  };

  // Gérer la sélection d'un service
  const handleServiceSelect = (serviceId: string, isSelected: boolean): void => {
    // Protection contre les serviceId invalides
    if (!serviceId || serviceId === 'undefined') {
      console.warn('⚠️ Tentative de sélection d\'un service avec ID invalide:', serviceId);
      return;
    }

    // Vérifier si le service est déjà dans le formulaire
    const currentItems = watch('items') || [];
    const serviceIndex = currentItems.findIndex(item => item.serviceId === serviceId);

    if (isSelected) {
      // Si le service n'est pas déjà sélectionné, l'ajouter
      if (serviceIndex === -1) {
        const newSelected = { ...selectedServices, [serviceId]: 1 };
        setSelectedServices(newSelected);
        
        // Ajouter le service au formulaire
        setValue('items', [...currentItems, { serviceId, quantity: 1 }]);
      }
    } else {
      // Si le service est sélectionné, le retirer
      if (serviceIndex !== -1) {
        const newSelected = { ...selectedServices };
        delete newSelected[serviceId];
        setSelectedServices(newSelected);
        
        // Retirer le service du formulaire
        const updatedItems = currentItems.filter(item => item.serviceId !== serviceId);
        setValue('items', updatedItems);
      }
    }
  };

  // Fonction pour nettoyer les selectedServices des entrées invalides
  const cleanSelectedServices = (services: Record<string, number>): Record<string, number> => {
    const cleaned: Record<string, number> = {};
    Object.entries(services).forEach(([serviceId, quantity]) => {
      if (serviceId && serviceId !== 'undefined' && quantity > 0) {
        cleaned[serviceId] = quantity;
      }
      // Suppression du log répétitif
    });
    return cleaned;
  };

  // Fonction utilitaire pour obtenir l'ID correct d'un service
  const getServiceId = (service: any): string => {
    return service._id || service.id || '';
  };

  // Fonction utilitaire pour récupérer les informations d'un service
  const getServiceInfo = (serviceId: string) => {
    // Vérifier si l'ID est valide
    if (!serviceId || serviceId === 'undefined') {
      console.warn(`⚠️ ServiceId invalide: ${serviceId}`);
      return {
        name: 'Service non identifié',
        price: 0,
        preparation: null,
        category: null,
        isImported: false
      };
    }

    // Debug: Afficher tous les services disponibles
    console.log('📋 Services disponibles:', servicesData?.map(s => ({ 
      _id: s._id, 
      nom: s.nom, 
      prix: s.prix,
      name: s.name,
      price: s.price
    })));
    
    // Chercher d'abord dans les services importés
    const importedService = navigationData?.selectedItems?.find(item => {
      // Comparaison stricte avec conversion en string et normalisation
      const importedId = String(item.serviceId).trim();
      const targetId = String(serviceId).trim();
      console.log('🔍 Comparaison IDs:', { importedId, targetId });
      return importedId === targetId;
    });

    // Puis dans les services du pressing
    const pressingService = servicesData?.find(s => {
      // Vérifier les deux champs possibles pour l'ID
      const serviceIdStr = (s._id || s.id)?.toString().trim();
      const targetId = String(serviceId).trim();
      console.log('🔍 Comparaison IDs (pressing):', { 
        serviceId: serviceIdStr, 
        targetId,
        idField: s._id ? '_id' : 'id'
      });
      return serviceIdStr === targetId;
    });

    // Si le service pressing n'est pas trouvé par ID, essayer de le trouver par prix
    const alternativeService = !pressingService && importedService?.price 
      ? servicesData?.find(s => {
          const servicePrice = s.prix || s.price;
          const importedPrice = importedService.price;
          console.log('🔍 Comparaison prix:', { servicePrice, importedPrice });
          return servicePrice === importedPrice;
        })
      : null;

    const finalPressingService = pressingService || alternativeService;

    // Debug: Afficher le service trouvé
    console.log('🎯 Service trouvé:', {
      imported: importedService,
      pressing: pressingService,
      alternative: alternativeService,
      final: finalPressingService
    });

    // Utiliser la fonction helper pour obtenir le nom correct
    const serviceName = getCorrectServiceName(serviceId, importedService?.name);
    const servicePrice = finalPressingService?.prix || finalPressingService?.price || importedService?.price || 0;
    const servicePreparation = finalPressingService?.preparation;
    const serviceCategory = finalPressingService?.categorie || finalPressingService?.category || 'Général';
    const serviceDescription = finalPressingService?.description || 'Description non disponible';

    // Ajout de logs détaillés pour débogage
    console.log('🔍 Service récupéré - Détails complets:', {
      serviceId,
      imported: !!importedService,
      pressing: !!pressingService,
      alternative: !!alternativeService,
      finalService: !!finalPressingService,
      name: serviceName,
      price: servicePrice,
      category: serviceCategory,
      description: serviceDescription
    });
    
    if (importedService) {
      console.log('📦 Service importé détails:', importedService);
    }
    
    if (finalPressingService) {
      console.log('🏢 Service pressing détails:', {
        _id: finalPressingService._id,
        nom: finalPressingService.nom,
        name: finalPressingService.name,
        description: finalPressingService.description,
        prix: finalPressingService.prix,
        price: finalPressingService.price,
        categorie: finalPressingService.categorie,
        category: finalPressingService.category
      });
    } else {
      console.warn('⚠️ Aucun service pressing trouvé pour ID:', serviceId);
      console.log('📋 Services disponibles:', servicesData?.map(s => ({ _id: s._id, nom: s.nom, prix: s.prix })));
    }

    return {
      name: serviceName,
      description: serviceDescription,
      price: servicePrice,
      preparation: servicePreparation,
      category: serviceCategory,
      isImported: !!importedService
    };
  };

  // Calculer le sous-total de la commande
  const calculateSubtotal = (): number => {
    let total = 0;
    
    // Nettoyer les services sélectionnés avant le calcul
    const cleanedServices = cleanSelectedServices(selectedServices);
    
    // Calculer le total pour tous les services actuellement sélectionnés
    Object.entries(cleanedServices).forEach(([serviceId, quantity]) => {
      // Protection contre les serviceId undefined ou invalides
      if (!serviceId || serviceId === 'undefined' || quantity <= 0) {
        return;
      }
      
      const serviceInfo = getServiceInfo(serviceId);
      
      if (serviceInfo.price > 0) {
        total += serviceInfo.price * quantity;
      } else {
        console.warn(`⚠️ Prix non trouvé pour le service ${serviceInfo.name} (${serviceId})`);
      }
    });
    
    return total;
  };
  
  // Calculer les frais de livraison
  const calculateDeliveryFee = (): number => {
    const subtotal = calculateSubtotal();
    // Livraison gratuite pour les commandes > 5000 FCFA
    return subtotal >= 5000 ? 0 : 1000;
  };
  
  // Calculer les frais de service
  const calculateServiceFee = (): number => {
    // Frais de service fixe de 500 XOF
    return 500;
  };
  
  // Calculer le total final
  const calculateTotal = (): number => {
    return calculateSubtotal() + calculateDeliveryFee() + calculateServiceFee();
  };

  // Soumettre le formulaire
  const onSubmit: SubmitHandler<OrderFormData> = async (data: OrderFormData): Promise<void> => {
    if (!pressingId || !pressingData) {
      toast.error('Informations du pressing manquantes');
      return;
    }
    
    try {
      // Vérifier qu'il y a des services sélectionnés
      const selectedServicesCount = Object.keys(selectedServices).length;
      if (selectedServicesCount === 0) {
        toast.error('Veuillez sélectionner au moins un service');
        return;
      }

      // Créer le tableau de services pour la commande selon l'API
      const services = Object.entries(selectedServices).map(([serviceId, quantity]) => {
        // Utiliser getServiceInfo pour obtenir les informations correctes du service
        const serviceInfo = getServiceInfo(serviceId);
        
        console.log('✅ Service traité:', {
          serviceId,
          name: serviceInfo.name,
          price: serviceInfo.price,
          quantity,
          subtotal: serviceInfo.price * quantity
        });
        
        return {
          serviceId,
          quantite: quantity,
          instructions: data.specialInstructions,
          // Utiliser les données de getServiceInfo qui sont déjà corrigées
          prix: serviceInfo.price,
          nom: serviceInfo.name,
          // Ajouter description et catégorie pour le backend
          description: serviceInfo.description,
          categorie: serviceInfo.category
        };
      });

      // Calculer les montants
      const subtotal = calculateSubtotal();
      const deliveryFee = calculateDeliveryFee();
      const serviceFee = calculateServiceFee();
      const total = calculateTotal();
      
      // Combiner toutes les données des deux pages frontend
      const orderData = {
        // Données de base
        pressingId,
        services,
        
        // Adresse de livraison (OrderCreatePage)
        adresseLivraison: data.deliveryAddress,
        
        // Montants calculés (format backend)
        payment: {
          amount: {
            subtotal: subtotal,
            delivery: deliveryFee,
            tax: 0,
            tip: 0,
            total: total,
            currency: 'XOF'
          }
        },
        
        // Frais de service
        fees: [
          {
            type: 'service',
            amount: serviceFee,
            description: 'Frais de service',
            currency: 'XOF'
          }
        ],
        
        // Montants calculés (format alternatif)
        montants: {
          sousTotal: subtotal,
          fraisLivraison: deliveryFee,
          fraisService: serviceFee,
          total: total
        },
        
        // Date et heure de collecte (PressingDetailPage → OrderCreatePage)
        dateRecuperationSouhaitee: navigationData?.collectionDateTime || 
          new Date(`${data.pickupDate}T${data.pickupTime}`).toISOString(),
        
        // Instructions de différents types (OrderCreatePage)
        instructionsSpeciales: data.specialInstructions || '',
        deliveryInstructions: data.deliveryInstructions || '',
        specialInstructions: data.specialInstructions || '',
        
        // Informations du pressing depuis PressingDetailPage
        pressingName: navigationData?.pressingName || pressingData?.businessName || '',
        pressingAddress: navigationData?.pressingAddress || pressingData?.address || '',
        
        // Métadonnées supplémentaires pour traçabilité
        metadata: {
          sourcePages: ['PressingDetailPage', 'OrderCreatePage'],
          navigationData: {
            hasSelectedItems: !!navigationData?.selectedItems?.length,
            hasCollectionDateTime: !!navigationData?.collectionDateTime,
            hasPressingInfo: !!(navigationData?.pressingName || navigationData?.pressingAddress)
          }
        }
      };
      
      console.log('📦 Préparation des données pour la révision de commande:', {
        servicesCount: services.length,
        totalAmount: total,
        hasNavigationData: !!navigationData,
        pressingId,
        deliveryAddress: data.deliveryAddress
      });

      // Préparer les données complètes pour OrderReviewPage
      const orderReviewData = {
        pressingId,
        pressingName: navigationData?.pressingName || pressingData?.businessName || 'Pressing',
        pressingAddress: formatAddressSafe(navigationData?.pressingAddress || pressingData?.address || ''),
        pressingPhone: pressingData?.phone || '',
        selectedItems: Object.entries(selectedServices).map(([serviceId, quantity]) => {
          const serviceInfo = getServiceInfo(serviceId);
          return {
            serviceId,
            name: serviceInfo.name,
            price: serviceInfo.price,
            quantity,
            total: serviceInfo.price * quantity
          };
        }),
        customerInfo: {
          firstName: userData?.firstName || userData?.prenom || '',
          lastName: userData?.lastName || userData?.nom || '',
          phoneNumber: userData?.phone || userData?.telephone || '',
          email: userData?.email || ''
        },
        deliveryAddress: {
          fullAddress: formatAddressSafe(data.deliveryAddress),
          instructions: data.deliveryInstructions,
          coordinates: selectedPosition
        },
        collectionDateTime: navigationData?.collectionDateTime || 
          new Date(`${data.pickupDate}T${data.pickupTime}`).toISOString(),
        deliveryDateTime: new Date(`${data.deliveryDate}T${data.deliveryTime}`).toISOString(),
        pricing: {
          subtotal: subtotal,
          deliveryFee: deliveryFee,
          total: total
        },
        // Données pour l'API backend (à utiliser après validation du paiement)
        apiData: orderData
      };
      
      console.log('🔄 Redirection vers OrderReviewPage avec données complètes');
      
      // Sauvegarder les données dans localStorage pour persistance
      localStorage.setItem('pendingOrderData', JSON.stringify(orderReviewData));
      localStorage.setItem('pendingOrderTimestamp', Date.now().toString());
      
      // Rediriger vers la page de révision SANS créer la commande backend
      // La commande sera créée après validation du paiement dans PaymentPage
      navigate('/client/orders/summary', {
        state: {
          orderData: orderReviewData,
          fromOrderCreate: true
        },
        replace: true
      });
      
    } catch (error: any) {
      console.error('Erreur lors de la préparation de la commande:', error);
      
      // Gestion des erreurs spécifiques
      let errorMessage = 'Une erreur est survenue lors de la préparation de la commande';
      
      if (error.status === 401) {
        errorMessage = 'Veuillez vous connecter pour continuer';
        navigate('/connexion', { state: { from: window.location.pathname } });
      } else if (error.status === 400) {
        errorMessage = 'Données de commande invalides';
      } else if (error.status === 403) {
        errorMessage = 'Vous n\'êtes pas autorisé à effectuer cette action';
      } else if (error.status === 404) {
        errorMessage = 'Pressing ou service non trouvé';
      } else if (error.status === 409) {
        errorMessage = 'Un conflit est survenu avec cette commande';
      } else if (error.status === 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };

  // Gérer la sélection/désélection d'un service
  const handleServiceToggle = (serviceId: string, price: number): void => {
    const isSelected = !!selectedServices[serviceId];
    handleServiceSelect(serviceId, !isSelected);
  };

  // Gérer les erreurs de chargement des données
  useEffect(() => {
    if (pressingData?.error) {
      toast.error(pressingData.error || 'Erreur lors du chargement des informations du pressing');
      navigate('/');
    }
    
    if (userData?.error) {
      console.error('Erreur utilisateur:', userData.error);
      // Ne pas rediriger pour ne pas perturber l'expérience utilisateur
    }
  }, [pressingData, userData, navigate]);

  // Afficher le chargement
  if (isLoadingPressing || isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header avec skeleton */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        </div>
        
        {/* Contenu principal */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Formulaire skeleton */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>
            </div>
            
            {/* Sidebar skeleton */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-8 w-full mt-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Afficher les erreurs
  if (!pressingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg border p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Oups ! Une erreur s'est produite</h3>
            <p className="text-gray-600 mb-6">Impossible de charger les informations du pressing. Vérifiez votre connexion et réessayez.</p>
            <div className="space-y-3">
              <Button 
                className="w-full" 
                onClick={() => window.location.reload()}
              >
                Réessayer
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header moderne avec navigation */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {navigationData?.editMode ? 'Modifier la commande' : 'Nouvelle commande'}
                </h1>
                <p className="text-sm text-gray-600">
                  {navigationData?.pressingName || pressingData?.businessName || 'Pressing'}
                </p>
              </div>
            </div>
            
            {/* Indicateur de progression */}
            <div className="hidden sm:flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-xs text-gray-600">Détails</span>
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span className="text-xs text-gray-400">Paiement</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contenu principal */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Colonne principale - Formulaire */}
            <div className="lg:col-span-2 space-y-6">
              {/* Services pré-sélectionnés depuis PressingDetailPage */}
              {navigationData?.selectedItems && navigationData.selectedItems.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Check className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-blue-900">Services sélectionnés</h2>
                  </div>
                  <div className="space-y-4">
                    {navigationData.selectedItems.map((item) => {
                      // Trouver les détails du service dans servicesData (même source que PressingDetailPage)
                      const serviceDetails = servicesData?.find(s => s._id === item.serviceId);
                      
                      return (
                        <div key={item.serviceId} className="bg-white rounded-xl p-5 shadow-sm border border-blue-100">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                                <h3 className="font-semibold text-gray-900 text-base">{item.name}</h3>
                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                                  ×{item.quantity}
                                </span>
                              </div>
                              
                              {/* Détails du service */}
                              <div className="space-y-2 ml-6">
                                <div className="flex items-center text-sm text-gray-600">
                                  <span className="font-medium">Prix unitaire:</span>
                                  <span className="ml-2 text-blue-600 font-semibold">{formatPrice(item.price)}</span>
                                </div>
                                
                                {serviceDetails?.preparation && (
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Clock className="w-4 h-4 mr-1 text-blue-500" />
                                    <span>Temps de préparation: {serviceDetails.preparation}</span>
                                  </div>
                                )}
                                
                                {serviceDetails?.category && (
                                  <div className="flex items-center text-sm">
                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                                      {serviceDetails.category}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-600">
                                {formatPrice(item.price * item.quantity)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Total pour ce service
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Résumé des services sélectionnés */}
                  <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg p-4 mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-blue-900">
                        Total des services sélectionnés:
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatPrice(navigationData.selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0))}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-blue-700">
                        Vous pouvez modifier ces sélections ou ajouter d'autres services ci-dessous
                      </p>
                    </div>
                  </div>
                </div>
              )}
            
              {/* Section Services disponibles */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Package className="w-5 h-5 text-gray-600" />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Services disponibles</h2>
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                        Synchronisé en temps réel avec le pressing
                      </p>
                    </div>
                  </div>
                  {servicesData && servicesData.length > 0 && (
                    <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {servicesData.length} service{servicesData.length > 1 ? 's' : ''} disponible{servicesData.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                
                {/* Informations du pressing */}
                {pressingData && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <h3 className="font-medium text-blue-900">{pressingData.businessName}</h3>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>En ligne</span>
                      </div>
                    </div>
                    <p className="text-sm text-blue-700">{formatAddressSafe(pressingData.address)}</p>
                    {pressingData.phone && (
                      <p className="text-sm text-blue-600 mt-1">
                        📞 {pressingData.phone}
                      </p>
                    )}
                    {servicesData && servicesData.length > 0 && (
                      <div className="flex items-center space-x-2 mt-2 text-xs text-blue-600">
                        <Package className="w-3 h-3" />
                        <span>{servicesData.length} services actifs</span>
                      </div>
                    )}
                  </div>
                )}
              
              {servicesData && servicesData.length > 0 ? (
                <div className="space-y-4">
                  {servicesData
                    .filter(service => {
                      const serviceId = getServiceId(service);
                      const isValid = serviceId && serviceId !== 'undefined';
                      if (!isValid) {
                        console.warn('🔍 Service filtré (ID invalide):', service);
                      }
                      return isValid;
                    })
                    .map((service) => {
                      const serviceId = getServiceId(service);
                      return (
                     <div 
                       key={serviceId}
                       className={`border rounded-xl p-5 transition-all duration-200 ${
                         selectedServices[serviceId] 
                           ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md' 
                           : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                       }`}
                     >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id={`service-${serviceId}`}
                              checked={!!selectedServices[serviceId]}
                              onCheckedChange={(checked) => handleServiceSelect(serviceId, !!checked)}
                            />
                            <label 
                              htmlFor={`service-${serviceId}`}
                              className="font-medium text-gray-900 cursor-pointer flex-1"
                            >
                              {service.name}
                            </label>
                          </div>
                          
                          {/* Détails du service */}
                          <div className="ml-8 mt-2 space-y-1">
                            {service.preparation && (
                              <p className="text-sm text-gray-600 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {service.preparation}
                              </p>
                            )}
                            {service.category && (
                              <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                {service.category}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <span className="font-semibold text-lg text-gray-900">
                            {formatPrice(service.price || service.prix || 0)}
                          </span>
                          {selectedServices[service._id] && (
                            <div className="text-sm text-blue-600 mt-1">
                              Total: {formatPrice(
                                (service.price || service.prix || 0) * 
                                (selectedServices[service._id] || 0)
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {selectedServices[service._id] && (
                        <div className="mt-3 ml-8 flex items-center space-x-4">
                          <span className="text-sm text-gray-600">Quantité:</span>
                          <div className="flex items-center space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (selectedServices[service._id] > 1) {
                                  const newQty = selectedServices[service._id] - 1;
                                  setSelectedServices(prev => ({
                                    ...prev,
                                    [service._id]: newQty
                                  }));
                                  
                                  // Mettre à jour le formulaire
                                  const items = watch('items').map(item => 
                                    item.serviceId === service._id 
                                      ? { ...item, quantity: newQty }
                                      : item
                                  );
                                  setValue('items', items);
                                }
                              }}
                              disabled={selectedServices[service._id] <= 1}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center">
                              {selectedServices[service._id]}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newQty = (selectedServices[service._id] || 0) + 1;
                                setSelectedServices(prev => ({
                                  ...prev,
                                  [service._id]: newQty
                                }));
                                
                                // Mettre à jour le formulaire
                                const items = watch('items').map(item => 
                                  item.serviceId === service._id 
                                    ? { ...item, quantity: newQty }
                                    : item
                                );
                                setValue('items', items);
                              }}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );})}
                </div>
              ) : (
                <p className="text-gray-500">Aucun service disponible pour le moment.</p>
              )} 
              
              {errors.items && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.items?.message}
                </p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Détails de la collecte</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de collecte *
                  </label>
                  <Controller
                    name="pickupDate"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        {...field}
                        className={errors.pickupDate ? 'border-red-500' : ''}
                      />
                    )}
                  />
                  {errors.pickupDate && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.pickupDate?.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heure de collecte *
                  </label>
                  <Controller
                    name="pickupTime"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="time"
                        min="08:00"
                        max="18:00"
                        step="900"
                        {...field}
                        className={errors.pickupTime ? 'border-red-500' : ''}
                      />
                    )}
                  />
                  {errors.pickupTime && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.pickupTime?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section Détails de collecte */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Calendar className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Détails de collecte</h2>
              </div>
              
              <div className="space-y-4">
                {/* Section Adresse de livraison avec carte interactive */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Adresse de livraison *
                    </label>
                    <Controller
                      name="deliveryAddress"
                      control={control}
                      render={({ field }) => (
                        <Textarea
                          rows={2}
                          placeholder="Saisissez votre adresse ou utilisez la carte ci-dessous"
                          {...field}
                          error={errors.deliveryAddress?.message}
                          className={errors.deliveryAddress ? 'border-red-500' : ''}
                        />
                      )}
                    />
                    {errors.deliveryAddress && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.deliveryAddress?.message}
                      </p>
                    )}
                    {watch('deliveryAddress') && !errors.deliveryAddress && (
                      <p className="mt-1 text-sm text-green-600 flex items-center">
                        <Check className="w-4 h-4 mr-1" />
                        Adresse validée
                      </p>
                    )}
                  </div>
                  
                  {/* Carte interactive mobile-first */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Localiser précisément votre adresse
                    </h4>
                    <div className="h-48 sm:h-64 rounded-lg overflow-hidden shadow-sm">
                      <AddressMapSelector
                        onSelect={({ lat, lng, address }) => {
                          console.log('🗺️ AddressMapSelector - Sélection:', { lat, lng, address, addressType: typeof address });
                          setSelectedPosition({ lat, lng });
                          const formattedAddress = formatAddressSafe(address);
                          console.log('🗺️ AddressMapSelector - Adresse formatée:', formattedAddress);
                          setValue('deliveryAddress', formattedAddress);
                        }}
                        initialAddress={watch('deliveryAddress') && typeof watch('deliveryAddress') === 'string' ? watch('deliveryAddress') : ''}
                        initialPosition={selectedPosition ? [selectedPosition.lat, selectedPosition.lng] : undefined}
                      />
                    </div>
                    <div className="flex items-center space-x-2 mt-3 p-3 bg-blue-100 rounded-lg">
                      <Edit3 className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-blue-700">
                        Cliquez sur la carte pour ajuster la position ou déplacez le marqueur
                      </p>
                    </div>
                  </div>
                  
                  {/* Informations de livraison */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Truck className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-900">Informations de livraison</span>
                    </div>
                    <p className="text-sm text-green-700">
                      🎉 Livraison gratuite pour toute commande supérieure à 5000 FCFA
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Délai de livraison : 24-48h après traitement
                    </p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de livraison *
                    </label>
                    <Controller
                      name="deliveryDate"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          {...field}
                          className={errors.deliveryDate ? 'border-red-500' : ''}
                        />
                      )}
                    />
                    {errors.deliveryDate && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.deliveryDate?.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Heure de livraison *
                    </label>
                    <Controller
                      name="deliveryTime"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="time"
                          min="08:00"
                          max="20:00"
                          step="900"
                          {...field}
                          className={errors.deliveryTime ? 'border-red-500' : ''}
                        />
                      )}
                    />
                    {errors.deliveryTime && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.deliveryTime?.message}
                      </p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructions de livraison (optionnel)
                  </label>
                  <Controller
                    name="deliveryInstructions"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        rows={3}
                        placeholder="Code d'accès, étage, informations complémentaires..."
                        {...field}
                      />
                    )}
                  />
                </div>
                
                {/* Section Instructions spéciales */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Info className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">Instructions spéciales (optionnel)</h3>
                  </div>
                  <Controller
                    name="specialInstructions"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        rows={4}
                        placeholder="Ex: Attention aux vêtements délicats, traitement particulier souhaité, préférences de repassage..."
                        {...field}
                        className="bg-white border-purple-200 focus:border-purple-400 focus:ring-purple-200"
                      />
                    )}
                  />
                  <div className="flex items-center space-x-2 mt-3 p-3 bg-purple-100 rounded-lg">
                    <Info className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <p className="text-sm text-purple-700">
                      Ces informations aideront notre équipe à traiter votre commande avec le plus grand soin
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sidebar - Récapitulatif */}
          <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <Package className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Récapitulatif</h2>
                  </div>
                  {Object.keys(selectedServices).length > 0 && (
                    <div className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      {Object.keys(selectedServices).length} service{Object.keys(selectedServices).length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                
                {/* Informations client */}
                {userData && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {(() => {
                              // Priorité : firstName/prenom, puis email, puis 'U' par défaut
                              const firstName = userData.firstName || userData.prenom;
                              if (firstName) return firstName.charAt(0).toUpperCase();
                              if (userData.email) return userData.email.charAt(0).toUpperCase();
                              return 'U';
                            })()
                            }
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900">Informations client</h3>
                      </div>
                      <button 
                        type="button"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                        onClick={() => toast('Modification des informations client disponible dans votre profil', { icon: '👤' })}
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Modifier</span>
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Nom complet:</span>
                        <span className="ml-2 text-gray-900">
                          {(() => {
                            // Gestion des différents formats de nom dans la base
                            const firstName = userData.firstName || userData.prenom || '';
                            const lastName = userData.lastName || userData.nom || '';
                            
                            if (firstName && lastName) {
                              return `${firstName} ${lastName}`;
                            } else if (firstName) {
                              return firstName;
                            } else if (lastName) {
                              return lastName;
                            } else if (userData.nom && userData.prenom) {
                              return `${userData.prenom} ${userData.nom}`;
                            } else {
                              return userData.nom || userData.prenom || 'Non renseigné';
                            }
                          })()
                          }
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Téléphone:</span>
                        <span className="ml-2 text-gray-900">
                          {userData.phoneNumber || userData.telephone || userData.phone || 'Non renseigné'}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Email:</span>
                        <span className="ml-2 text-gray-900">
                          {userData.email || 'Non renseigné'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Informations de la commande */}
                {pressingData && (
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-600" />
                      <h3 className="font-medium text-gray-900">{pressingData.businessName}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{formatAddressSafe(pressingData.address)}</p>
                    
                    {/* Informations de créneau depuis BookingCalendar */}
                    {navigationData?.collectionDateTime && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-700 font-medium">
                            Collecte: {formatDate(navigationData.collectionDateTime)}
                          </span>
                        </div>
                        {navigationData.deliveryDateTime && (
                          <div className="flex items-center space-x-2">
                            <Truck className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-700 font-medium">
                              Livraison: {formatDate(navigationData.deliveryDateTime)}
                            </span>
                          </div>
                        )}
                        {navigationData.timeSlotInfo && (
                          <div className="bg-white/50 rounded-lg p-2 mt-2">
                            <div className="text-xs text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>Créneau: {navigationData.timeSlotInfo.startTime} - {navigationData.timeSlotInfo.endTime}</span>
                              </div>
                              {navigationData.timeSlotInfo.type && (
                                <div className="mt-1">
                                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                                    {navigationData.timeSlotInfo.type === 'express' ? 'Express' : 
                                     navigationData.timeSlotInfo.type === 'premium' ? 'Premium' : 'Standard'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {Object.keys(selectedServices).length > 0 && !isLoadingServices ? (
                  <>
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">Services sélectionnés</h3>
                        <span className="text-xs text-gray-500">
                          {Object.values(selectedServices).reduce((sum, qty) => sum + qty, 0)} article{Object.values(selectedServices).reduce((sum, qty) => sum + qty, 0) > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {Object.entries(selectedServices)
                          .filter(([serviceId, quantity]) => {
                            // Filtrer les serviceId invalides
                            if (!serviceId || serviceId === 'undefined' || quantity <= 0) {
                              console.warn(`🔍 Récapitulatif - ServiceId invalide filtré:`, { serviceId, quantity });
                              return false;
                            }
                            return true;
                          })
                          .map(([serviceId, quantity]) => {
                          const serviceInfo = getServiceInfo(serviceId);
                          
                          return (
                            <div key={serviceId} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-900 text-sm">
                                      {serviceInfo.name}
                                    </span>
                                    {serviceInfo.isImported && (
                                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                        Importé
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {formatPrice(serviceInfo.price)} × {quantity}
                                  </div>
                                  {serviceInfo.preparation && (
                                    <div className="text-xs text-blue-600 mt-1 flex items-center">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {serviceInfo.preparation}
                                    </div>
                                  )}
                                </div>
                                <span className="font-semibold text-gray-900">
                                  {formatPrice(serviceInfo.price * quantity)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    
                    <div className="border-t border-gray-200 pt-4 mt-4 space-y-3">
                      {/* Sous-total */}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Sous-total</span>
                        <span className="text-gray-900">{formatPrice(calculateSubtotal())}</span>
                      </div>
                      
                      {/* Frais de livraison */}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Livraison</span>
                        <span className={calculateDeliveryFee() === 0 ? 'text-green-600 font-medium' : 'text-gray-900'}>
                          {calculateDeliveryFee() === 0 ? (
                            <span className="flex items-center">
                              🎉 Gratuite
                            </span>
                          ) : (
                            formatPrice(calculateDeliveryFee())
                          )}
                        </span>
                      </div>
                      
                      {/* Frais de service */}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Frais de service</span>
                        <span className="text-gray-900">{formatPrice(calculateServiceFee())}</span>
                      </div>
                      
                      {/* Total final */}
                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex justify-between font-semibold text-lg">
                          <span className="text-gray-900">Total</span>
                          <span className="text-blue-600">{formatPrice(calculateTotal())}</span>
                        </div>
                      </div>
                      
                      {/* Message informatif */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-xs text-green-700 flex items-center">
                          <Info className="w-3 h-3 mr-1" />
                          {calculateDeliveryFee() === 0 ? (
                            'Félicitations ! Vous bénéficiez de la livraison gratuite'
                          ) : (
                            `Plus que ${formatPrice(5000 - calculateSubtotal())} pour la livraison gratuite`
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    disabled={isSubmitting || Object.keys(selectedServices).length === 0}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center space-x-3">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Traitement en cours...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <CreditCard className="w-5 h-5" />
                        <span>Procéder au paiement</span>
                      </div>
                    )}
                  </Button>
                </>
                ) : Object.keys(selectedServices).length > 0 && isLoadingServices ? (
                  <div className="text-center py-6">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <p className="text-gray-500">Chargement des informations des services...</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500">Sélectionnez des services pour voir le récapitulatif</p>
                  </div>
                )}
              
              {errors.root && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                  <h4 className="text-sm font-medium text-red-800 mb-1">Erreur</h4>
                  <p className="text-sm text-red-600">
                    {typeof errors.root === 'object' && 'message' in errors.root 
                      ? errors.root.message 
                      : 'Une erreur est survenue. Veuillez réessayer.'}
                  </p>
                </div>
              )}
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <CreditCard className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Moyens de paiement acceptés</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="h-8 w-full flex items-center justify-center bg-orange-100 rounded">
                    <span className="text-orange-600 font-semibold text-xs">Orange Money</span>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="h-8 w-full flex items-center justify-center bg-yellow-100 rounded">
                    <span className="text-yellow-600 font-semibold text-xs">MTN MoMo</span>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="h-8 w-full flex items-center justify-center bg-blue-100 rounded">
                    <span className="text-blue-600 font-semibold text-xs">Wave</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 p-3 bg-green-100 rounded-lg">
                <Info className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700">
                  Paiement sécurisé après confirmation de votre commande
                </p>
              </div>
            </div>
          </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderCreatePage;
