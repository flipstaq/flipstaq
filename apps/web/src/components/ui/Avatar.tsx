import React from 'react';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  onClick?: () => void;
  showHoverEffect?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  '2xl': 'w-24 h-24',
};

export default function Avatar({
  src,
  alt = 'User avatar',
  size = 'md',
  className = '',
  onClick,
  showHoverEffect = false,
}: AvatarProps) {
  const defaultAvatar = '/avatars/default-avatar.svg';
  const avatarSrc = src || defaultAvatar;

  const baseClasses = `
    ${sizeClasses[size]}
    rounded-full
    overflow-hidden
    bg-gray-200
    dark:bg-gray-700
    flex-shrink-0
    ${onClick ? 'cursor-pointer' : ''}
    ${showHoverEffect ? 'transition-transform hover:scale-105' : ''}
    ${className}
  `
    .trim()
    .replace(/\s+/g, ' ');

  return (
    <div className={baseClasses} onClick={onClick}>
      <Image
        src={avatarSrc}
        alt={alt}
        width={
          size === 'xs'
            ? 24
            : size === 'sm'
              ? 32
              : size === 'md'
                ? 40
                : size === 'lg'
                  ? 48
                  : size === 'xl'
                    ? 64
                    : 96
        }
        height={
          size === 'xs'
            ? 24
            : size === 'sm'
              ? 32
              : size === 'md'
                ? 40
                : size === 'lg'
                  ? 48
                  : size === 'xl'
                    ? 64
                    : 96
        }
        className="h-full w-full object-cover"
        onError={(e) => {
          // Fallback to default avatar on error
          const target = e.target as HTMLImageElement;
          if (target.src !== defaultAvatar) {
            target.src = defaultAvatar;
          }
        }}
        priority={size === 'xl' || size === '2xl'}
        quality={100} // Maximum quality to preserve image clarity
        unoptimized={!!(src && src.includes('/uploads/avatars/'))} // Disable optimization for uploaded avatars
      />
    </div>
  );
}
