import React from 'react';


interface PressingLayoutProps {
  children: React.ReactNode;
}

const PressingLayout: React.FC<PressingLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Visible uniquement sur grands écrans */}
            
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Responsive */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">
                Espace Pressing
              </h1>
              <p className="text-gray-600 mt-1 text-sm lg:text-base hidden sm:block">
                Gérez votre pressing en toute simplicité
              </p>
            </div>
            
            {/* Quick Actions - Responsive */}
            <div className="flex items-center space-x-2 lg:space-x-4">
              <button className="bg-gradient-to-r from-orange-500 to-green-500 text-white px-3 lg:px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 font-medium text-sm lg:text-base">
                <span className="hidden sm:inline">➕ Nouvelle commande</span>
                <span className="sm:hidden">➕</span>
              </button>
              
              <button className="hidden lg:flex bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                📊 Rapport du jour
              </button>
            </div>
          </div>
        </header>
        
        {/* Page Content - Responsive padding */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>
      

    </div>
  );
};

export default PressingLayout;
