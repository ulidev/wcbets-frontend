interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="shrink-0 border-b border-wc-light-gray bg-white/95 px-4 py-3 backdrop-blur safe-area-pt">
      <h1 className="wc-topbar-title">{title}</h1>
    </header>
  );
}
