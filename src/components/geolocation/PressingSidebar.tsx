import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Calendar, 
  DollarSign, 
  Star, 
  Settings, 
  User, 
  Camera, 
  MapPin, 
  CreditCard, 
  BarChart3, 
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  Tag
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  badge?: number;
  color?: string;
}

const PressingSidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  // Function to check if a navigation item is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      path: '/pressing/dashboard',
      color: 'text-blue-600'
    },
    {
      id: 'orders',
      label: 'Commandes',
      icon: Package,
      path: '/pressing/orders',
      badge: 8, // Nombre de commandes en attente
      color: 'text-orange-600'
    },
    {
      id: 'services',
      label: 'Services & Tarifs',
      icon: DollarSign,
      path: '/pressing/services',
      color: 'text-green-600'
    },
    {
      id: 'promotions',
      label: 'Promotions',
      icon: Tag,
      path: '/pressing/promotions',
      color: 'text-red-600'
    },
    {
      id: 'schedule',
      label: 'Planning',
      icon: Calendar,
      path: '/pressing/schedule',
      color: 'text-purple-600'
    },
    {
      id: 'earnings',
      label: 'Revenus',
      icon: BarChart3,
      path: '/pressing/earnings',
      color: 'text-emerald-600'
    },
    {
      id: 'reviews',
      label: 'Avis clients',
      icon: Star,
      path: '/pressing/reviews',
      badge: 3, // Nouveaux avis
      color: 'text-yellow-600'
    },
    {
      id: 'profile',
      label: 'Profil Business',
      icon: User,
      path: '/pressing/profile',
      color: 'text-indigo-600'
    },
    {
      id: 'gallery',
      label: 'Galerie Photos',
      icon: Camera,
      path: '/pressing/gallery',
      color: 'text-pink-600'
    },
    {
      id: 'location',
      label: 'Localisation',
      icon: MapPin,
      path: '/pressing/location',
      color: 'text-red-600'
    },
    {
      id: 'subscription',
      label: 'Abonnement',
      icon: CreditCard,
      path: '/pressing/subscription',
      color: 'text-cyan-600'
    },
    {
      id: 'analytics',
      label: 'Statistiques',
      icon: BarChart3,
      path: '/pressing/analytics',
      color: 'text-teal-600'
    },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: Settings,
      path: '/pressing/settings',
      color: 'text-gray-600'
    },
    {
      id: 'support',
      label: 'Aide & Support',
      icon: HelpCircle,
      path: '/pressing/support',
      color: 'text-blue-500'
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <div className={`hidden lg:flex bg-white shadow-lg border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex-col h-screen`}>
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🏪</span>
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Geopressci</h2>
                <p className="text-sm text-gray-500">Espace Pressing</p>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 bg-gradient-to-r from-orange-50 to-green-50 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {user?.prenom?.charAt(0) || user?.nom?.charAt(0) || 'P'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {user?.prenom} {user?.nom}
              </p>
              <p className="text-sm text-gray-600 truncate">
                {user?.email}
              </p>
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-xs text-green-600 font-medium">En ligne</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-3">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  active
                    ? 'bg-gradient-to-r from-orange-500 to-green-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${
                  active ? 'text-white' : item.color
                } transition-colors`} />
                
                {!isCollapsed && (
                  <>
                    <span className="ml-3 font-medium">{item.label}</span>
                    {item.badge && (
                      <span className={`ml-auto px-2 py-1 text-xs font-bold rounded-full ${
                        active 
                          ? 'bg-white/20 text-white' 
                          : 'bg-red-500 text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                
                {isCollapsed && item.badge && (
                  <div className="absolute left-8 top-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed && (
          <div className="space-y-2">
            {/* Notifications */}
            <button className="w-full flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="ml-3 font-medium">Notifications</span>
              <span className="ml-auto px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-full">
                5
              </span>
            </button>
            
            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="ml-3 font-medium">Déconnexion</span>
            </button>
          </div>
        )}
        
        {isCollapsed && (
          <div className="space-y-2">
            <button className="w-full p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5 mx-auto" />
              <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 mx-auto" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PressingSidebar;
