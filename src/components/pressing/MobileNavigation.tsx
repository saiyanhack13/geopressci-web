import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, Settings, Clock, Package, MapPin, Star, Image, BarChart2, DollarSign, Bell, Menu, X, User, CreditCard, HelpCircle } from 'lucide-react';

const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { to: '/pressing/dashboard', icon: Home, label: 'Tableau de bord', color: 'text-blue-600' },
    { to: '/pressing/orders', icon: Package, label: 'Commandes', color: 'text-orange-600', badge: 8 },
    { to: '/pressing/services', icon: DollarSign, label: 'Services & Tarifs', color: 'text-green-600' },
    { to: '/pressing/schedule', icon: Clock, label: 'Planning', color: 'text-purple-600' },
    { to: '/pressing/earnings', icon: BarChart2, label: 'Revenus', color: 'text-emerald-600' },
    { to: '/pressing/reviews', icon: Star, label: 'Avis clients', color: 'text-yellow-600', badge: 3 },
    { to: '/pressing/profile', icon: User, label: 'Profil Business', color: 'text-indigo-600' },
    { to: '/pressing/gallery', icon: Image, label: 'Galerie Photos', color: 'text-pink-600' },
    { to: '/pressing/location', icon: MapPin, label: 'Localisation', color: 'text-red-600' },
    { to: '/pressing/subscription', icon: CreditCard, label: 'Abonnement', color: 'text-cyan-600' },
    { to: '/pressing/analytics', icon: BarChart2, label: 'Statistiques', color: 'text-teal-600' },
    { to: '/pressing/settings', icon: Settings, label: 'Paramètres', color: 'text-gray-600' },
    { to: '/pressing/support', icon: HelpCircle, label: 'Aide & Support', color: 'text-blue-500' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Bouton de menu flottant */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed right-4 bottom-20 w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg transform transition-transform duration-300 ${
          isOpen ? 'rotate-180' : ''
        }`}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Menu déroulant */}
      <div
        className={`bg-white border-t border-gray-200 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="grid grid-cols-3 gap-2 p-3 max-h-[70vh] overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex flex-col items-center justify-center p-3 rounded-lg text-center transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-orange-500 to-green-500 text-white shadow-md' 
                    : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <item.icon 
                  size={20} 
                  className={`mb-1 ${
                    isActive ? 'text-white' : item.color || 'text-gray-600'
                  }`} 
                />
                <span className="text-xs font-medium leading-tight">{item.label}</span>
                
                {/* Badge pour les notifications */}
                {item.badge && (
                  <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold rounded-full ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-red-500 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileNavigation;
