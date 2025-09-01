import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { 
  CheckCircle, 
  XCircle, 
  Loader, 
  RefreshCw, 
  Database,
  Camera,
  Star,
  Settings,
  AlertCircle
} from 'lucide-react';
import {
  useGetPressingServicesQuery,
  useGetPressingPhotosQuery,
  useGetPublicPressingReviewsQuery,
  useGetPressingStatsQuery,
  useCreateServiceMutation,
  useUploadGalleryPhotoMutation,
  useCreatePressingReviewMutation
} from '../../services/pressingApi';

interface ApiIntegrationTestProps {
  pressingId: string;
}

const ApiIntegrationTest: React.FC<ApiIntegrationTestProps> = ({ pressingId }) => {
  const [testResults, setTestResults] = useState<Record<string, 'pending' | 'success' | 'error'>>({});
  const [isRunningTests, setIsRunningTests] = useState(false);

  // API Hooks for testing
  const { data: services, error: servicesError, refetch: refetchServices } = useGetPressingServicesQuery();
  const { data: photos, error: photosError, refetch: refetchPhotos } = useGetPressingPhotosQuery(pressingId);
  const { data: reviews, error: reviewsError, refetch: refetchReviews } = useGetPublicPressingReviewsQuery(pressingId);
  const { data: stats, error: statsError, refetch: refetchStats } = useGetPressingStatsQuery();

  // Mutation hooks for testing
  const [createService] = useCreateServiceMutation();
  const [uploadPhoto] = useUploadGalleryPhotoMutation();
  const [createReview] = useCreatePressingReviewMutation();

  const tests = [
    {
      id: 'services',
      name: 'Services API',
      description: 'Test de récupération des services',
      icon: Settings,
      data: services,
      error: servicesError,
      refetch: refetchServices
    },
    {
      id: 'photos',
      name: 'Photos API',
      description: 'Test de récupération des photos',
      icon: Camera,
      data: photos,
      error: photosError,
      refetch: refetchPhotos
    },
    {
      id: 'reviews',
      name: 'Reviews API',
      description: 'Test de récupération des avis',
      icon: Star,
      data: reviews,
      error: reviewsError,
      refetch: refetchReviews
    },
    {
      id: 'stats',
      name: 'Stats API',
      description: 'Test de récupération des statistiques',
      icon: Database,
      data: stats,
      error: statsError,
      refetch: refetchStats
    }
  ];

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults({});

    for (const test of tests) {
      setTestResults(prev => ({ ...prev, [test.id]: 'pending' }));
      
      try {
        await test.refetch();
        setTestResults(prev => ({ ...prev, [test.id]: 'success' }));
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay for visual effect
      } catch (error) {
        setTestResults(prev => ({ ...prev, [test.id]: 'error' }));
      }
    }

    setIsRunningTests(false);
    toast.success('Tests terminés !');
  };

  const testCreateService = async () => {
    try {
      const testService = {
        nom: `Service Test ${Date.now()}`,
        categorie: 'nettoyage',
        prix: 1000,
        dureeMoyenne: 24,
        description: 'Service créé pour test API',
        disponible: true
      };

      await createService(testService).unwrap();
      toast.success('Service de test créé avec succès !');
      refetchServices();
    } catch (error) {
      console.error('Erreur création service test:', error);
      toast.error('Erreur lors de la création du service test');
    }
  };

  const testCreateReview = async () => {
    try {
      await createReview({
        pressingId,
        rating: 5,
        comment: `Avis test créé le ${new Date().toLocaleString()}`
      }).unwrap();
      
      toast.success('Avis de test créé avec succès !');
      refetchReviews();
    } catch (error) {
      console.error('Erreur création avis test:', error);
      toast.error('Erreur lors de la création de l\'avis test');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Loader className="w-5 h-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (test: any, status: string) => {
    if (status === 'pending') return 'border-blue-200 bg-blue-50';
    if (status === 'success') return 'border-green-200 bg-green-50';
    if (status === 'error' || test.error) return 'border-red-200 bg-red-50';
    if (test.data) return 'border-green-200 bg-green-50';
    return 'border-gray-200 bg-gray-50';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🧪 Test d'Intégration API
        </h2>
        <p className="text-gray-600">
          Testez la connectivité et le fonctionnement des APIs backend en temps réel
        </p>
      </div>

      {/* Test Controls */}
      <div className="mb-8 flex flex-wrap gap-4">
        <button
          onClick={runAllTests}
          disabled={isRunningTests}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-5 h-5 mr-2 ${isRunningTests ? 'animate-spin' : ''}`} />
          {isRunningTests ? 'Tests en cours...' : 'Lancer tous les tests'}
        </button>

        <button
          onClick={testCreateService}
          className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
        >
          <Settings className="w-5 h-5 mr-2" />
          Test Création Service
        </button>

        <button
          onClick={testCreateReview}
          className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
        >
          <Star className="w-5 h-5 mr-2" />
          Test Création Avis
        </button>
      </div>

      {/* Test Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tests.map((test) => {
          const Icon = test.icon;
          const status = testResults[test.id];
          
          return (
            <div
              key={test.id}
              className={`p-6 border-2 rounded-xl transition-all duration-200 ${getStatusColor(test, status)}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Icon className="w-6 h-6 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{test.name}</h3>
                    <p className="text-sm text-gray-600">{test.description}</p>
                  </div>
                </div>
                {getStatusIcon(status)}
              </div>

              {/* Status Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Statut de connexion:</span>
                  <span className={`font-medium ${
                    test.error ? 'text-red-600' : 
                    test.data ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {test.error ? 'Erreur' : test.data ? 'Connecté' : 'En attente'}
                  </span>
                </div>

                {test.data && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Données reçues:</span>
                    <span className="font-medium text-green-600">
                      {Array.isArray(test.data) ? `${test.data.length} éléments` : 
                       typeof test.data === 'object' ? 'Objet' : 'Données'}
                    </span>
                  </div>
                )}

                {test.error && (
                  <div className="mt-2 p-3 bg-red-100 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 font-medium">Erreur:</p>
                    <p className="text-xs text-red-600 mt-1">
                      {(test.error as any)?.message || (test.error as any)?.data?.message || 'Erreur de connexion API'}
                    </p>
                  </div>
                )}

                {/* Data Preview */}
                {test.data && !test.error && (
                  <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-500 mb-2">Aperçu des données:</p>
                    <pre className="text-xs text-gray-700 overflow-x-auto">
                      {JSON.stringify(test.data, null, 2).substring(0, 200)}
                      {JSON.stringify(test.data, null, 2).length > 200 ? '...' : ''}
                    </pre>
                  </div>
                )}
              </div>

              {/* Manual Refresh */}
              <button
                onClick={test.refetch}
                className="mt-4 w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Actualiser
              </button>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-8 p-6 bg-gray-50 rounded-xl">
        <h3 className="font-semibold text-gray-900 mb-3">Résumé de l'intégration</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-white rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {tests.filter(t => t.data && !t.error).length}
            </div>
            <div className="text-sm text-gray-600">APIs connectées</div>
          </div>
          <div className="p-3 bg-white rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {tests.filter(t => t.error).length}
            </div>
            <div className="text-sm text-gray-600">Erreurs</div>
          </div>
          <div className="p-3 bg-white rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {Object.values(testResults).filter(s => s === 'success').length}
            </div>
            <div className="text-sm text-gray-600">Tests réussis</div>
          </div>
          <div className="p-3 bg-white rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {tests.length}
            </div>
            <div className="text-sm text-gray-600">Total APIs</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiIntegrationTest;
