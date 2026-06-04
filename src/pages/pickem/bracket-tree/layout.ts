import {
  type BracketPhase,
  type BracketSlotPickemOverview,
  BRACKET_HALF_COUNTS,
  LEFT_TREE_PHASES,
  RIGHT_TREE_PHASES,
  matchCenterY,
  regionSlotGrid,
  treeSideHeight,
} from '../bracket-utils';
import { buildCenterConnectorPaths, buildSideConnectorPaths } from './connectors';
import { TREE_CENTER_W, TREE_COL_STEP, TREE_COL_W, TREE_GAP_W, TREE_MATCH_H, TREE_ROW_UNIT } from './constants';
import type { BracketTreeLayout, PlacedNode } from './types';

function placeSideNodes(
  placed: PlacedNode[],
  byPhase: Map<BracketPhase, BracketSlotPickemOverview[]>,
  phases: BracketPhase[],
  side: 'left' | 'right',
  startX: number,
): void {
  phases.forEach((phase, col) => {
    const depthRound = LEFT_TREE_PHASES.indexOf(phase);
    const grid = regionSlotGrid(phase, byPhase.get(phase) ?? [], side);
    grid.forEach((slot, matchIndex) => {
      placed.push({
        slot,
        phase,
        x: startX + col * TREE_COL_STEP,
        y: matchCenterY(depthRound, matchIndex, TREE_ROW_UNIT),
        side,
        roundIndex: depthRound,
        matchIndex,
        gridKey: `${side}-${phase}-${matchIndex}`,
      });
    });
  });
}

export function computeBracketTreeLayout(
  byPhase: Map<BracketPhase, BracketSlotPickemOverview[]>,
): BracketTreeLayout {
  const placed: PlacedNode[] = [];
  const leafHalf = BRACKET_HALF_COUNTS.ROUND_OF_32;
  const sideHeight = treeSideHeight(leafHalf, TREE_ROW_UNIT);
  const sfRoundIndex = LEFT_TREE_PHASES.indexOf('SEMI_FINAL');
  const sfY = matchCenterY(sfRoundIndex, 0, TREE_ROW_UNIT);

  placeSideNodes(placed, byPhase, LEFT_TREE_PHASES, 'left', 0);

  const leftCols = LEFT_TREE_PHASES.length;
  const centerX = leftCols * TREE_COL_STEP;
  const finalSlots = byPhase.get('FINAL') ?? [];
  const thirdSlots = byPhase.get('THIRD_FOURTH_POSITION') ?? [];

  if (finalSlots[0]) {
    placed.push({
      slot: finalSlots[0],
      phase: 'FINAL',
      x: centerX + (TREE_CENTER_W - TREE_COL_W) / 2,
      y: sfY,
      side: 'center',
      roundIndex: sfRoundIndex,
      matchIndex: 0,
      gridKey: 'center-final',
    });
  }
  if (thirdSlots[0]) {
    placed.push({
      slot: thirdSlots[0],
      phase: 'THIRD_FOURTH_POSITION',
      x: centerX + (TREE_CENTER_W - TREE_COL_W) / 2,
      y: sfY + TREE_MATCH_H + 44,
      side: 'center',
      roundIndex: sfRoundIndex + 1,
      matchIndex: 0,
      gridKey: 'center-third',
    });
  }

  const rightStart = centerX + TREE_CENTER_W + TREE_GAP_W;
  placeSideNodes(placed, byPhase, RIGHT_TREE_PHASES, 'right', rightStart);

  const totalWidth = rightStart + RIGHT_TREE_PHASES.length * TREE_COL_STEP;
  const totalHeight = Math.max(sideHeight, sfY + TREE_MATCH_H + 150);

  const leftSf = placed.find((p) => p.side === 'left' && p.roundIndex === sfRoundIndex);
  const rightSf = placed.find((p) => p.side === 'right' && p.roundIndex === sfRoundIndex);
  const finalNode = placed.find((p) => p.gridKey === 'center-final');

  const paths = [
    ...buildSideConnectorPaths(placed, 'left'),
    ...buildSideConnectorPaths(placed, 'right'),
    ...buildCenterConnectorPaths(leftSf, rightSf, finalNode),
  ];

  return { placed, paths, totalWidth, centerX, totalHeight, rightStart };
}
