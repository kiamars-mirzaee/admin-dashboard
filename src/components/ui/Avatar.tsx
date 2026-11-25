import { useState } from 'react';

export interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const TONE_CLASSES = [
  'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-200',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200',
  'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-200',
];

function getToneClass(name: string): string {
  let sum = 0;
  for (let i = 0; i < name.length; i += 1) {
    sum += name.charCodeAt(i);
  }
  return TONE_CLASSES[sum % TONE_CLASSES.length];
}

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-sm',
  };

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`${sizeClasses[size]} rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700 ${className}`}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={`${sizeClasses[size]} ${getToneClass(name)} rounded-full shrink-0 flex items-center justify-center font-semibold tracking-tight select-none border border-slate-200/70 dark:border-slate-700/70 ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
