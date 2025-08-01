import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showLanguageSelector?: boolean;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children, 
  title, 
  subtitle,
  showLanguageSelector = true 
}) => {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex flex-col">
      {/* Header avec logo et sélecteur de langue */}
      <div className="flex justify-between items-center p-4 sm:p-6">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-green-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">G</span>
          </div>
          <span className="text-xl font-bold text-gray-800">Geopressci</span>
        </Link>
        
        {showLanguageSelector && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setLanguage('fr')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                language === 'fr' 
                  ? 'bg-orange-500 text-white' 
                  : 'text-gray-600 hover:text-orange-500'
              }`}
            >
              🇨🇮 FR
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                language === 'en' 
                  ? 'bg-orange-500 text-white' 
                  : 'text-gray-600 hover:text-orange-500'
              }`}
            >
              🇬🇧 EN
            </button>
          </div>
        )}
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md mx-auto">
          {/* En-tête avec titre */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">👔</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-600 text-sm sm:text-base">
                {subtitle}
              </p>
            )}
          </div>

          {/* Formulaire */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
            {children}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              🇨🇮 Service de pressing à Abidjan
            </p>
            <div className="flex justify-center space-x-4 mt-2">
              <Link to="/help" className="text-xs text-gray-400 hover:text-orange-500">
                Aide
              </Link>
              <Link to="/contact" className="text-xs text-gray-400 hover:text-orange-500">
                Contact
              </Link>
              <Link to="/privacy" className="text-xs text-gray-400 hover:text-orange-500">
                Confidentialité
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
