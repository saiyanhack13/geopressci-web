import React, { ReactNode, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Menu } from 'lucide-react';
import Navbar from '../navigation/Navbar';
import Sidebar from '../navigation/Sidebar';
import Breadcrumbs from '../navigation/Breadcrumbs';
import BottomNavigation from '../navigation/BottomNavigation';
import Footer from './Footer';

type LayoutProps = {
  children: ReactNode;
  showBreadcrumbs?: boolean;
  showSidebar?: boolean;
  className?: string;
};

const Layout = ({ 
  children, 
  showBreadcrumbs = true, 
  showSidebar = true,
  className = '' 
}: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  // Logique d'affichage selon la taille d'écran et le rôle
  const isPressingOrAdmin = user && (user.role === 'pressing' || user.role === 'admin');
  
  // Sidebar : uniquement sur PC pour pressing/admin
  const shouldShowSidebar = showSidebar && isPressingOrAdmin;
  
  // Bottom Nav : uniquement sur mobile pour tous les utilisateurs (sauf admin sur desktop)
  const shouldShowBottomNav = user?.role !== 'admin';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Navbar principal */}
      <Navbar />
      
      {/* Breadcrumbs */}
      {showBreadcrumbs && <Breadcrumbs />}
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar pour pressing et admin */}
        {shouldShowSidebar && (
          <>
            {/* Sidebar visible uniquement sur large écran (lg:) */}
            <div className="hidden lg:block">
              <Sidebar isOpen={true} onClose={() => {}} />
            </div>
            
            {/* Bouton menu mobile pour ouvrir la sidebar */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="fixed top-20 left-4 z-30 lg:hidden bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* Sidebar mobile (overlay) */}
            <div className="lg:hidden">
              <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            </div>
          </>
        )}
        
        {/* Contenu principal */}
        <main className={`flex-1 overflow-auto ${
          shouldShowSidebar ? 'lg:ml-64' : ''
        } ${shouldShowBottomNav ? 'pb-16 md:pb-0' : ''} ${className}`}>
          <div className="container mx-auto px-1 py-2 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
      
      {/* Bottom Navigation pour mobile */}
      {shouldShowBottomNav && <BottomNavigation />}
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Layout;
