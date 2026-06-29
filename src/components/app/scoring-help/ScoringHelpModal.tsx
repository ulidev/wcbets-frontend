import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ScoringHelpSection {
  id: string;
  label: string;
  content: ReactNode;
}

export interface ScoringHelpSectionGroup {
  id: string;
  label: string;
  sections: ScoringHelpSection[];
}

interface ScoringHelpModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  sections?: ScoringHelpSection[];
  sectionGroups?: ScoringHelpSectionGroup[];
  activeSectionId?: string;
  activeGroupId?: string;
  onSectionChange?: (id: string) => void;
  onGroupChange?: (id: string) => void;
  children?: ReactNode;
}

export function ScoringHelpModal({
  open,
  title,
  onClose,
  sections,
  sectionGroups,
  activeSectionId,
  activeGroupId,
  onSectionChange,
  onGroupChange,
  children,
}: ScoringHelpModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const activeGroup =
    sectionGroups?.find((g) => g.id === activeGroupId) ?? sectionGroups?.[0] ?? null;
  const visibleSections = activeGroup?.sections ?? sections ?? [];
  const activeSection =
    visibleSections.find((s) => s.id === activeSectionId) ?? visibleSections[0] ?? null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative z-10 flex max-h-[min(88dvh,40rem)] w-full max-w-md flex-col overflow-hidden',
          'rounded-2xl border border-border bg-background shadow-xl',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-start gap-3 border-b border-border px-4 py-3 sm:px-5 sm:py-4">
          <h2 className="min-w-0 flex-1 pr-1 text-sm font-semibold leading-snug text-foreground sm:text-base">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tancar"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {sectionGroups && sectionGroups.length > 1 && (
          <nav
            className="shrink-0 border-b border-border px-3 py-2 sm:px-4"
            aria-label="Tipus de puntuació"
          >
            <div className="flex gap-1 rounded-lg bg-muted/60 p-1">
              {sectionGroups.map((group) => {
                const isActive = group.id === (activeGroup?.id ?? sectionGroups[0].id);
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => onGroupChange?.(group.id)}
                    className={cn(
                      'flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors',
                      isActive
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {group.label}
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {visibleSections.length > 1 && (
          <nav
            className="shrink-0 overflow-x-auto border-b border-border px-3 py-2 sm:px-4"
            aria-label="Seccions de l'explicació"
          >
            <div className="flex min-w-min gap-1.5">
              {visibleSections.map((section) => {
                const isActive = section.id === (activeSection?.id ?? visibleSections[0].id);
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => onSectionChange?.(section.id)}
                    className={cn(
                      'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {section.label}
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 text-sm leading-relaxed text-muted-foreground sm:px-5 sm:py-5">
          {activeSection ? activeSection.content : children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
