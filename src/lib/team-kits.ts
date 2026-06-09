/**
 * WC 2026 — 48 teams, kit primary colors (ordered bands left-to-right / top-to-bottom).
 * Canonical keys match DB / seed_real_data; aliases cover API and display variants.
 */
const WC_2026_KIT_PRIMARIES: Record<string, readonly string[]> = {
  // AFC (9)
  Australia: ['#FFCD00', '#00843D'],
  'IR Iran': ['#239F40', '#FFFFFF', '#DA0000'],
  Japan: ['#003087', '#FFFFFF', '#BC002D'],
  Jordan: ['#007A3D', '#FFFFFF', '#000000'],
  'South Korea': ['#CD2E3A', '#0047A0', '#FFFFFF'],
  Qatar: ['#8A1538', '#FFFFFF'],
  'Saudi Arabia': ['#006C35', '#FFFFFF'],
  Uzbekistan: ['#1EB53A', '#FFFFFF', '#0099B5'],
  Iraq: ['#CE1126', '#FFFFFF', '#007A3D'],

  // CAF (10)
  Algeria: ['#006233', '#FFFFFF'],
  'Cabo Verde': ['#003893', '#FFFFFF', '#CF2027'],
  "Côte d'Ivoire": ['#F77F00', '#FFFFFF', '#009639'],
  Egypt: ['#CE1126', '#FFFFFF', '#000000'],
  Ghana: ['#006B3F', '#FCD116', '#CE1126'],
  Morocco: ['#C1272D', '#006233'],
  Senegal: ['#00853F', '#FDEF42', '#E31B23'],
  'South Africa': ['#007A4D', '#FFB612', '#002395'],
  Tunisia: ['#E70013', '#FFFFFF'],
  'DR Congo': ['#007FFF', '#F7D618', '#CE1026'],

  // CONCACAF (6)
  USA: ['#BF0A30', '#FFFFFF', '#002868'],
  Canada: ['#FF0000', '#FFFFFF'],
  Mexico: ['#006847', '#FFFFFF', '#CE1126'],
  Curaçao: ['#002B7F', '#FCD116', '#FFFFFF'],
  Haiti: ['#00209F', '#D21034'],
  Panama: ['#DA121A', '#072357', '#FFFFFF'],

  // CONMEBOL (6)
  Argentina: ['#75AADB', '#FFFFFF'],
  Brazil: ['#FFDF00', '#009C3B'],
  Colombia: ['#FCD116', '#003893', '#CE1126'],
  Ecuador: ['#FFD100', '#003087', '#EF3340'],
  Paraguay: ['#D52B1E', '#0038A8', '#FFFFFF'],
  Uruguay: ['#75AADB', '#FFFFFF', '#FFB612'],

  // OFC (1)
  'New Zealand': ['#000000', '#FFFFFF'],

  // UEFA (16)
  England: ['#FFFFFF', '#CE1124'],
  France: ['#002395', '#FFFFFF', '#ED2939'],
  Croatia: ['#FF0000', '#FFFFFF', '#171796'],
  Norway: ['#BA0C2F', '#00205B', '#FFFFFF'],
  Portugal: ['#006600', '#FF0000'],
  Germany: ['#000000', '#DD0000', '#FFCE00'],
  Netherlands: ['#FF6600', '#FFFFFF'],
  Austria: ['#ED1C24', '#FFFFFF'],
  Belgium: ['#000000', '#FAE042', '#ED2939'],
  Scotland: ['#0065BD', '#FFFFFF'],
  Spain: ['#C60B1E', '#FFC400'],
  Switzerland: ['#FF0000', '#FFFFFF'],
  Sweden: ['#006AA7', '#FECC00'],
  Turkey: ['#E30A17', '#FFFFFF'],
  'Bosnia and Herzegovina': ['#002395', '#FECB00'],
  'Czech Republic': ['#11457E', '#FFFFFF', '#D7141A'],
};

/** Spelling variants → canonical WC_2026 key (aligned with team_name_aliases.py). */
const TEAM_KIT_ALIASES: Record<string, string> = {
  Iran: 'IR Iran',
  'Korea Republic': 'South Korea',
  'United States': 'USA',
  Curacao: 'Curaçao',
  'Cape Verde': 'Cabo Verde',
  'Ivory Coast': "Côte d'Ivoire",
  "Cote d'Ivoire": "Côte d'Ivoire",
  'Congo DR': 'DR Congo',
  'Democratic Republic of Congo': 'DR Congo',
  Czechia: 'Czech Republic',
  Türkiye: 'Turkey',
};

const DEFAULT_KIT = ['#64748b'] as const;

export type TeamKitTheme = {
  colors: string[];
  fill: string;
  accent: string;
};

function resolveTeamKitKey(teamName: string): string {
  const trimmed = teamName.trim();
  if (!trimmed) return '';
  if (trimmed in WC_2026_KIT_PRIMARIES) return trimmed;
  return TEAM_KIT_ALIASES[trimmed] ?? trimmed;
}

export function getTeamKitColors(teamName: string): string[] {
  const key = resolveTeamKitKey(teamName);
  if (!key) return [...DEFAULT_KIT];
  return [...(WC_2026_KIT_PRIMARIES[key] ?? DEFAULT_KIT)];
}

export function getTeamKitPrimary(teamName: string): string {
  return getTeamKitColors(teamName)[0] ?? DEFAULT_KIT[0];
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return null;
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

export function getKitTextOnColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#ffffff';
  const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return lum > 0.62 ? '#1e293b' : '#ffffff';
}

export function kitColorsGradient(colors: string[], direction = '90deg'): string {
  if (colors.length <= 1) return colors[0] ?? DEFAULT_KIT[0];
  const step = 100 / colors.length;
  const stops = colors
    .map((color, index) => {
      const start = index * step;
      const end = (index + 1) * step;
      return `${color} ${start}%, ${color} ${end}%`;
    })
    .join(', ');
  return `linear-gradient(${direction}, ${stops})`;
}

export function getTeamKitAccent(teamName: string): string {
  for (const color of getTeamKitColors(teamName)) {
    if (getKitTextOnColor(color) !== '#1e293b') return color;
  }
  return '#64748b';
}

export function getTeamKitTheme(teamName: string): TeamKitTheme {
  const colors = getTeamKitColors(teamName);
  return {
    colors,
    fill: kitColorsGradient(colors, '160deg'),
    accent: getTeamKitAccent(teamName),
  };
}