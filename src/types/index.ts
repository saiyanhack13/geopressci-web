export enum MobileMoneyProvider {
  ORANGE_MONEY = 'orangemoney',
  MTN_MONEY = 'mtnmomo',
  MOOV_MONEY = 'moovmoney',
  WAVE = 'wave',
  CARD = 'card',
}

export enum AbidjanNeighborhood {
  COCODY = 'Cocody',
  PLATEAU = 'Plateau',
  TREICHVILLE = 'Treichville',
  MARCORY = 'Marcory',
  PORT_BOUET = 'Port-Bouët',
  KOUMASSI = 'Koumassi',
  ADJAME = 'Adjamé',
  YOPOUGON = 'Yopougon',
  ABOBO = 'Abobo',
  ATTECOUBE = 'Attécoubé',
}

export enum OrderStatus {
  EN_ATTENTE = 'en_attente', // Client vient de passer la commande
  CONFIRMEE = 'confirmee', // Pressing a accepté la commande
  ANNULEE = 'annulee', // Annulée par le client ou le pressing
  COLLECTE_PLANIFIEE = 'collecte_planifiee', // Le livreur va chercher le linge
  EN_COLLECTE = 'en_collecte', // Le livreur est en route
  COLLECTEE = 'collectee', // Linge au pressing
  EN_TRAITEMENT = 'en_traitement', // Lavage, séchage, repassage
  TRAITEMENT_TERMINE = 'traitement_termine', // Prêt pour livraison
  LIVRAISON_PLANIFIEE = 'livraison_planifiee', // Le livreur va ramener le linge
  EN_LIVRAISON = 'en_livraison', // Le livreur est en route
  LIVREE = 'livree', // Le client a reçu son linge
  RETOURNEE = 'retournee', // Livraison échouée, linge retourné
}

export interface Geolocation {
  lat: number;
  lng: number;
}

export interface Address {
  _id?: string;
  id?: string;
  street: string;
  city: string;
  state?: string;
  zipCode?: string;
  country: string;
  isDefault?: boolean;
  location?: Geolocation;
  details?: string;
  label?: 'home' | 'work' | 'other';
  type?: string;
  neighborhood?: string;
}

export interface User {
  _id?: string; // From MongoDB
  id?: string; // Kept for frontend-specific uses
  nom: string;
  prenom: string;
  firstName?: string; // Legacy compatibility
  lastName?: string; // Legacy compatibility
  email: string;
  telephone: string;
  phone?: string; // Legacy compatibility
  role: 'client' | 'pressing' | 'admin';
  addresses?: Address[];
  address: string; // Required for pressings
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
    loginAlerts?: boolean;
    sessionTimeout?: number;
    biometric?: boolean;
  };
}

export enum PressingServiceCategory {
  LAVAGE = 'lavage',
  REPASSAGE = 'repassage',
  NETTOYAGE_SEC = 'nettoyage_sec',
  RETOUCHE = 'retouche',
  AUTRE = 'autre',
}

export interface PressingService {
  _id: string; // Identifiant MongoDB
  id?: string; // Garder id pour compatibilité si nécessaire
  
  // Champs principaux (correspondant à la BD)
  nom: string; // Nom du service
  description: string; // Description détaillée
  prix: number; // Prix en FCFA
  categorie: string; // Catégorie du service
  dureeMoyenne: number; // Durée moyenne en heures
  disponible: boolean; // Disponibilité du service
  validite: number; // Validité en jours
  
  // Références
  pressing: string; // ID du pressing
  createdBy: string; // ID du créateur
  updatedBy?: string; // ID du dernier modificateur
  
  // Options et médias
  options: any[]; // Options du service
  images: string[]; // URLs des images
  
  // Métadonnées temporelles
  createdAt: string; // Date de création
  updatedAt: string; // Date de dernière modification
  __v?: number; // Version MongoDB
  
  // Champs de compatibilité (pour l'ancien format)
  name?: string; // Alias pour nom
  price?: number; // Alias pour prix
  category?: PressingServiceCategory | string; // Alias pour categorie
  duration?: string | number; // Alias pour dureeMoyenne
  preparation?: string;
  isAvailable?: boolean; // Alias pour disponible
  popularity?: number; // Score de popularité
}

export interface BusinessInfo {
  registrationNumber?: string;
  taxId?: string;
  website?: string;
}

export interface Verification {
  status: 'pending' | 'approved' | 'rejected';
  documentUrl?: string;
  rejectionReason?: string;
}

