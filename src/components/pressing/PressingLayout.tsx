import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import { cn } from '../../lib/utils';

interface PressingLayoutProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  headerActions?: ReactNode;
}

const PressingLayout: React.FC<PressingLayoutProps> = ({
  children,
  className = '',
  title,
  description,
  headerActions,
}) => {
  const location = useLocation();

  // Masquer la navigation sur certaines pages
  const hideNav = ['/pressing/login', '/pressing/register'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* En-tête */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        
      </header>

      {/* Contenu principal */}
      <main className={cn("flex-1 pb-24 lg:pb-4", className)}>
        <div className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8 py-1">
          {children}
        </div>
      </main>


    </div>
  );
};

export default PressingLayout;
