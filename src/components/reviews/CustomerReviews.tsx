import React, { useState } from 'react';
import { Star, Search, Filter, ThumbsUp, User, Calendar, CheckCircle, X, Send, MessageCircle, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  useGetPublicPressingReviewsQuery, 
  useCreatePressingReviewMutation 
} from '../../services/pressingApi';

interface Review {
  id: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  service: string;
  verified: boolean;
  helpful: number;
  photos?: string[];
}

interface CustomerReviewsProps {
  pressingId: string;
  reviews?: Review[];
  onSubmitReview?: (review: Omit<Review, 'id' | 'date' | 'helpful'>) => void;
}

const CustomerReviews: React.FC<CustomerReviewsProps> = ({ 
  pressingId, 
  reviews = [], 
  onSubmitReview 
}) => {
  // Real API hooks
  const { data: apiReviews, isLoading, error, refetch } = useGetPublicPressingReviewsQuery(pressingId);
  const [createReview, { isLoading: isSubmitting }] = useCreatePressingReviewMutation();
  
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'helpful'>('recent');
  
  // Form state
  const [newReview, setNewReview] = useState({
    customerName: '',
    rating: 5,
    comment: '',
    service: ''
  });

  // Mock reviews data - à remplacer par des données réelles
  const mockReviews: Review[] = [
    {
      id: '1',
      customerName: 'Marie Kouassi',
      rating: 5,
      comment: 'Service exceptionnel ! Mon costume est revenu impeccable. Personnel très professionnel et délais respectés. Je recommande vivement ce pressing.',
      date: '2024-08-25',
      service: 'Nettoyage costume',
      verified: true,
      helpful: 12,
      photos: []
    },
    {
      id: '2',
      customerName: 'Jean-Baptiste Traoré',
      rating: 4,
      comment: 'Très bon service, ma chemise était parfaitement repassée. Seul bémol : un peu cher mais la qualité est au rendez-vous.',
      date: '2024-08-23',
      service: 'Repassage chemise',
      verified: true,
      helpful: 8,
      photos: []
    },
    {
      id: '3',
      customerName: 'Fatou Diabaté',
      rating: 5,
      comment: 'Je suis cliente depuis 2 ans et je n\'ai jamais été déçue. Équipe formidable, service rapide et vêtements toujours impeccables !',
      date: '2024-08-20',
      service: 'Nettoyage robe',
      verified: true,
      helpful: 15,
      photos: []
    },
    {
      id: '4',
      customerName: 'Amadou Bamba',
      rating: 3,
      comment: 'Service correct mais j\'ai dû attendre plus longtemps que prévu. La qualité du nettoyage est bonne cependant.',
      date: '2024-08-18',
      service: 'Nettoyage veste',
      verified: false,
      helpful: 3,
      photos: []
    }
  ];

  // Normalize review data to handle API vs local type differences
  const normalizeReview = (review: any): Review => ({
    id: review.id || review._id || '',
    customerName: review.customerName || 'Client anonyme',
    rating: review.rating || 0,
    comment: review.comment || '',
    date: review.date || review.createdAt || new Date().toISOString().split('T')[0],
    service: review.service || 'Service non spécifié',
    verified: review.verified || false,
    helpful: review.helpful || 0,
    photos: review.photos || [],
    customerAvatar: review.customerAvatar
  });

  // Use real API data or fallback to mock data
  const rawReviews = apiReviews?.reviews || reviews || mockReviews;
  const allReviews = rawReviews.map(normalizeReview);

  // Handle submit review
  const handleSubmitReview = async () => {
    if (!newReview.customerName.trim() || !newReview.comment.trim()) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    try {
      await createReview({
        pressingId,
        rating: newReview.rating,
        comment: newReview.comment
      }).unwrap();
      
      toast.success('Merci pour votre avis !');
      setShowReviewForm(false);
      setNewReview({ customerName: '', rating: 5, comment: '', service: '' });
      refetch(); // Refresh reviews
      
      if (onSubmitReview) {
        onSubmitReview({
          customerName: newReview.customerName,
          rating: newReview.rating,
          comment: newReview.comment,
          service: newReview.service,
          verified: false,
          photos: []
        });
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Erreur lors de l\'envoi de l\'avis');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-red-600 mb-4">
          <X className="w-12 h-12 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Erreur de chargement</h3>
          <p className="text-sm text-gray-600 mt-1">Impossible de charger les avis</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  // Filtrer et trier les avis
  const filteredReviews = allReviews
    .filter(review => {
      const matchesRating = filterRating === null || review.rating === filterRating;
      const matchesSearch = searchTerm === '' || 
        review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesRating && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'helpful':
          return b.helpful - a.helpful;
        case 'recent':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

  // Calculer les statistiques
  const averageRating = allReviews.length > 0 
    ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length 
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: allReviews.filter(review => review.rating === rating).length,
    percentage: allReviews.length > 0 
      ? (allReviews.filter(review => review.rating === rating).length / allReviews.length) * 100 
      : 0
  }));

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Reviews Header & Stats */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Avis clients
              </h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {renderStars(Math.round(averageRating), 'lg')}
                  <span className="text-2xl font-bold text-gray-900">
                    {averageRating.toFixed(1)}
                  </span>
                </div>
                <div className="text-gray-600">
                  {allReviews.length} avis
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowReviewForm(true)}
              className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Laisser un avis
            </button>
          </div>

          {/* Rating Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 w-16">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((ratingDistribution[0].count + ratingDistribution[1].count) / allReviews.length * 100)}%
                </div>
                <div className="text-sm text-green-700">Avis positifs</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-2xl font-bold text-blue-600">
                  {allReviews.filter(r => r.verified).length}
                </div>
                <div className="text-sm text-blue-700">Avis vérifiés</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher dans les avis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Rating Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterRating || ''}
                onChange={(e) => setFilterRating(e.target.value ? parseInt(e.target.value) : null)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Toutes les notes</option>
                <option value="5">5 étoiles</option>
                <option value="4">4 étoiles</option>
                <option value="3">3 étoiles</option>
                <option value="2">2 étoiles</option>
                <option value="1">1 étoile</option>
              </select>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'rating' | 'helpful')}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="recent">Plus récents</option>
              <option value="rating">Mieux notés</option>
              <option value="helpful">Plus utiles</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {review.customerAvatar ? (
                      <img 
                        src={review.customerAvatar} 
                        alt={review.customerName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Review Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-semibold text-gray-900">{review.customerName}</h4>
                        {review.verified && (
                          <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            <Award className="w-3 h-3" />
                            <span>Vérifié</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {formatDate(review.date)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 mb-3">
                      {renderStars(review.rating)}
                      <span className="text-sm text-gray-600">• {review.service}</span>
                    </div>

                    <p className="text-gray-700 leading-relaxed mb-4">
                      {review.comment}
                    </p>

                    {/* Review Actions */}
                    <div className="flex items-center justify-between">
                      <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-sm">Utile ({review.helpful})</span>
                      </button>
                      <div className="text-sm text-gray-500">
                        {review.helpful > 10 && '👍 Très utile'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || filterRating ? 'Aucun avis trouvé' : 'Aucun avis pour le moment'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterRating 
                  ? 'Essayez de modifier vos critères de recherche'
                  : 'Soyez le premier à laisser un avis sur ce pressing'
                }
              </p>
              {!searchTerm && !filterRating && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Laisser le premier avis
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Laisser un avis
                </h3>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Votre nom *
                  </label>
                  <input
                    type="text"
                    value={newReview.customerName}
                    onChange={(e) => setNewReview(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Votre nom complet"
                  />
                </div>

                {/* Service */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service utilisé
                  </label>
                  <select
                    value={newReview.service}
                    onChange={(e) => setNewReview(prev => ({ ...prev, service: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Sélectionner un service</option>
                    <option value="Nettoyage à sec">Nettoyage à sec</option>
                    <option value="Lavage">Lavage</option>
                    <option value="Repassage">Repassage</option>
                    <option value="Retouches">Retouches</option>
                    <option value="Service express">Service express</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note *
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                        className={`text-2xl transition-colors ${
                          star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'
                        } hover:text-yellow-400`}
                      >
                        <Star className={`w-8 h-8 ${
                          star <= newReview.rating ? 'fill-current' : ''
                        }`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Votre avis *
                  </label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Partagez votre expérience avec ce pressing..."
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {newReview.comment.length}/500 caractères
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={isSubmitting || !newReview.customerName.trim() || !newReview.comment.trim() || newReview.rating === 0}
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Publier l'avis
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerReviews;
