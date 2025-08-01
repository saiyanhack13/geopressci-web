import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, 
  Clock, 
  Phone, 
  Navigation, 
  RefreshCw, 
  Package, 
  Truck, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Star,
  Home,
  Wifi,
  WifiOff
} from 'lucide-react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import { Order } from '../../types';
import { useGetOrderByIdQuery } from '../../services/api';

// Configuration des icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
const ABIDJAN_CENTER: [number, number] = [5.336_389, -4.027_778];

const pressingLocation: [number, number] = [5.359952, -4.008256]; // Plateau
const deliveryLocation: [number, number] = [5.321072, -3.996118]; // Marcory

const OrderTrackingPage: React.FC = () => {
  const { id: orderId } = useParams<{ id: string }>();
  
  // Valider que l'ID est un ObjectId MongoDB valide
  const isValidObjectId = orderId && /^[0-9a-fA-F]{24}$/.test(orderId);
  
  // Récupération des données de commande avec polling pour le suivi temps réel
  const { 
    data: order, 
    isLoading, 
    error, 
    refetch 
  } = useGetOrderByIdQuery(orderId!, {
    skip: !orderId || !isValidObjectId, // Skip si pas d'ID ou ID invalide
    pollingInterval: 30000, // Polling toutes les 30 secondes
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true
  });

  const [status, setStatus] = useState<string>('processing');
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);

  // Gestion du statut en ligne/hors ligne
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('🟢 Connexion rétablie - Mise à jour du suivi');
      refetch();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('🔴 Connexion perdue - Suivi en mode hors ligne');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refetch]);

  // Détection des changements de statut pour notifications
  useEffect(() => {
    if (order && previousStatus && order.status !== previousStatus) {
      const messages: Record<string, string> = {
        'confirmed': '✅ Votre commande a été confirmée',
        'processing': '📦 Votre commande est en cours de préparation',
        'ready': '🎉 Votre commande est prête !',
        'shipping': '🚚 Votre commande est en cours de livraison',
        'delivered': '✅ Votre commande a été livrée avec succès !',
        'cancelled': '❌ Votre commande a été annulée'
      };
      
      const message = messages[order.status || order.statut || 'en_attente'];
      if (message) {
        toast.success(message);
        setLastUpdate(new Date());
      }
    }
    
    if (order) {
      setPreviousStatus(order.status || order.statut || null);
    }
  }, [order, previousStatus]);

  // Initialisation et gestion de la carte
  useEffect(() => {
    if (!mapRef.current || map) return;

    // Initialiser la carte
    const newMap = new L.Map(mapRef.current!).setView(ABIDJAN_CENTER, 12);
    
    new L.TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(newMap);

    setMap(newMap);

    // Ajouter les marqueurs
    if (order) {
      // Marqueur du pressing
      const pressingMarker = new L.Marker(pressingLocation)
        .addTo(newMap)
        .bindPopup(`
          <div class="p-2">
            <h3 class="font-bold">${order.pressingName || 'Pressing'}</h3>
            <p class="text-sm text-gray-600">Lieu de traitement</p>
          </div>
        `);

      // Marqueur de livraison
      const deliveryMarker = new L.Marker(deliveryLocation)
        .addTo(newMap)
        .bindPopup(`
          <div class="p-2">
            <h3 class="font-bold">Adresse de livraison</h3>
            <p class="text-sm text-gray-600">${typeof order.adresseLivraison === 'string' ? order.adresseLivraison : order.deliveryAddress || 'Adresse non disponible'}</p>
          </div>
        `);

      // Marqueur du livreur (si en cours de livraison)
      if (order.status === 'en_livraison' || order.statut === 'en_livraison') {
        const deliveryTruckMarker = new L.Marker(
          [pressingLocation[0] + 0.01, pressingLocation[1] + 0.01]
        )
        .addTo(newMap)
        .bindPopup(`
          <div class="p-2">
            <h3 class="font-bold">🚚 Livreur en route</h3>
            <p class="text-sm text-gray-600">Temps estimé: 15-30 min</p>
          </div>
        `);
        
        setMarker(deliveryTruckMarker);
      }

      // Ajuster la vue pour inclure tous les marqueurs
      const group = new L.FeatureGroup([pressingMarker, deliveryMarker]);
      newMap.fitBounds(group.getBounds().pad(0.1));
    }

    return () => {
      if (newMap) {
        newMap.remove();
      }
    };
  }, [order]);

  // Fonction de rafraîchissement manuel
  const handleRefresh = async () => {
    try {
      setCurrentLocation(order?.deliveryAddress || order?.adresseLivraison || null);
      await refetch?.();
      setLastUpdate(new Date());
      toast.success('🔄 Données mises à jour');
    } catch (error) {
      toast.error('❌ Erreur lors de la mise à jour');
      console.error('Refresh error:', error);
    }
  };

  // Mapping des statuts backend vers frontend
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { text: string; icon: React.ReactElement; color: string; key: string }> = {
      'pending': { text: 'En attente', icon: <Clock className="w-5 h-5" />, color: 'yellow', key: 'pending' },
      'confirmed': { text: 'Confirmée', icon: <CheckCircle className="w-5 h-5" />, color: 'blue', key: 'confirmed' },
      'processing': { text: 'En préparation', icon: <Package className="w-5 h-5" />, color: 'blue', key: 'processing' },
      'ready': { text: 'Prête', icon: <CheckCircle className="w-5 h-5" />, color: 'green', key: 'ready' },
      'shipping': { text: 'En livraison', icon: <Truck className="w-5 h-5" />, color: 'purple', key: 'shipping' },
      'delivered': { text: 'Livrée', icon: <CheckCircle className="w-5 h-5" />, color: 'green', key: 'delivered' },
      'cancelled': { text: 'Annulée', icon: <Package className="w-5 h-5" />, color: 'red', key: 'cancelled' }
    };
    return statusMap[status] || statusMap['pending'];
  };

  const currentStatus = order?.status || order?.statut || 'pending';
  const statusInfo = getStatusInfo(currentStatus);

  // Gestion des états de chargement et d'erreur
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des informations de suivi...</p>
        </div>
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Commande introuvable</h1>
          <Link to="/client/orders" className="text-blue-600 hover:text-blue-800">
            Retour à mes commandes
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Erreur de chargement</p>
            <p>Impossible de récupérer les informations de la commande</p>
          </div>
          <button 
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-4"
          >
            Réessayer
          </button>
          <Link to="/client/orders" className="text-blue-600 hover:text-blue-800">
            Retour à mes commandes
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Commande introuvable</h1>
          <Link to="/client/orders" className="text-blue-600 hover:text-blue-800">
            Retour à mes commandes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        {/* Header avec navigation et contrôles */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/client/orders" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à mes commandes
          </Link>
          
          <div className="flex items-center space-x-3">
            {/* Indicateur de connexion */}
            <div className={`flex items-center space-x-1 text-sm ${
              isOnline ? 'text-green-600' : 'text-red-600'
            }`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span>{isOnline ? 'En ligne' : 'Hors ligne'}</span>
            </div>
            
            {/* Bouton de rafraîchissement */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* En-tête de la commande */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">Commande #{order.reference || order.id}</h1>
                <p className="text-blue-100">
                  Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                statusInfo.color === 'green' ? 'bg-green-500' :
                statusInfo.color === 'purple' ? 'bg-purple-500' :
                statusInfo.color === 'red' ? 'bg-red-500' :
                statusInfo.color === 'yellow' ? 'bg-yellow-500' : 'bg-blue-500'
              }`}>
                {statusInfo.text}
              </div>
            </div>
          </div>

          {/* Carte de suivi */}
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">📍 Localisation en temps réel</h2>
              <div 
                ref={mapRef}
                className="h-80 w-full rounded-lg bg-gray-100 border-2 border-gray-200"
              ></div>
              <p className="text-sm text-gray-500 text-center mt-2">
                {currentStatus === 'processing' 
                  ? '🏭 Votre commande est en cours de préparation au pressing' 
                  : currentStatus === 'shipping' 
                    ? '🚚 Votre livreur est en route vers votre adresse' 
                    : currentStatus === 'delivered'
                      ? '✅ Votre commande a été livrée avec succès'
                      : currentStatus === 'ready'
                        ? '🎉 Votre commande est prête pour la livraison'
                        : '📦 Suivi de votre commande en temps réel'}
              </p>
            </div>

            <div className={`mt-6 p-4 rounded-lg bg-${statusInfo.color}-100 text-${statusInfo.color}-800 flex items-center`}>
              <div className="w-5 h-5 mr-2">
                {statusInfo.icon}
              </div>
              <p className="font-bold">{statusInfo.text}</p>
            </div>

            {/* Timeline */}
            <div className="mt-8 space-y-6">
              <div 
                className={`flex items-start mb-6 ${
                  currentStatus === 'processing' ? 'bg-blue-100 text-blue-700' :
                  currentStatus === 'shipping' ? 'bg-purple-100 text-purple-700' :
                  currentStatus === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-blue-500 text-white">
                  <Package className="w-5 h-5" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-blue-700">Commande en traitement</h3>
                  <p className="text-sm text-gray-600">Le pressing prépare vos articles.</p>
                </div>
              </div>
              <div 
                className={`flex items-start mb-6 ${
                  currentStatus === 'shipping' ? 'bg-purple-100 text-purple-700' :
                  currentStatus === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-purple-500 text-white">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-purple-700">Livraison en cours</h3>
                  <p className="text-sm text-gray-600">Votre livreur est en route.</p>
                </div>
              </div>
              <div 
                className={`flex items-start mb-6 ${
                  currentStatus === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-green-500 text-white">
                  <Home className="w-5 h-5" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-green-700">Commande livrée</h3>
                  <p className="text-sm text-gray-600">Vos articles sont arrivés !</p>
                </div>
              </div>
            </div>

            {/* Pressing Info */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3">Informations du pressing</h3>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">📍 Adresse de livraison</h3>
                  <p className="text-gray-600">{typeof order.deliveryAddress === 'string' ? order.deliveryAddress : 'Adresse de livraison non disponible'}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">🏪 Pressing</h3>
                  <h3 className="font-semibold text-gray-900">{typeof order.pressing === 'object' ? (order.pressing?.businessName || order.pressing?.nom) : order.pressing || 'Pressing'}</h3>
                  <p className="text-gray-600">{typeof order.pressing === 'object' && order.pressing?.addresses && order.pressing.addresses.length > 0 ? `${order.pressing.addresses[0].street || ''}, ${order.pressing.addresses[0].city || ''}` : 'Adresse non disponible'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
