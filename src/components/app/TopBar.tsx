import { usePageHeaderExtrasSlot } from '@/contexts/PageHeaderExtrasContext';

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  const extras = usePageHeaderExtrasSlot();

  return (
    <header className="shrink-0 border-b border-wc-light-gray bg-white/95 px-4 pb-3 backdrop-blur safe-area-pt-bar">
      <div className="flex items-center gap-2">
        <h1 className="wc-topbar-title min-w-0 flex-1">{title}</h1>
        {extras}
      </div>
    </header>
  );
}
