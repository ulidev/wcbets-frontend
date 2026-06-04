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
      <div className="hidden border-b border-wc-light-gray bg-gradient-to-r from-white to-[#f8f9fc] px-6 py-4 md:block">
        <h1 className="wc-page-title">{title}</h1>
        {description && <p className="wc-page-desc">{description}</p>}
      </div>

      {tabs && tabs.length > 0 && (
        <div className="flex border-b border-wc-light-gray bg-white/80">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange?.(tab.id)}
              className={cn('wc-tab', active === tab.id && 'wc-tab-active')}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
