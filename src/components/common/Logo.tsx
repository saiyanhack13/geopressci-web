import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'text';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  variant = 'full', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  // Logo icon SVG
  const LogoIcon = () => (
    <svg 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClasses[size]} ${className}`}
    >
      {/* Background */}
      <rect width="64" height="64" rx="12" fill="#3B82F6"/>
      
      {/* Washing machine outline */}
      <rect x="12" y="16" width="40" height="32" rx="4" fill="white"/>
      
      {/* Main drum */}
      <circle cx="32" cy="32" r="10" fill="none" stroke="#3B82F6" strokeWidth="2"/>
      <circle cx="32" cy="32" r="6" fill="none" stroke="#3B82F6" strokeWidth="1"/>
      
      {/* Control panel */}
      <rect x="16" y="20" width="32" height="4" rx="2" fill="#E5E7EB"/>
      
      {/* Control buttons */}
      <circle cx="20" cy="22" r="1" fill="#3B82F6"/>
      <circle cx="24" cy="22" r="1" fill="#10B981"/>
      <circle cx="28" cy="22" r="1" fill="#F59E0B"/>
      
      {/* Display */}
      <rect x="36" y="20" width="12" height="4" rx="1" fill="#1F2937"/>
      
      {/* Letter G in center */}
      <text x="32" y="38" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#3B82F6">G</text>
      
      {/* Small location pin */}
      <path d="M42 12 L46 12 L44 16 Z" fill="#EF4444"/>
      <circle cx="44" cy="10" r="2" fill="#EF4444"/>
    </svg>
  );

  // Logo text
  const LogoText = () => (
    <span className={`font-bold text-blue-600 ${textSizeClasses[size]} ${className}`}>
      GeoPressCI
    </span>
  );

  // Full logo with icon and text
  const FullLogo = () => (
    <div className={`flex items-center space-x-2 ${className}`}>
      <LogoIcon />
      <div className="flex flex-col">
        <span className={`font-bold text-blue-600 ${textSizeClasses[size]}`}>
          GeoPressCI
        </span>
        {size === 'lg' || size === 'xl' ? (
          <span className="text-xs text-gray-500 -mt-1">
            Pressing à domicile
          </span>
        ) : null}
      </div>
    </div>
  );

  switch (variant) {
    case 'icon':
      return <LogoIcon />;
    case 'text':
      return <LogoText />;
    case 'full':
    default:
      return <FullLogo />;
  }
};

export default Logo;
