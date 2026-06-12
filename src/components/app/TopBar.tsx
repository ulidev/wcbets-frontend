interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="shrink-0 border-b border-wc-light-gray bg-white/95 backdrop-blur safe-area-pt">
      <div className="flex h-14 items-center px-4">
        <h1 className="wc-topbar-title">{title}</h1>
      </div>
    </header>
  );
}
