import type { CSSProperties } from 'react';
import { getTeamKitDisplayColors, getTeamKitPrimary, kitColorsGradient } from '@/lib/team-kits';

/** FIFA-style 3-letter code from canonical team name. */
export function teamFifaCode(teamName: string): string {
  const known: Record<string, string> = {
    Brazil: 'BRA',
    Argentina: 'ARG',
    Spain: 'ESP',
    Germany: 'GER',
    France: 'FRA',
    England: 'ENG',
    Portugal: 'POR',
    Netherlands: 'NED',
    Belgium: 'BEL',
    Croatia: 'CRO',
    Uruguay: 'URU',
    Colombia: 'COL',
    Mexico: 'MEX',
    USA: 'USA',
    Canada: 'CAN',
    Japan: 'JPN',
    'South Korea': 'KOR',
    'Saudi Arabia': 'KSA',
    Morocco: 'MAR',
    Senegal: 'SEN',
    'South Africa': 'RSA',
    Australia: 'AUS',
    Switzerland: 'SUI',
    Sweden: 'SWE',
    Norway: 'NOR',
    Scotland: 'SCO',
    Turkey: 'TUR',
    'Czech Republic': 'CZE',
    'IR Iran': 'IRN',
    'New Zealand': 'NZL',
    'DR Congo': 'COD',
    'Côte d\'Ivoire': 'CIV',
    'Cabo Verde': 'CPV',
    Curaçao: 'CUW',
    Uzbekistan: 'UZB',
    Jordan: 'JOR',
    Qatar: 'QAT',
    Iraq: 'IRQ',
    Algeria: 'ALG',
    Egypt: 'EGY',
    Ghana: 'GHA',
    Tunisia: 'TUN',
    Ecuador: 'ECU',
    Paraguay: 'PAR',
    Chile: 'CHI',
    Panama: 'PAN',
    Haiti: 'HAI',
    Austria: 'AUT',
    'Bosnia and Herzegovina': 'BIH',
  };
  if (known[teamName]) return known[teamName];
  const letters = teamName.replace(/[^A-Za-z]/g, '').toUpperCase();
  return (letters.slice(0, 3) || 'TBD').padEnd(3, 'X');
}

export function teamAccentColor(teamName: string): string {
  return getTeamKitPrimary(teamName);
}

/** Top / side stripe gradient from kit colors. */
export function teamKitStripe(teamName: string): string {
  const colors = getTeamKitDisplayColors(teamName);
  if (colors.length <= 1) return colors[0] ?? '#d1d5db';
  return kitColorsGradient(colors, '90deg');
}

/** Full-card border gradient from kit colors (1–3 bands). */
export function teamCardBorderGradient(teamName: string, side: 'home' | 'away'): string {
  const colors = getTeamKitDisplayColors(teamName);
  const angle = side === 'home' ? '135deg' : '225deg';
  const c1 = colors[0] ?? '#64748b';
  const c2 = colors[1] ?? c1;
  const c3 = colors[2];

  if (!colors[1]) {
    return `linear-gradient(${angle}, ${c1} 0%, color-mix(in srgb, ${c1} 72%, #000000) 100%)`;
  }

  if (!c3) {
    return `linear-gradient(${angle}, ${c1} 0%, color-mix(in srgb, ${c1} 50%, ${c2}) 30%, ${c2} 65%, color-mix(in srgb, ${c2} 40%, #ffffff) 100%)`;
  }

  return `linear-gradient(${angle}, ${c1} 0%, color-mix(in srgb, ${c1} 45%, ${c2}) 22%, ${c2} 42%, color-mix(in srgb, ${c2} 45%, ${c3}) 62%, ${c3} 82%, color-mix(in srgb, ${c3} 35%, #ffffff) 100%)`;
}

export const WC_2026_CENTER_LOGO = '/FIFA World Cup 2026.jpeg';

/** Border-only highlight for MatchOddsBar when the user picks a score outcome. */
export function getMatchOddsCellSurface(
  variant: 'home' | 'draw' | 'away',
  teamName: string,
  isActive: boolean,
): { className: string; style?: CSSProperties } {
  if (!isActive) {
    return { className: 'match-odds-bar__cell--neutral' };
  }

  if (variant === 'draw') {
    return { className: 'match-odds-bar__cell--draw' };
  }

  const side = variant === 'home' ? 'home' : 'away';
  return {
    className: 'match-odds-bar__cell--team',
    style: { '--team-border': teamCardBorderGradient(teamName, side) } as CSSProperties,
  };
}
