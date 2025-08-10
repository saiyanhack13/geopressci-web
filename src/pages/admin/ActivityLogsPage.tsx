import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { User, ShoppingCart, AlertTriangle, Cog } from 'lucide-react';

// Définition du type de log avec les types de chaînes littérales corrects
type LogType = 'user' | 'order' | 'error' | 'system';

interface Log {
  id: number;
  type: LogType;
  icon: React.ReactNode;
  description: string;
  timestamp: string;
}

// Données de log initiales avec les types corrects
const initialLogs: Log[] = [
  {
    id: 1,
    type: 'order',
    icon: <ShoppingCart className="h-5 w-5 text-blue-500" />,
    description: 'Nouvelle commande #1024 passée par client@example.com',
    timestamp: '2023-10-27 14:30',
  },
  {
    id: 2,
    type: 'user',
    icon: <User className="h-5 w-5 text-green-500" />,
    description: 'Utilisateur Jean Dupont a mis à jour son profil',
    timestamp: '2023-10-27 14:25',
  },
  {
    id: 3,
    type: 'error',
    icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
    description: 'Échec du paiement pour la commande #1023 - Solde insuffisant',
    timestamp: '2023-10-27 14:20',
  },
  {
    id: 4,
    type: 'system',
    icon: <Cog className="h-5 w-5 text-gray-500" />,
    description: 'Maintenance système planifiée à 2h00 du matin',
    timestamp: '2023-10-27 14:15',
  },
];

const ActivityLogsPage: React.FC = () => {
  const [logs] = useState<Log[]>(initialLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<LogType | 'all'>('all');

  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => filterType === 'all' || log.type === filterType)
      .filter(log =>
        log.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [logs, searchTerm, filterType]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Journaux d'Activité</h1>

      <Card>
        <CardHeader>
          <CardTitle>Filtrer les logs</CardTitle>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <Input
              placeholder="Rechercher dans les descriptions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select
              value={filterType}
              onValueChange={(value: LogType | 'all') => setFilterType(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type de log" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="user">Utilisateur</SelectItem>
                <SelectItem value="order">Commande</SelectItem>
                <SelectItem value="error">Erreur</SelectItem>
                <SelectItem value="system">Système</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLogs.length > 0 ? (
              filteredLogs.map(log => (
                <div key={log.id} className="flex items-start p-4 border-b last:border-b-0">
                  <div className="flex-shrink-0 mr-4">{log.icon}</div>
                  <div className="flex-grow">
                    <p className="text-sm text-gray-800">{log.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{log.timestamp}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
                    {log.type}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Aucun log ne correspond à vos critères de recherche.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLogsPage;
