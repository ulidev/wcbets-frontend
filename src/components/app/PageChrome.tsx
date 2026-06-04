import { cn } from '@/lib/utils';

interface PageTab<T extends string> {
  id: T;
  label: string;
}

interface PageChromeProps<T extends string> {
  title: string;
  description?: string;
  tabs?: PageTab<T>[];
  active?: T;
  onChange?: (id: T) => void;
}

export function PageChrome<T extends string>({
  title,
  description,
  tabs,
  active,
  onChange,
}: PageChromeProps<T>) {
  return (
    <>
      <div className="hidden border-b border-border px-6 py-5 md:block">
        <h1 className="text-xl font-bold">{title}</h1>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {tabs && tabs.length > 0 && (
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange?.(tab.id)}
              className={cn(
                'flex-1 py-3 text-sm font-medium transition-colors',
                active === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
