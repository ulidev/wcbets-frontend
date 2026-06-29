import { useState, type ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ScoringHelpModal,
  type ScoringHelpSection,
  type ScoringHelpSectionGroup,
} from '@/components/app/scoring-help/ScoringHelpModal';

interface ScoringHelpButtonProps {
  title: string;
  children?: ReactNode;
  sections?: ScoringHelpSection[];
  sectionGroups?: ScoringHelpSectionGroup[];
  className?: string;
}

export function ScoringHelpButton({
  title,
  children,
  sections,
  sectionGroups,
  className,
}: ScoringHelpButtonProps) {
  const [open, setOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState(sectionGroups?.[0]?.id ?? '');
  const [activeSectionId, setActiveSectionId] = useState(
    sectionGroups?.[0]?.sections[0]?.id ?? sections?.[0]?.id ?? '',
  );

  const activeGroup = sectionGroups?.find((g) => g.id === activeGroupId) ?? sectionGroups?.[0];

  function handleOpen() {
    if (sectionGroups?.[0]) {
      setActiveGroupId(sectionGroups[0].id);
      setActiveSectionId(sectionGroups[0].sections[0]?.id ?? '');
    } else if (sections?.[0]) {
      setActiveSectionId(sections[0].id);
    }
    setOpen(true);
  }

  function handleGroupChange(groupId: string) {
    const group = sectionGroups?.find((g) => g.id === groupId);
    setActiveGroupId(groupId);
    if (group?.sections[0]) setActiveSectionId(group.sections[0].id);
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Com es calculen els punts: ${title}`}
        onClick={handleOpen}
        className={cn(
          'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted/80 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
          className,
        )}
      >
        <HelpCircle className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>

      <ScoringHelpModal
        open={open}
        title={title}
        onClose={() => setOpen(false)}
        sections={sections}
        sectionGroups={sectionGroups}
        activeGroupId={activeGroup?.id ?? activeGroupId}
        activeSectionId={activeSectionId}
        onGroupChange={handleGroupChange}
        onSectionChange={setActiveSectionId}
      >
        {children}
      </ScoringHelpModal>
    </>
  );
}
