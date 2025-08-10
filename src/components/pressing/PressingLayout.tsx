import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import MobileNavigation from './MobileNavigation';
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            {title && (
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            )}
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
          </div>
          
          {headerActions && (
            <div className="flex items-center space-x-3">
              {headerActions}
            </div>
          )}
        </div>
      </header>

      {/* Contenu principal */}
      <main className={cn("flex-1 pb-24 lg:pb-4", className)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>

      {/* Navigation mobile */}
      {!hideNav && <MobileNavigation />}
    </div>
  );
};

export default PressingLayout;
