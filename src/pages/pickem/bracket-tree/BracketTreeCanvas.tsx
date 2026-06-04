import type { CSSProperties } from 'react';
import {
  type BracketSlotPickemOverview,
  type TeamInfo,
  expectedSlotIndex,
  formatMatchLabel,
} from '../bracket-utils';
import { TREE_CENTER_W, TREE_COL_W } from './constants';
import { TreeMatchNode, TreeMatchPlaceholder } from './TreeMatchNode';
import type { BracketTreeLayout, PlacedNode } from './types';

type BracketTreeCanvasProps = {
  layout: BracketTreeLayout;
  slots: BracketSlotPickemOverview[];
  bracketPicks: Record<string, string | null>;
  teamById: Map<string, TeamInfo>;
  editable: boolean;
  onChange: (slotId: string, teamId: string | null) => void;
};

function nodeLabel(node: PlacedNode): string {
  if (node.slot) return formatMatchLabel(node.slot.slot_index);
  if (node.side === 'center') return formatMatchLabel(node.matchIndex + 1);
  return formatMatchLabel(expectedSlotIndex(node.phase, node.side, node.matchIndex));
}

function nodeStyle(node: PlacedNode): CSSProperties {
  return {
    position: 'absolute',
    left: node.x,
    top: node.y,
    width: TREE_COL_W,
  };
}

export function BracketTreeCanvas({
  layout,
  slots,
  bracketPicks,
  teamById,
  editable,
  onChange,
}: BracketTreeCanvasProps) {
  return (
    <div
      className="bracket-tree-canvas relative"
      style={{
        width: layout.totalWidth,
        height: layout.totalHeight,
        minWidth: layout.totalWidth,
      }}
    >
      <svg
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
        width={layout.totalWidth}
        height={layout.totalHeight}
        aria-hidden
      >
        {layout.paths.map((d, i) => (
          <path key={i} d={d} className="bracket-tree-line" fill="none" />
        ))}
      </svg>

      <div
        className="pointer-events-none absolute flex flex-col items-center text-center"
        style={{ left: layout.centerX, top: 8, width: TREE_CENTER_W }}
      >
        <span className="wc-section-heading text-sm">World Champions</span>
      </div>

      {layout.placed.map((node) => {
        const style = nodeStyle(node);
        const label = nodeLabel(node);

        if (!node.slot) {
          return <TreeMatchPlaceholder key={node.gridKey} label={label} style={style} />;
        }

        return (
          <TreeMatchNode
            key={node.slot.slot_id}
            slot={node.slot}
            allSlots={slots}
            bracketPicks={bracketPicks}
            teamById={teamById}
            editable={editable}
            onChange={(teamId) => onChange(node.slot!.slot_id, teamId)}
            style={style}
          />
        );
      })}
    </div>
  );
}
