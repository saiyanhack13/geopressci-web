import React, { ReactNode, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
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

  const shouldShowSidebar = showSidebar && user && (user.role === 'pressing' || user.role === 'admin');
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
            <Sidebar 
              isOpen={sidebarOpen} 
              onClose={() => setSidebarOpen(false)} 
            />
            {/* Bouton toggle sidebar mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="fixed top-20 left-4 z-30 lg:hidden bg-white p-2 rounded-full shadow-lg border border-gray-200"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </>
        )}
        
        {/* Contenu principal */}
        <main className={`flex-1 overflow-auto ${
          shouldShowSidebar ? 'lg:ml-64' : ''
        } ${shouldShowBottomNav ? 'pb-16 md:pb-0' : ''} ${className}`}>
          <div className="container mx-auto px-4 py-6 max-w-7xl">
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
