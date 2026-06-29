import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageTab<T extends string> {
  id: T;
  label: string;
}

interface PageChromeProps<T extends string> {
  title: string;
  description?: string;
  titleHelp?: ReactNode;
  tabs?: PageTab<T>[];
  active?: T;
  onChange?: (id: T) => void;
}

export function PageChrome<T extends string>({
  title,
  description,
  titleHelp,
  tabs,
  active,
  onChange,
}: PageChromeProps<T>) {
  return (
    <>
      <div className="hidden border-b border-wc-light-gray bg-gradient-to-r from-white to-[#f8f9fc] px-6 py-4 md:block">
        <div className="flex items-center gap-2">
          <h1 className="wc-page-title">{title}</h1>
          {titleHelp}
        </div>
        {description && <p className="wc-page-desc">{description}</p>}
      </div>

      {tabs && tabs.length > 0 && (
        <div className="flex border-b border-wc-light-gray bg-white/80">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange?.(tab.id)}
              className={cn(
                'wc-tab min-w-0 flex-1 justify-center px-2 sm:px-4',
                active === tab.id && 'wc-tab-active',
              )}
            >
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
