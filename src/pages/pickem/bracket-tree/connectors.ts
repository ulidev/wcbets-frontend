import { TREE_COL_W, TREE_MATCH_H } from './constants';
import type { PlacedNode } from './types';

function matchMidY(node: PlacedNode): number {
  return node.y + TREE_MATCH_H / 2;
}

function pairIntoChild(
  feeders: PlacedNode[],
  child: PlacedNode,
  direction: 'ltr' | 'rtl',
): string[] {
  const xOutTop = direction === 'ltr' ? feeders[0].x + TREE_COL_W : feeders[0].x;
  const xOutBot = direction === 'ltr' ? feeders[1].x + TREE_COL_W : feeders[1].x;
  const xIn = direction === 'ltr' ? child.x : child.x + TREE_COL_W;
  const midX = (xOutTop + xIn) / 2;
  const yTop = matchMidY(feeders[0]);
  const yBot = matchMidY(feeders[1]);
  const yChild = matchMidY(child);

  return [
    `M ${xOutTop} ${yTop} H ${midX} V ${yChild} H ${xIn}`,
    `M ${xOutBot} ${yBot} H ${midX} V ${yChild}`,
  ];
}

export function buildSideConnectorPaths(nodes: PlacedNode[], side: 'left' | 'right'): string[] {
  const paths: string[] = [];
  const byX = new Map<number, PlacedNode[]>();
  for (const n of nodes) {
    if (n.side !== side) continue;
    const list = byX.get(n.x) ?? [];
    list.push(n);
    byX.set(n.x, list);
  }

  const columns = [...byX.keys()].sort((a, b) => (side === 'left' ? a - b : b - a));

  for (let c = 0; c < columns.length - 1; c++) {
    const sourceCol = (byX.get(columns[c]) ?? []).sort((a, b) => a.matchIndex - b.matchIndex);
    const targetCol = (byX.get(columns[c + 1]) ?? []).sort((a, b) => a.matchIndex - b.matchIndex);
    const direction = side === 'left' ? 'ltr' : 'rtl';

    for (let i = 0; i < sourceCol.length; i += 2) {
      const top = sourceCol[i];
      const bottom = sourceCol[i + 1];
      const child = targetCol[Math.floor(i / 2)];
      if (!top || !bottom || !child) continue;
      paths.push(...pairIntoChild([top, bottom], child, direction));
    }
  }
  return paths;
}

export function buildCenterConnectorPaths(
  leftSf: PlacedNode | undefined,
  rightSf: PlacedNode | undefined,
  finalNode: PlacedNode | undefined,
): string[] {
  if (!leftSf || !rightSf || !finalNode) return [];
  const yFinal = matchMidY(finalNode);
  const paths: string[] = [];

  const xLeftOut = leftSf.x + TREE_COL_W;
  const midLeft = (xLeftOut + finalNode.x) / 2;
  paths.push(`M ${xLeftOut} ${matchMidY(leftSf)} H ${midLeft} V ${yFinal} H ${finalNode.x}`);

  const xRightOut = rightSf.x;
  const midRight = (finalNode.x + TREE_COL_W + xRightOut) / 2;
  paths.push(`M ${xRightOut} ${matchMidY(rightSf)} H ${midRight} V ${yFinal} H ${finalNode.x + TREE_COL_W}`);

  return paths;
}
