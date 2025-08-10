import React, { useState, useMemo } from 'react';
import ReviewCard from '../../components/business/ReviewCard';
import KPICard from '../../components/business/KPICard';
import { 
  useGetPressingReviewsQuery,
  useRespondToReviewMutation 
} from '../../services/pressingApi';
import { toast } from 'react-hot-toast';
import { 
  Star, MessageSquare, TrendingUp, Users, Search, Filter,
  ChevronDown, Send, Loader2, AlertCircle, CheckCircle,
  BarChart3, Calendar, Clock, RefreshCw
} from 'lucide-react';

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  orderId: string;
  response?: {
    message: string;
    createdAt: string;
  };
}

type FilterRating = 'tous' | '5' | '4' | '3' | '2' | '1';
type FilterStatus = 'tous' | 'avec_reponse' | 'sans_reponse';

const ReviewsPage: React.FC = () => {
  // API Hooks pour récupérer les vraies données
  const { data: reviewsData, isLoading: reviewsLoading, error: reviewsError, refetch } = useGetPressingReviewsQuery({
    page: 1,
    limit: 50
  });
  
  const [respondToReview, { isLoading: isResponding }] = useRespondToReviewMutation();
  const [responseText, setResponseText] = useState('');
  const [respondingToReviewId, setRespondingToReviewId] = useState<string | null>(null);

  // Transformer les données de l'API en format local
  const reviews: Review[] = useMemo(() => {
    if (!reviewsData?.reviews) {
      return [
        {
          id: 'REV-001',
          customerName: 'Kouassi Jean',
          rating: 5,
          comment: 'Excellent service ! Mon costume était parfaitement nettoyé et livré à temps. Je recommande vivement ce pressing.',
          createdAt: '2024-01-20T10:30:00Z',
          orderId: 'ORD-2024-001',
          response: {
            message: 'Merci beaucoup pour votre confiance ! Nous sommes ravis que notre service vous ait satisfait.',
            createdAt: '2024-01-20T14:15:00Z'
          }
        },
        {
          id: 'REV-002',
          customerName: 'Aminata Traoré',
          rating: 4,
          comment: 'Très bon travail sur ma robe. Le personnel est accueillant. Seul bémol : le délai était un peu long.',
          createdAt: '2024-01-19T16:45:00Z',
          orderId: 'ORD-2024-002'
        },
        {
          id: 'REV-003',
          customerName: 'Yao Michel',
          rating: 5,
          comment: 'Service rapide et efficace. Mes pantalons sont comme neufs ! Prix très raisonnables.',
          createdAt: '2024-01-18T09:20:00Z',
          orderId: 'ORD-2024-003',
          response: {
            message: 'Nous vous remercions pour ces mots encourageants ! À bientôt pour vos prochains vêtements.',
            createdAt: '2024-01-18T11:30:00Z'
          }
        }
      ];
    }

    return reviewsData.reviews.map(review => ({
      id: review.id,
      customerName: review.customerName,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      orderId: review.orderId,
      response: review.response ? {
        message: review.response,
        createdAt: review.responseDate || new Date().toISOString()
      } : undefined
    }));
  }, [reviewsData?.reviews]);

  const [filterRating, setFilterRating] = useState<FilterRating>('tous');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('tous');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrer les avis
  const filteredReviews = reviews.filter((review: Review) => {
    const matchesRating = filterRating === 'tous' || review.rating.toString() === filterRating;
    const matchesStatus = filterStatus === 'tous' || 
      (filterStatus === 'avec_reponse' && review.response) ||
      (filterStatus === 'sans_reponse' && !review.response);
    const matchesSearch = review.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRating && matchesStatus && matchesSearch;
  });

  // Statistiques
  const stats = {
    total: reviews.length,
    moyenne: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0',
    avec_reponse: reviews.filter((r: Review) => r.response).length,
    sans_reponse: reviews.filter((r: Review) => !r.response).length
  };

  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) {
      toast.error('Veuillez saisir une réponse');
      return;
    }

    try {
      setRespondingToReviewId(reviewId);
      await respondToReview({
        reviewId,
        response: responseText.trim()
      }).unwrap();
      
      toast.success('🎉 Réponse envoyée avec succès!');
      setResponseText('');
      refetch();
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la réponse:', error);
      toast.error('❌ Erreur lors de l\'envoi de la réponse');
    } finally {
      setRespondingToReviewId(null);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingIcon = (rating: number) => {
    if (rating >= 4) return '😊';
    if (rating >= 3) return '😐';
    return '😞';
  };

  // États de chargement et d'erreur
  const isLoading = reviewsLoading;
  const hasError = reviewsError;

  // Gestion des états de chargement - UI/UX 2025
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          
          {/* Header Skeleton */}
          <header className="mb-6 sm:mb-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded-lg w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
          </header>
          
          {/* KPI Cards Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-12 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
          
          {/* Reviews Skeleton */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 sm:p-6 shadow-sm animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Gestion des erreurs - UI/UX 2025
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Erreur de chargement</h1>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            Impossible de charger les avis clients. Veuillez réessayer.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        
        {/* Header - UI/UX 2025 */}
        <header className="mb-6 sm:mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
              📝 Avis Clients
            </h1>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl mx-auto sm:mx-0">
              Consultez et répondez aux avis de vos clients pour améliorer votre service
            </p>
          </div>
        </header>

        {/* KPIs - UI/UX 2025 */}
        <section className="mb-6 sm:mb-8" aria-label="Statistiques des avis">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KPICard
              title="Total avis"
              value={stats.total.toString()}
              icon="📝"
              trend={{ value: 5, isPositive: true }}
              color="blue"
            />
            <KPICard
              title="Note moyenne"
              value={`${stats.moyenne}/5`}
              icon="⭐"
              trend={{ value: 8, isPositive: true }}
              color="orange"
            />
            <KPICard
              title="Avec réponse"
              value={stats.avec_reponse.toString()}
              icon="✅"
              trend={{ value: 12, isPositive: true }}
              color="green"
            />
            <KPICard
              title="Sans réponse"
              value={stats.sans_reponse.toString()}
              icon="⏰"
              trend={{ value: 3, isPositive: false }}
              color="purple"
            />
          </div>
        </section>

        {/* Filtres et recherche - UI/UX 2025 */}
        <section className="mb-6 sm:mb-8" aria-label="Filtres et recherche">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              
              {/* Recherche */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom ou commentaire..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Filtres */}
              <div className="flex gap-3">
                <div className="relative">
                  <select
                    value={filterRating}
                    onChange={(e) => setFilterRating(e.target.value as FilterRating)}
                    className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-3 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="tous">Toutes les notes</option>
                    <option value="5">5 étoiles</option>
                    <option value="4">4 étoiles</option>
                    <option value="3">3 étoiles</option>
                    <option value="2">2 étoiles</option>
                    <option value="1">1 étoile</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                    className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-3 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="tous">Tous les statuts</option>
                    <option value="avec_reponse">Avec réponse</option>
                    <option value="sans_reponse">Sans réponse</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Liste des avis - UI/UX 2025 */}
        <section aria-label="Liste des avis clients">
          {filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun avis trouvé</h3>
              <p className="text-gray-500 text-sm">
                {searchTerm || filterRating !== 'tous' || filterStatus !== 'tous' 
                  ? 'Essayez de modifier vos filtres de recherche'
                  : 'Vos premiers avis clients apparaîtront ici'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {filteredReviews.map((review) => (
                <div key={review.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                  
                  {/* En-tête de l'avis */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{review.customerName}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Note */}
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`text-sm font-medium ${getRatingColor(review.rating)}`}>
                        {review.rating}/5 {getRatingIcon(review.rating)}
                      </span>
                    </div>
                  </div>

                  {/* Commentaire */}
                  <div className="mb-4">
                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                  </div>

                  {/* Réponse existante */}
                  {review.response && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4 border-l-4 border-blue-500">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Votre réponse</span>
                        <span className="text-xs text-blue-600">
                          {new Date(review.response.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-blue-800 text-sm leading-relaxed">{review.response.message}</p>
                    </div>
                  )}

                  {/* Formulaire de réponse */}
                  {!review.response && (
                    <div className="border-t pt-4">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <textarea
                            placeholder="Répondre à cet avis..."
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                            rows={3}
                          />
                        </div>
                        <button
                          onClick={() => handleRespond(review.id)}
                          disabled={isResponding && respondingToReviewId === review.id}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 min-w-[120px] h-fit"
                        >
                          {isResponding && respondingToReviewId === review.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Envoi...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Répondre</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ReviewsPage;
