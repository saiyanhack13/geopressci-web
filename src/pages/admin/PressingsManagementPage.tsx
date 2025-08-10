import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { PressingTable } from '../../components/admin/PressingTable';

interface Pressing {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  location: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  registrationDate: string;
  lastActivity: string;
  totalOrders: number;
  rating: number;
  reviewCount: number;
  services: string[];
  workingHours: string;
  documents: {
    businessLicense: boolean;
    taxCertificate: boolean;
    insurance: boolean;
  };
}

interface PressingStats {
  totalPressings: number;
  approvedPressings: number;
  pendingPressings: number;
  rejectedPressings: number;
  suspendedPressings: number;
  newApplicationsToday: number;
}

export const PressingsManagementPage: React.FC = () => {
  const [pressings, setPressings] = useState<Pressing[]>([]);
  const [stats, setStats] = useState<PressingStats>({
    totalPressings: 0,
    approvedPressings: 0,
    pendingPressings: 0,
    rejectedPressings: 0,
    suspendedPressings: 0,
    newApplicationsToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended'>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [selectedPressings, setSelectedPressings] = useState<string[]>([]);

  useEffect(() => {
    const fetchPressings = async () => {
      try {
        // Simulation des données - à remplacer par les vraies API calls
        setTimeout(() => {
          const mockPressings: Pressing[] = [
            {
              id: '1',
              name: 'Clean Express',
              email: 'contact@cleanexpress.ci',
              phone: '+225 05 98 76 54 32',
              address: '123 Boulevard Lagunaire, Cocody',
              location: 'Cocody',
              status: 'approved',
              registrationDate: '2024-01-10',
              lastActivity: '2024-01-19 13:45',
              totalOrders: 89,
              rating: 4.8,
              reviewCount: 45,
              services: ['Nettoyage à sec', 'Repassage', 'Lavage'],
              workingHours: '8h-18h',
              documents: {
                businessLicense: true,
                taxCertificate: true,
                insurance: true
              }
            },
            {
              id: '2',
              name: 'Pressing Royal',
              email: 'info@pressingroyal.ci',
              phone: '+225 07 11 22 33 44',
              address: '456 Rue du Commerce, Marcory',
              location: 'Marcory',
              status: 'pending',
              registrationDate: '2024-01-19',
              lastActivity: '2024-01-19 10:00',
              totalOrders: 0,
              rating: 0,
              reviewCount: 0,
              services: ['Nettoyage à sec', 'Repassage'],
              workingHours: '7h-19h',
              documents: {
                businessLicense: true,
                taxCertificate: false,
                insurance: true
              }
            },
            {
              id: '3',
              name: 'Laverie Moderne',
              email: 'contact@laverimoderne.ci',
              phone: '+225 01 44 55 66 77',
              address: '789 Avenue de la République, Plateau',
              location: 'Plateau',
              status: 'approved',
              registrationDate: '2024-01-05',
              lastActivity: '2024-01-19 14:20',
              totalOrders: 156,
              rating: 4.6,
              reviewCount: 78,
              services: ['Nettoyage à sec', 'Lavage', 'Repassage', 'Teinturerie'],
              workingHours: '6h-20h',
              documents: {
                businessLicense: true,
                taxCertificate: true,
                insurance: true
              }
            },
            {
              id: '4',
              name: 'Express Clean',
              email: 'admin@expressclean.ci',
              phone: '+225 05 33 44 55 66',
              address: '321 Rue des Jardins, Yopougon',
              location: 'Yopougon',
              status: 'suspended',
              registrationDate: '2024-01-08',
              lastActivity: '2024-01-15 09:30',
              totalOrders: 23,
              rating: 3.2,
              reviewCount: 12,
              services: ['Lavage', 'Repassage'],
              workingHours: '8h-17h',
              documents: {
                businessLicense: true,
                taxCertificate: true,
                insurance: false
              }
            },
            {
              id: '5',
              name: 'Pressing Deluxe',
              email: 'contact@pressingdeluxe.ci',
              phone: '+225 07 88 99 00 11',
              address: '654 Boulevard Principal, Adjamé',
              location: 'Adjamé',
              status: 'rejected',
              registrationDate: '2024-01-16',
              lastActivity: '2024-01-17 11:15',
              totalOrders: 0,
              rating: 0,
              reviewCount: 0,
              services: ['Nettoyage à sec'],
              workingHours: '9h-16h',
              documents: {
                businessLicense: false,
                taxCertificate: false,
                insurance: false
              }
            }
          ];

          setPressings(mockPressings);
          setStats({
            totalPressings: mockPressings.length,
            approvedPressings: mockPressings.filter(p => p.status === 'approved').length,
            pendingPressings: mockPressings.filter(p => p.status === 'pending').length,
            rejectedPressings: mockPressings.filter(p => p.status === 'rejected').length,
            suspendedPressings: mockPressings.filter(p => p.status === 'suspended').length,
            newApplicationsToday: mockPressings.filter(p => p.registrationDate === '2024-01-19').length
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erreur lors du chargement des pressings:', error);
        setLoading(false);
      }
    };

    fetchPressings();
  }, []);

  const locations = ['Cocody', 'Plateau', 'Yopougon', 'Marcory', 'Adjamé', 'Treichville', 'Koumassi'];

  const filteredPressings = pressings.filter(pressing => {
    const matchesSearch = pressing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pressing.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pressing.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || pressing.status === filterStatus;
    const matchesLocation = filterLocation === 'all' || pressing.location === filterLocation;
    
    return matchesSearch && matchesStatus && matchesLocation;
  });

  const handlePressingAction = async (pressingId: string, action: 'approve' | 'reject' | 'suspend' | 'activate' | 'delete') => {
    try {
      // Simulation de l'action - à remplacer par les vraies API calls
      setPressings(prevPressings => 
        prevPressings.map(pressing => {
          if (pressing.id === pressingId) {
            switch (action) {
              case 'approve':
                return { ...pressing, status: 'approved' as const };
              case 'reject':
                return { ...pressing, status: 'rejected' as const };
              case 'suspend':
                return { ...pressing, status: 'suspended' as const };
              case 'activate':
                return { ...pressing, status: 'approved' as const };
              case 'delete':
                return pressing; // Pour la suppression, on filtrerait le pressing
              default:
                return pressing;
            }
          }
          return pressing;
        })
      );

      if (action === 'delete') {
        setPressings(prevPressings => prevPressings.filter(pressing => pressing.id !== pressingId));
      }
    } catch (error) {
      console.error(`Erreur lors de l'action ${action}:`, error);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'suspend' | 'delete') => {
    try {
      for (const pressingId of selectedPressings) {
        await handlePressingAction(pressingId, action);
      }
      setSelectedPressings([]);
    } catch (error) {
      console.error(`Erreur lors de l'action en lot ${action}:`, error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏪 Gestion des Pressings
          </h1>
          <p className="text-gray-600">
            Validez et gérez tous les pressings de la plateforme
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalPressings}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.approvedPressings}</div>
              <div className="text-sm text-gray-600">Approuvés</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingPressings}</div>
              <div className="text-sm text-gray-600">En attente</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.rejectedPressings}</div>
              <div className="text-sm text-gray-600">Rejetés</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.suspendedPressings}</div>
              <div className="text-sm text-gray-600">Suspendus</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.newApplicationsToday}</div>
              <div className="text-sm text-gray-600">Nouveaux</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="🔍 Rechercher par nom, email ou localisation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">🟡 En attente</option>
                <option value="approved">🟢 Approuvés</option>
                <option value="rejected">🔴 Rejetés</option>
                <option value="suspended">⏸️ Suspendus</option>
              </select>

              {/* Location Filter */}
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Toutes les zones</option>
                {locations.map(location => (
                  <option key={location} value={location}>📍 {location}</option>
                ))}
              </select>
            </div>

            {/* Bulk Actions */}
            {selectedPressings.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedPressings.length} pressing(s) sélectionné(s)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBulkAction('approve')}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      ✅ Approuver
                    </button>
                    <button
                      onClick={() => handleBulkAction('reject')}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      ❌ Rejeter
                    </button>
                    <button
                      onClick={() => handleBulkAction('suspend')}
                      className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                    >
                      ⏸️ Suspendre
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pressings Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>📋 Liste des Pressings ({filteredPressings.length})</span>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                  📊 Rapport
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  📤 Exporter
                </button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PressingTable
              pressings={filteredPressings}
              selectedPressings={selectedPressings}
              onSelectionChange={setSelectedPressings}
              onPressingAction={handlePressingAction}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PressingsManagementPage;
