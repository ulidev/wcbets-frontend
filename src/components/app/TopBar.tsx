interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="shrink-0 border-b border-border bg-background/95 backdrop-blur px-4 py-3">
      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  );
}
