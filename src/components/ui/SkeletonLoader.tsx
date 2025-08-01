import React from 'react';

interface SkeletonProps {
  className?: string;
  height?: string | number;
  width?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  count?: number;
  inline?: boolean;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  height = '1rem',
  width = '100%',
  rounded = 'md',
  count = 1,
  inline = false,
  circle = false,
}) => {
  const borderRadius = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }[rounded];

  const elements = Array(count).fill(0).map((_, i) => (
    <div
      key={i}
      className={cn(
        'bg-gray-200 animate-pulse',
        borderRadius,
        circle ? 'rounded-full' : '',
        className
      )}
      style={{
        height: circle ? width : height,
        width,
        display: inline ? 'inline-block' : 'block',
        marginRight: inline && i < count - 1 ? '0.5rem' : '0',
      }}
      aria-hidden="true"
    />
  ));

  return <>{elements}</>;
};

// Composants prédéfinis

export const TextSkeleton: React.FC<{ lines?: number; className?: string }> = ({
  lines = 1,
  className = '',
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array(lines)
      .fill(0)
      .map((_, i) => (
        <Skeleton
          key={i}
          height="1rem"
          width={i === lines - 1 && lines > 1 ? '80%' : '100%'}
          className="last:w-4/5"
          rounded="sm"
        />
      ))}
  </div>
);

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
    <Skeleton height="120px" width="100%" className="rounded-none" />
    <div className="p-4">
      <Skeleton height="24px" width="60%" className="mb-3" />
      <TextSkeleton lines={3} className="mb-4" />
      <Skeleton height="36px" width="100%" className="rounded-md" />
    </div>
  </div>
);

export const AvatarSkeleton: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({
  size = 'md',
}) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
  };

  return <Skeleton className={sizes[size]} rounded="full" />;
};

export const ImageSkeleton: React.FC<{ className?: string; ratio?: string }> = ({
  className = '',
  ratio = 'aspect-w-16 aspect-h-9',
}) => (
  <div className={`relative bg-gray-200 overflow-hidden ${ratio} ${className}`}>
    <Skeleton className="absolute inset-0 w-full h-full" />
  </div>
);

// Utilitaire pour combiner les classes
export function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
