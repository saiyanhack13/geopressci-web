import React, { useState } from 'react';

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

interface ReviewCardProps {
  review: Review;
  onRespond: (reviewId: string) => void;
  isResponding?: boolean;
  responseText?: string;
  onResponseTextChange?: (text: string) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ 
  review, 
  onRespond, 
  isResponding: globalIsResponding = false,
  responseText: globalResponseText = '',
  onResponseTextChange 
}) => {
  const [isResponding, setIsResponding] = useState(false);
  const [responseText, setResponseText] = useState('');
  
  // Utiliser l'état global si fourni, sinon l'état local
  const currentIsResponding = globalIsResponding || isResponding;
  const currentResponseText = onResponseTextChange ? globalResponseText : responseText;
  
  const handleTextChange = (text: string) => {
    if (onResponseTextChange) {
      onResponseTextChange(text);
    } else {
      setResponseText(text);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ⭐
      </span>
    ));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleSubmitResponse = () => {
    if (currentResponseText.trim()) {
      onRespond(review.id);
      if (!onResponseTextChange) {
        setResponseText('');
        setIsResponding(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="font-medium text-gray-900">{review.customerName}</h4>
            <span className="text-xs text-gray-500">#{review.orderId.slice(-6)}</span>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <div className="flex">{renderStars(review.rating)}</div>
            <span className={`text-sm font-medium ${getRatingColor(review.rating)}`}>
              {review.rating}/5
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(review.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Comment */}
      <div className="mb-4">
        <p className="text-gray-700 text-sm leading-relaxed">"{review.comment}"</p>
      </div>

      {/* Existing Response */}
      {review.response && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-blue-800">🏢 Votre réponse</span>
            <span className="text-xs text-blue-600">
              {new Date(review.response.createdAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <p className="text-sm text-blue-700">"{review.response.message}"</p>
        </div>
      )}

      {/* Response Form */}
      {currentIsResponding ? (
        <div className="space-y-3">
          <textarea
            value={currentResponseText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Rédigez votre réponse professionnelle..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={globalIsResponding}
          />
          <div className="flex space-x-2">
            <button
              onClick={handleSubmitResponse}
              disabled={!currentResponseText.trim() || globalIsResponding}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {globalIsResponding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Envoi...</span>
                </>
              ) : (
                <>
                  <span>📤</span>
                  <span>Envoyer</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                if (onResponseTextChange) {
                  onResponseTextChange('');
                } else {
                  setIsResponding(false);
                  setResponseText('');
                }
              }}
              disabled={globalIsResponding}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        !review.response && (
          <button
            onClick={() => {
              if (onResponseTextChange) {
                // Mode global - ne pas gérer l'état local
              } else {
                setIsResponding(true);
              }
            }}
            disabled={globalIsResponding}
            className="w-full py-2 border border-blue-300 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            💬 Répondre à cet avis
          </button>
        )
      )}
    </div>
  );
};

export default ReviewCard;