export interface Pressing extends User { // Pressing extends User now
  location: {
    coordinates: [number, number];
    type: 'Point';
  };
  name: string;
  businessName: string;
  businessInfo: BusinessInfo;
  services: PressingService[];
  openingHours: {
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    open: string;
    close: string;
  }[];
  rating: number;
  photos: string[];
  subscription: {
    plan: 'basic' | 'premium' | 'enterprise';
    status: 'active' | 'inactive' | 'trial';
    endDate: string;
  };
  verification: Verification;
  priceRange: 'low' | 'medium' | 'high';
  deliveryTime: string;
  distance: number;
  isOpen: boolean;
}

export interface OrderPressingInfo {
  name: string;
  address: string;
  phone: string;
}

export interface DeliveryInfo {
  address: string;
  instructions: string;
}

export interface OrderItem {
  serviceId: string;
  serviceName?: string;
  price?: number;
  quantity: number;
  total?: number;
}

export interface Order {
  _id?: string;
  id?: string;
  reference?: string; // Backend uses 'reference' instead of 'orderNumber'
  client?: string | User;
  customer?: {
    _id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
  };
  pressing?: string | Pressing;
  pressingName?: string;
  articles?: Array<{
    service: string;
    quantite: number;
    quantity?: number;
    prixUnitaire: number;
    instructions?: string;
  }>; // Backend uses 'articles' instead of 'items'
  items?: OrderItem[];
  montantTotal?: number; // Backend uses 'montantTotal' instead of 'totalAmount'
  // Structure de paiement backend
  payment?: {
    amount: {
      total: number;
      subtotal?: number;
      tax?: number;
      fees?: number;
    };
    method: string;
    status: string;
    refunds?: any[];
  };
  statut?: string; // Backend uses 'statut' instead of 'status'
  adresseLivraison?: string; // Backend uses 'adresseLivraison'
  deliveryAddress?: string;
  serviceType?: 'delivery' | 'pickup' | 'store_pickup' | 'store_dropoff'; // Type de service
  dateRecuperationSouhaitee?: string; // Backend field
  instructionsSpeciales?: string; // Backend field
  dateCreation?: string; // Backend uses 'dateCreation' instead of 'createdAt'
  dateMiseAJour?: string; // Backend uses 'dateMiseAJour' instead of 'updatedAt'
  historiqueStatuts?: Array<{
    statut: string;
    date: string;
    notes?: string;
  }>; // Backend uses 'historiqueStatuts' instead of 'trackingHistory'
  // Legacy fields for compatibility
  orderNumber?: string;
  totalAmount?: number;
  total?: number;
  status?: OrderStatus;
  createdAt?: string;
  updatedAt?: string;
  estimatedDelivery?: string;
  fees?: {
    service: number;
    delivery: number;
    total: number;
  };
  trackingHistory?: {
    status: OrderStatus;
    timestamp: string;
    notes?: string;
  }[];
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

export interface Payment {
  _id?: string;
  id: string;
  order: string | Order;
  amount: number;
  provider: MobileMoneyProvider;
  transactionId: string;
  status: PaymentStatus;
  paymentMethodDetails?: any;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'mobile_money' | 'bank_transfer';
  provider: string;
  last4?: string;
  phoneNumber?: string;
  accountName?: string;
  expiryDate?: string;
  isDefault: boolean;
  isVerified: boolean;
  addedDate: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planName: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'cancelled' | 'expired';
}

export interface NotificationSetting {
  id: string;
  type: string;
  title: string;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface NotificationSettings {
  push?: boolean;
  email?: boolean;
  sms?: boolean;
  marketing?: boolean;
  orders?: boolean;
  promotions?: boolean;
}

export interface PrivacySettings {
  profileVisibility?: 'public' | 'private';
  dataSharing?: boolean;
  analytics?: boolean;
  locationTracking?: boolean;
}

export interface SecuritySettings {
  twoFactorAuth?: boolean;
  loginAlerts?: boolean;
  sessionTimeout?: number;
  biometric?: boolean;
}

export interface SettingsItem {
  id: string;
  type: 'toggle' | 'select' | 'button' | 'link' | 'action' | 'navigation';
  label: string;
  description?: string;
  value?: any;
  options?: any[];
  icon?: React.ReactNode;
  category: 'notifications' | 'privacy' | 'security' | 'account' | 'payment' | 'preferences' | 'data' | 'support';
  key: string;
  danger?: boolean;
  disabled?: boolean;
  action?: () => void;
}

export interface SearchFilters {
  neighborhoods: string[];
  services: string[];
  priceRange: [number, number];
  rating: number;
  distance?: number;
  neighborhood?: string;
  isOpen?: boolean;
  openNow: boolean;
  hasDelivery: boolean;
  hasPickup: boolean;
  distanceRange: [number, number];
}
