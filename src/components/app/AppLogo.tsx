import { WcLogo } from './WcLogo';

interface AppLogoProps {
  size?: number;
  className?: string;
}

export function AppLogo({ size = 32, className }: AppLogoProps) {
  return <WcLogo size={size} className={className} />;
}
