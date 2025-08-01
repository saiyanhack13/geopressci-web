import React from 'react';

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

interface UserTableProps {
  users: User[];
  selectedUsers: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onUserAction: (userId: string, action: 'activate' | 'suspend' | 'delete') => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  selectedUsers,
  onSelectionChange,
  onUserAction
}) => {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(users.map(user => user.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedUsers, userId]);
    } else {
      onSelectionChange(selectedUsers.filter(id => id !== userId));
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'client': return '👤';
      case 'pressing': return '🏪';
      case 'admin': return '👑';
      default: return '❓';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'client': return 'Client';
      case 'pressing': return 'Pressing';
      case 'admin': return 'Admin';
      default: return 'Inconnu';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">🟢 Actif</span>;
      case 'suspended':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">🔴 Suspendu</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">🟡 En attente</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">❓ Inconnu</span>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CI', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👥</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
        <p className="text-gray-500">Aucun utilisateur ne correspond aux critères de recherche.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left">
              <input
                type="checkbox"
                checked={selectedUsers.length === users.length && users.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Utilisateur
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rôle
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Statut
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Activité
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Statistiques
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </td>
              
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">
                      {getRoleIcon(user.role)}
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">📍 {user.location}</div>
                  </div>
                </div>
              </td>
              
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">📧 {user.email}</div>
                <div className="text-sm text-gray-500">📱 {user.phone}</div>
              </td>
              
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {getRoleIcon(user.role)} {getRoleLabel(user.role)}
                </span>
              </td>
              
              <td className="px-6 py-4">
                {getStatusBadge(user.status)}
              </td>
              
              <td className="px-6 py-4 text-sm text-gray-900">
                <div>📅 Inscrit: {formatDate(user.registrationDate)}</div>
                <div className="text-gray-500">🕒 Dernière activité: {formatDate(user.lastActivity)}</div>
              </td>
              
              <td className="px-6 py-4 text-sm text-gray-900">
                {user.role === 'client' ? (
                  <>
                    <div>📦 {user.totalOrders} commandes</div>
                    <div className="text-gray-500">💰 {formatCurrency(user.totalSpent)}</div>
                  </>
                ) : user.role === 'pressing' ? (
                  <>
                    <div>📦 {user.totalOrders} commandes traitées</div>
                    <div className="text-gray-500">🏪 Pressing actif</div>
                  </>
                ) : (
                  <div className="text-gray-500">👑 Administrateur</div>
                )}
              </td>
              
              <td className="px-6 py-4 text-sm font-medium">
                <div className="flex space-x-2">
                  {user.status === 'suspended' ? (
                    <button
                      onClick={() => onUserAction(user.id, 'activate')}
                      className="text-green-600 hover:text-green-900 px-2 py-1 rounded hover:bg-green-50"
                      title="Activer"
                    >
                      ✅
                    </button>
                  ) : (
                    <button
                      onClick={() => onUserAction(user.id, 'suspend')}
                      className="text-yellow-600 hover:text-yellow-900 px-2 py-1 rounded hover:bg-yellow-50"
                      title="Suspendre"
                    >
                      ⏸️
                    </button>
                  )}
                  
                  <button
                    onClick={() => onUserAction(user.id, 'delete')}
                    className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                  
                  <button
                    className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50"
                    title="Voir détails"
                  >
                    👁️
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
