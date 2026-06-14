import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-orange-500',
  'bg-cyan-500',
];

export function getAvatarColor(id: string) {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/** Round points to 1 decimal, dropping the trailing .0 for whole numbers. */
export function fmtPts(pts: number): string {
  const v = Math.round(pts * 10) / 10;
  return v % 1 === 0 ? String(v) : v.toFixed(1);
}
