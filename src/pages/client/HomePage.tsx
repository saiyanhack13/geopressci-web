import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { MapPin, Search, Filter, Star, Clock, Zap, ArrowRight, Users, ShoppingBag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PressingCard from '../../components/ui/Card/PressingCard';
import QuickLinks from '../../components/navigation/QuickLinks';
import { useAuth } from '../../hooks/useAuth';
import { useGetNearbyPressingsQuery, useLazyGetNearbyPressingsQuery } from '../../services/api';
import { Pressing } from '../../types';

// Quartiers populaires d'Abidjan
const ABIDJAN_NEIGHBORHOODS = [
  'Cocody', 'Plateau', 'Yopougon', 'Adjamé', 'Treichville',
  'Marcory', 'Koumassi', 'Port-Bouët', 'Attécoubé', 'Abobo'
];

const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lon: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    maxDistance: 5,
    minRating: 0,
    services: [] as string[],
    priceRange: 'all' as 'low' | 'medium' | 'high' | 'all'
  });
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  // Hook pour charger les pressings à proximité
  const [getNearbyPressings, { data: nearbyPressings, isLoading: nearbyLoading, error: nearbyError }] = useLazyGetNearbyPressingsQuery();

  const handleSearch = () => {
    if (searchQuery.trim() !== '') {
      const params = new URLSearchParams({
        q: searchQuery,
        ...(currentLocation && {
          lat: currentLocation.lat.toString(),
          lon: currentLocation.lon.toString()
        }),
        maxDistance: filters.maxDistance.toString(),
        minRating: filters.minRating.toString(),
        priceRange: filters.priceRange
      });
      if (filters.services.length > 0) {
        params.append('services', filters.services.join(','));
      }
      navigate(`/client/search?${params.toString()}`);
    }
  };

  const handleGeolocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lon: longitude });
          
          try {
            // Charger les pressings à proximité avec l'API backend
            await getNearbyPressings({
              location: {
                lat: latitude,
                lng: longitude
              },
              radius: filters.maxDistance
            }).unwrap();
            toast.success('📍 Position détectée ! Pressings à proximité chargés');
          } catch (error) {
            console.error('Erreur lors du chargement des pressings:', error);
            toast.error('Erreur lors du chargement des pressings à proximité');
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error("Erreur de géolocalisation: ", error);
          setLoading(false);
          toast.error("Impossible d'obtenir votre position. Veuillez vérifier les autorisations.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      toast.error("La géolocalisation n'est pas supportée par votre navigateur.");
    }
  };



  const handleNeighborhoodSelect = (neighborhood: string) => {
    setSearchQuery(neighborhood);
    handleSearch();
  };

  // Géolocalisation automatique au chargement
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lon: longitude });
          // Charger automatiquement les pressings à proximité
          getNearbyPressings({
            location: {
              lat: latitude,
              lng: longitude
            },
            radius: filters.maxDistance
          }).catch(console.error);
        },
        () => {}, // Ignore les erreurs pour la géolocalisation automatique
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - UI/UX 2025 */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6 leading-tight">
              Trouvez le pressing parfait 👕
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-blue-100 mb-4 sm:mb-6 lg:mb-8 max-w-2xl mx-auto leading-relaxed">
              Découvrez les meilleurs pressings d'Abidjan, réservez en ligne et suivez vos commandes en temps réel
            </p>
          </div>

          {/* Search Section */}
          <div className="w-full max-w-4xl mx-auto mb-4 sm:mb-6 lg:mb-8">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl mobile-card">
              {/* Search Bar - UI/UX 2025 */}
              <div className="p-4 sm:p-6">
                <div className="relative flex items-center bg-gray-50 rounded-full p-2 mb-3 sm:mb-4 touch-target">
                  <Input
                    type="text"
                    placeholder="Entrez un quartier (ex: Cocody, Plateau...)"
                    className="flex-grow bg-transparent border-none focus:ring-0 text-sm sm:text-base lg:text-lg pl-3 sm:pl-4 pr-8 sm:pr-12 mobile-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    aria-label="Rechercher un pressing par quartier"
                  />
                  <Button 
                    onClick={() => setShowFilters(!showFilters)} 
                    variant="ghost" 
                    size="icon"
                    className="mr-1 sm:mr-2 touch-target min-w-[44px] min-h-[44px]"
                    aria-label="Afficher les filtres"
                  >
                    <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <Button 
                    onClick={handleSearch} 
                    className="rounded-full touch-target min-w-[44px] min-h-[44px] bg-blue-600 hover:bg-blue-700" 
                    size="icon"
                    aria-label="Rechercher"
                  >
                    <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>

                {/* Quick Actions - UI/UX 2025 */}
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <Button 
                    variant="outline"
                    onClick={handleGeolocation} 
                    disabled={loading}
                    className="flex items-center gap-2 touch-target text-sm sm:text-base min-w-[44px] min-h-[44px] px-4 py-2"
                    aria-label="Détecter ma position"
                  >
                    <MapPin className="h-4 w-4" />
                    {loading ? 'Localisation...' : 'Ma position'}
                  </Button>
                  {currentLocation && (
                    <span className="text-xs sm:text-sm text-green-600 flex items-center gap-1 px-2">
                      📍 Position détectée
                    </span>
                  )}
                </div>

                {/* Filters - UI/UX 2025 */}
                {showFilters && (
                  <div className="border-t pt-4 sm:pt-6 mt-4 sm:mt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700" htmlFor="distance-filter">
                          Distance max
                        </label>
                        <select 
                          id="distance-filter"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[44px]"
                          value={filters.maxDistance}
                          onChange={(e) => setFilters({...filters, maxDistance: Number(e.target.value)})}
                          aria-label="Sélectionner la distance maximale"
                        >
                          <option value={2}>2 km</option>
                          <option value={5}>5 km</option>
                          <option value={10}>10 km</option>
                          <option value={20}>20 km</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700" htmlFor="rating-filter">
                          Note minimum
                        </label>
                        <select 
                          id="rating-filter"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[44px]"
                          value={filters.minRating}
                          onChange={(e) => setFilters({...filters, minRating: Number(e.target.value)})}
                          aria-label="Sélectionner la note minimale"
                        >
                          <option value={0}>Toutes les notes</option>
                          <option value={3}>3+ ⭐</option>
                          <option value={4}>4+ ⭐</option>
                          <option value={4.5}>4.5+ ⭐</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700" htmlFor="price-filter">
                          Gamme de prix
                        </label>
                        <select 
                          id="price-filter"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[44px]"
                          value={filters.priceRange}
                          onChange={(e) => setFilters({...filters, priceRange: e.target.value as any})}
                          aria-label="Sélectionner la gamme de prix"
                        >
                          <option value="all">Tous les prix</option>
                          <option value="low">💰 Économique</option>
                          <option value="medium">💰💰 Moyen</option>
                          <option value="high">💰💰💰 Premium</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Popular Neighborhoods - UI/UX 2025 */}
        <div className="mb-6 sm:mb-8 lg:mb-12">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
              🏘️ Quartiers populaires d'Abidjan
            </h2>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {ABIDJAN_NEIGHBORHOODS.map((neighborhood) => (
                <Button
                  key={neighborhood}
                  variant="outline"
                  onClick={() => handleNeighborhoodSelect(neighborhood)}
                  className="hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200 min-w-[44px] min-h-[44px] text-sm sm:text-base px-4 py-2 border-gray-300"
                  aria-label={`Rechercher dans le quartier ${neighborhood}`}
                >
                  {neighborhood}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Nearby Pressings - UI/UX 2025 */}
        {nearbyPressings && nearbyPressings.length > 0 && (
          <div className="mb-6 sm:mb-8 lg:mb-12">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
                📍 Pressings à proximité
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {nearbyPressings.map((pressing) => (
                  <PressingCard key={pressing.id || pressing._id} pressing={{
                    ...pressing,
                    id: pressing.id || pressing._id || '',
                    name: pressing.name || pressing.businessName || 'Pressing sans nom',
                    rating: pressing.rating || 4.5,
                    priceRange: pressing.priceRange || 'medium',
                    isOpen: pressing.isOpen || false,
                    addresses: pressing.addresses || [],
                    services: pressing.services?.map(service => service.name || service.nom || 'Service').filter(Boolean) || []
                  }} />
                ))}
              </div>
              <div className="text-center mt-6 sm:mt-8">
                <Button 
                  onClick={() => navigate('/client/search')}
                  className="bg-blue-600 hover:bg-blue-700 transition-colors duration-200 min-w-[44px] min-h-[44px] text-sm sm:text-base px-6 py-3 rounded-lg"
                  aria-label="Voir tous les pressings disponibles"
                >
                  Voir tous les pressings
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Liens rapides pour utilisateurs connectés */}
        {isAuthenticated && (
          <div className="mt-8 lg:mt-12">
            <QuickLinks 
              title={user?.role === 'pressing' ? "Gestion de votre Pressing" : user?.role === 'admin' ? "Administration" : "Actions Rapides"}
              maxItems={6}
              className=""
            />
          </div>
        )}

        {/* Navigation contextuelle pour utilisateurs non connectés */}
        {!isAuthenticated && (
          <div className="mt-8 lg:mt-12">
            <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl p-6 lg:p-8">
              <div className="text-center mb-6">
                <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                  Rejoignez GeoPressci dès maintenant ! 🚀
                </h3>
                <p className="text-gray-600">
                  Découvrez tous les avantages de notre plateforme de pressing
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                {/* Pour les clients */}
                <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-center">
                    <div className="text-3xl mb-3">👤</div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Je suis un Client</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Trouvez des pressings près de vous et gérez vos commandes facilement
                    </p>
                    <div className="space-y-2">
                      <Link
                        to="/register-client"
                        className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                      >
                        S'inscrire Client
                      </Link>
                      <Link
                        to="/search"
                        className="block w-full border border-blue-600 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition-colors font-medium"
                      >
                        Explorer les Pressings
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Pour les pressings */}
                <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-center">
                    <div className="text-3xl mb-3">🏪</div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Je suis un Pressing</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Développez votre activité et gérez vos commandes en ligne
                    </p>
                    <div className="space-y-2">
                      <Link
                        to="/register-pressing"
                        className="block w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors font-medium"
                      >
                        Rejoindre la Plateforme
                      </Link>
                      <Link
                        to="/login"
                        className="block w-full border border-orange-600 text-orange-600 px-4 py-2 rounded-md hover:bg-orange-50 transition-colors font-medium"
                      >
                        Se Connecter
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-8 lg:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mobile-grid">
          <div className="text-center mobile-card bg-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
               onClick={() => navigate('/search')}>
            <div className="text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-3 lg:mb-4">⚡</div>
            <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-1 sm:mb-2">Service Express</h3>
            <p className="text-xs sm:text-sm lg:text-base text-gray-600">Livraison en 2h pour vos urgences</p>
            <div className="mt-3 text-blue-600 text-sm font-medium flex items-center justify-center">
              Découvrir <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>
          <div className="text-center mobile-card bg-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
               onClick={() => navigate(isAuthenticated ? '/client/orders' : '/register-client')}>
            <div className="text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-3 lg:mb-4">🚚</div>
            <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-1 sm:mb-2">Livraison Gratuite</h3>
            <p className="text-xs sm:text-sm lg:text-base text-gray-600">À domicile dans tout Abidjan</p>
            <div className="mt-3 text-blue-600 text-sm font-medium flex items-center justify-center">
              {isAuthenticated ? 'Mes Commandes' : 'Commencer'} <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>
          <div className="text-center mobile-card bg-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg hover:shadow-xl transition-shadow cursor-pointer sm:col-span-2 lg:col-span-1"
               onClick={() => navigate(isAuthenticated ? '/client/payment-methods' : '/register-client')}>
            <div className="text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-3 lg:mb-4">💳</div>
            <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-1 sm:mb-2">Paiement Mobile</h3>
            <p className="text-xs sm:text-sm lg:text-base text-gray-600">Orange Money, MTN, Moov acceptés</p>
            <div className="mt-3 text-blue-600 text-sm font-medium flex items-center justify-center">
              {isAuthenticated ? 'Mes Paiements' : 'En savoir plus'} <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </div>

        {/* Navigation vers toutes les sections principales */}
        <div className="mt-8 lg:mt-12 bg-gray-50 rounded-xl p-6 lg:p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
              Explorez toutes nos fonctionnalités 🌟
            </h3>
            <p className="text-gray-600">
              Accédez rapidement à toutes les sections de GeoPressci
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <Link
              to="/search"
              className="flex flex-col items-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow group"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🔍</div>
              <span className="text-sm font-medium text-gray-900 text-center">Rechercher</span>
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link
                  to={user?.role === 'pressing' ? '/pressing/dashboard' : user?.role === 'admin' ? '/admin/dashboard' : '/client/dashboard'}
                  className="flex flex-col items-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow group"
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📊</div>
                  <span className="text-sm font-medium text-gray-900 text-center">Dashboard</span>
                </Link>
                <Link
                  to={user?.role === 'pressing' ? '/pressing/orders' : user?.role === 'admin' ? '/admin/orders' : '/client/orders'}
                  className="flex flex-col items-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow group"
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📦</div>
                  <span className="text-sm font-medium text-gray-900 text-center">Commandes</span>
                </Link>
                <Link
                  to={user?.role === 'pressing' ? '/pressing/profile' : user?.role === 'admin' ? '/admin/settings' : '/client/profile'}
                  className="flex flex-col items-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow group"
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">👤</div>
                  <span className="text-sm font-medium text-gray-900 text-center">Profil</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register-client"
                  className="flex flex-col items-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow group"
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">✨</div>
                  <span className="text-sm font-medium text-gray-900 text-center">S'inscrire</span>
                </Link>
                <Link
                  to="/login"
                  className="flex flex-col items-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow group"
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🔑</div>
                  <span className="text-sm font-medium text-gray-900 text-center">Connexion</span>
                </Link>
                <Link
                  to="/register-pressing"
                  className="flex flex-col items-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow group"
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🏪</div>
                  <span className="text-sm font-medium text-gray-900 text-center">Pressing</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
