import type { BracketPhase, BracketSlotPickemOverview, TeamInfo } from '../bracket-utils';

export type BracketTreeViewProps = {
  slots: BracketSlotPickemOverview[];
  bracketPicks: Record<string, string | null>;
  teamById: Map<string, TeamInfo>;
  editable: boolean;
  onChange: (slotId: string, teamId: string | null) => void;
};

export type PlacedNode = {
  slot: BracketSlotPickemOverview | null;
  phase: BracketPhase;
  x: number;
  y: number;
  side: 'left' | 'right' | 'center';
  roundIndex: number;
  matchIndex: number;
  gridKey: string;
};

export type BracketTreeLayout = {
  placed: PlacedNode[];
  paths: string[];
  totalWidth: number;
  centerX: number;
  totalHeight: number;
  rightStart: number;
};
