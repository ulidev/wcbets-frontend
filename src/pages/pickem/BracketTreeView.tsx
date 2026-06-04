import { useMemo } from 'react';
import { slotsByPhaseOrdered } from './bracket-utils';
import { BracketMobileJump } from './bracket-tree/BracketMobileJump';
import { BracketTreeCanvas } from './bracket-tree/BracketTreeCanvas';
import { computeBracketTreeLayout } from './bracket-tree/layout';
import type { BracketTreeViewProps } from './bracket-tree/types';
import { useBracketTreeScroll } from './bracket-tree/useBracketTreeScroll';

export type { BracketTreeViewProps } from './bracket-tree/types';

export function BracketTreeView({
  slots,
  bracketPicks,
  teamById,
  editable,
  onChange,
}: BracketTreeViewProps) {
  const byPhase = useMemo(() => slotsByPhaseOrdered(slots), [slots]);
  const layout = useMemo(() => computeBracketTreeLayout(byPhase), [byPhase]);
  const { scrollRef, scrollToRegion } = useBracketTreeScroll(layout.totalWidth);

  return (
    <div className="bracket-tree-wrap">
      <BracketMobileJump
        onJumpLeft={() => scrollToRegion('left')}
        onJumpRight={() => scrollToRegion('right')}
      />
      <div ref={scrollRef} className="bracket-tree-scroll">
        <BracketTreeCanvas
          layout={layout}
          slots={slots}
          bracketPicks={bracketPicks}
          teamById={teamById}
          editable={editable}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
