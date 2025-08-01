import React from 'react';

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

interface PressingTableProps {
  pressings: Pressing[];
  selectedPressings: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onPressingAction: (pressingId: string, action: 'approve' | 'reject' | 'suspend' | 'activate' | 'delete') => void;
}

export const PressingTable: React.FC<PressingTableProps> = ({
  pressings,
  selectedPressings,
  onSelectionChange,
  onPressingAction
}) => {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(pressings.map(pressing => pressing.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectPressing = (pressingId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedPressings, pressingId]);
    } else {
      onSelectionChange(selectedPressings.filter(id => id !== pressingId));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">🟢 Approuvé</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">🟡 En attente</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">🔴 Rejeté</span>;
      case 'suspended':
        return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">⏸️ Suspendu</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">❓ Inconnu</span>;
    }
  };

  const getDocumentStatus = (documents: Pressing['documents']) => {
    const total = Object.keys(documents).length;
    const completed = Object.values(documents).filter(Boolean).length;
    const percentage = (completed / total) * 100;
    
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${percentage === 100 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-gray-600">{completed}/{total}</span>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'text-yellow-400' : 'text-gray-300'}>
          ⭐
        </span>
      );
    }
    return stars;
  };

  if (pressings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏪</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun pressing trouvé</h3>
        <p className="text-gray-500">Aucun pressing ne correspond aux critères de recherche.</p>
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
                checked={selectedPressings.length === pressings.length && pressings.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pressing
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Statut
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Documents
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Performance
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Services
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {pressings.map((pressing) => (
            <tr key={pressing.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <input
                  type="checkbox"
                  checked={selectedPressings.includes(pressing.id)}
                  onChange={(e) => handleSelectPressing(pressing.id, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </td>
              
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">
                      🏪
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{pressing.name}</div>
                    <div className="text-sm text-gray-500">📍 {pressing.location}</div>
                    <div className="text-xs text-gray-400">{pressing.address}</div>
                  </div>
                </div>
              </td>
              
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">📧 {pressing.email}</div>
                <div className="text-sm text-gray-500">📱 {pressing.phone}</div>
                <div className="text-xs text-gray-400">🕒 {pressing.workingHours}</div>
              </td>
              
              <td className="px-6 py-4">
                {getStatusBadge(pressing.status)}
                <div className="text-xs text-gray-500 mt-1">
                  Inscrit: {formatDate(pressing.registrationDate)}
                </div>
              </td>
              
              <td className="px-6 py-4">
                {getDocumentStatus(pressing.documents)}
                <div className="text-xs text-gray-500 mt-1">
                  <div>📄 {pressing.documents.businessLicense ? '✅' : '❌'} Licence</div>
                  <div>🧾 {pressing.documents.taxCertificate ? '✅' : '❌'} Fiscal</div>
                  <div>🛡️ {pressing.documents.insurance ? '✅' : '❌'} Assurance</div>
                </div>
              </td>
              
              <td className="px-6 py-4">
                <div className="flex items-center gap-1 mb-1">
                  {getRatingStars(pressing.rating)}
                  <span className="text-sm text-gray-600">
                    {pressing.rating > 0 ? pressing.rating.toFixed(1) : 'N/A'}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  📦 {pressing.totalOrders} commandes
                </div>
                <div className="text-xs text-gray-500">
                  💬 {pressing.reviewCount} avis
                </div>
              </td>
              
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                  {pressing.services.slice(0, 2).map((service, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {service}
                    </span>
                  ))}
                  {pressing.services.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      +{pressing.services.length - 2}
                    </span>
                  )}
                </div>
              </td>
              
              <td className="px-6 py-4 text-sm font-medium">
                <div className="flex flex-col gap-1">
                  {pressing.status === 'pending' && (
                    <>
                      <button
                        onClick={() => onPressingAction(pressing.id, 'approve')}
                        className="text-green-600 hover:text-green-900 px-2 py-1 rounded hover:bg-green-50 text-xs"
                        title="Approuver"
                      >
                        ✅ Approuver
                      </button>
                      <button
                        onClick={() => onPressingAction(pressing.id, 'reject')}
                        className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50 text-xs"
                        title="Rejeter"
                      >
                        ❌ Rejeter
                      </button>
                    </>
                  )}
                  
                  {pressing.status === 'approved' && (
                    <button
                      onClick={() => onPressingAction(pressing.id, 'suspend')}
                      className="text-yellow-600 hover:text-yellow-900 px-2 py-1 rounded hover:bg-yellow-50 text-xs"
                      title="Suspendre"
                    >
                      ⏸️ Suspendre
                    </button>
                  )}
                  
                  {pressing.status === 'suspended' && (
                    <button
                      onClick={() => onPressingAction(pressing.id, 'activate')}
                      className="text-green-600 hover:text-green-900 px-2 py-1 rounded hover:bg-green-50 text-xs"
                      title="Réactiver"
                    >
                      ▶️ Réactiver
                    </button>
                  )}
                  
                  <button
                    className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50 text-xs"
                    title="Voir détails"
                  >
                    👁️ Détails
                  </button>
                  
                  <button
                    onClick={() => onPressingAction(pressing.id, 'delete')}
                    className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50 text-xs"
                    title="Supprimer"
                  >
                    🗑️ Supprimer
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

export default PressingTable;
