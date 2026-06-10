import { cn } from '@/lib/utils';

export const WC_2026_EMBLEM_SRC = '/World-Cup-2026-Emblem.svg';

interface WcLogoProps {
  size?: number;
  className?: string;
}

export function WcLogo({ size = 32, className }: WcLogoProps) {
  return (
    <img
      src={WC_2026_EMBLEM_SRC}
      alt=""
      width={size}
      height={size}
      className={cn('object-contain', className)}
      style={{ height: size, width: 'auto', maxWidth: size * 1.75 }}
      aria-hidden
    />
  );
}
