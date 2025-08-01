import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { UserTable } from '../../components/admin/UserTable';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'client' | 'pressing' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  registrationDate: string;
  lastActivity: string;
  totalOrders: number;
  totalSpent: number;
  location: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  newUsersToday: number;
  clientUsers: number;
  pressingUsers: number;
}

export const UsersManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    newUsersToday: 0,
    clientUsers: 0,
    pressingUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'client' | 'pressing' | 'admin'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'pending'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Simulation des données - à remplacer par les vraies API calls
        setTimeout(() => {
          const mockUsers: User[] = [
            {
              id: '1',
              name: 'Kouame Jean-Baptiste',
              email: 'kouame.jean@gmail.com',
              phone: '+225 07 12 34 56 78',
              role: 'client',
              status: 'active',
              registrationDate: '2024-01-15',
              lastActivity: '2024-01-19 14:30',
              totalOrders: 15,
              totalSpent: 125000,
              location: 'Cocody'
            },
            {
              id: '2',
              name: 'Pressing Clean Express',
              email: 'contact@cleanexpress.ci',
              phone: '+225 05 98 76 54 32',
              role: 'pressing',
              status: 'active',
              registrationDate: '2024-01-10',
              lastActivity: '2024-01-19 13:45',
              totalOrders: 89,
              totalSpent: 0,
              location: 'Plateau'
            },
            {
              id: '3',
              name: 'Aya Fatou',
              email: 'aya.fatou@yahoo.fr',
              phone: '+225 01 23 45 67 89',
              role: 'client',
              status: 'active',
              registrationDate: '2024-01-18',
              lastActivity: '2024-01-19 12:15',
              totalOrders: 3,
              totalSpent: 25000,
              location: 'Yopougon'
            },
            {
              id: '4',
              name: 'Pressing Royal',
              email: 'info@pressingroyal.ci',
              phone: '+225 07 11 22 33 44',
              role: 'pressing',
              status: 'pending',
              registrationDate: '2024-01-19',
              lastActivity: '2024-01-19 10:00',
              totalOrders: 0,
              totalSpent: 0,
              location: 'Marcory'
            },
            {
              id: '5',
              name: 'Kone Ibrahim',
              email: 'kone.ibrahim@hotmail.com',
              phone: '+225 05 55 66 77 88',
              role: 'client',
              status: 'suspended',
              registrationDate: '2024-01-12',
              lastActivity: '2024-01-17 16:20',
              totalOrders: 8,
              totalSpent: 45000,
              location: 'Adjamé'
            }
          ];

          setUsers(mockUsers);
          setStats({
            totalUsers: mockUsers.length,
            activeUsers: mockUsers.filter(u => u.status === 'active').length,
            suspendedUsers: mockUsers.filter(u => u.status === 'suspended').length,
            newUsersToday: mockUsers.filter(u => u.registrationDate === '2024-01-19').length,
            clientUsers: mockUsers.filter(u => u.role === 'client').length,
            pressingUsers: mockUsers.filter(u => u.role === 'pressing').length
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm);
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUserAction = async (userId: string, action: 'activate' | 'suspend' | 'delete') => {
    try {
      // Simulation de l'action - à remplacer par les vraies API calls
      setUsers(prevUsers => 
        prevUsers.map(user => {
          if (user.id === userId) {
            switch (action) {
              case 'activate':
                return { ...user, status: 'active' as const };
              case 'suspend':
                return { ...user, status: 'suspended' as const };
              case 'delete':
                return user; // Pour la suppression, on filtrerait l'utilisateur
              default:
                return user;
            }
          }
          return user;
        })
      );

      if (action === 'delete') {
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      }
    } catch (error) {
      console.error(`Erreur lors de l'action ${action}:`, error);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'suspend' | 'delete') => {
    try {
      for (const userId of selectedUsers) {
        await handleUserAction(userId, action);
      }
      setSelectedUsers([]);
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
            👥 Gestion des Utilisateurs
          </h1>
          <p className="text-gray-600">
            Gérez tous les utilisateurs de la plateforme Geopressci
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
              <div className="text-sm text-gray-600">Actifs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.suspendedUsers}</div>
              <div className="text-sm text-gray-600">Suspendus</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.newUsersToday}</div>
              <div className="text-sm text-gray-600">Nouveaux</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.clientUsers}</div>
              <div className="text-sm text-gray-600">Clients</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-teal-600">{stats.pressingUsers}</div>
              <div className="text-sm text-gray-600">Pressings</div>
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
                  placeholder="🔍 Rechercher par nom, email ou téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Role Filter */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les rôles</option>
                <option value="client">👤 Clients</option>
                <option value="pressing">🏪 Pressings</option>
                <option value="admin">👑 Admins</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">🟢 Actifs</option>
                <option value="suspended">🔴 Suspendus</option>
                <option value="pending">🟡 En attente</option>
              </select>
            </div>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedUsers.length} utilisateur(s) sélectionné(s)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBulkAction('activate')}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      ✅ Activer
                    </button>
                    <button
                      onClick={() => handleBulkAction('suspend')}
                      className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                    >
                      ⏸️ Suspendre
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>📋 Liste des Utilisateurs ({filteredUsers.length})</span>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                ➕ Ajouter Utilisateur
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UserTable
              users={filteredUsers}
              selectedUsers={selectedUsers}
              onSelectionChange={setSelectedUsers}
              onUserAction={handleUserAction}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UsersManagementPage;
