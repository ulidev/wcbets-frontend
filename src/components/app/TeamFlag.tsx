import { getFlagUrl } from '@/lib/flags';

interface TeamFlagProps {
  teamName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE: Record<NonNullable<TeamFlagProps['size']>, { w: number; h: number }> = {
  sm: { w: 24, h: 16 },
  md: { w: 30, h: 20 },
  lg: { w: 40, h: 27 },
  xl: { w: 56, h: 37 },
};

export function TeamFlag({ teamName, size = 'md', className }: TeamFlagProps) {
  const url = getFlagUrl(teamName);
  const { w, h } = SIZE[size];

  if (!url) {
    return (
      <span
        style={{ width: w, height: h, borderRadius: '0 6px 0 6px' }}
        className={`inline-block bg-muted ${className ?? ''}`}
        aria-label={teamName}
      />
    );
  }

  return (
    <img
      src={url}
      alt={teamName}
      width={w}
      height={h}
      style={{ borderRadius: '0 6px 0 6px', objectFit: 'cover' }}
      className={`inline-block shrink-0 ${className ?? ''}`}
      loading="lazy"
    />
  );
}
