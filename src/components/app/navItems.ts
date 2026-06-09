import { Calendar, ListChecks, Sparkles, Trophy, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

export const navItems: NavItem[] = [
  { to: '/matches', icon: Calendar, label: 'Partits' },
  { to: '/pickem', icon: ListChecks, label: "Pick'em" },
  { to: '/crystal-ball', icon: Sparkles, label: 'Crystal Ball' },
  { to: '/leaderboard', icon: Trophy, label: 'Classificació' },
  { to: '/profile', icon: User, label: 'Perfil' },
];
