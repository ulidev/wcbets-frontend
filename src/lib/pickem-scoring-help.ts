/** Pick'em group row: 1st↔2nd swap partial credit (v3). */
export function isTopTwoSwap(predicted: number, actual: number): boolean {
  return predicted !== actual && new Set([predicted, actual]).size === 2 && predicted <= 2 && actual <= 2;
}

const GROUP_EXACT_PTS = 5;
const GROUP_SWAP_PTS = 3;
const GROUP_PERFECT_BONUS = 5;

/** Mirror backend v3 group Pick'em scoring from display order (index + 1 = predicted rank). */
export function computeGroupStagePoints(
  teamsInOrder: Array<{ actual_position?: number | null }>,
): number | null {
  if (!teamsInOrder.some((t) => t.actual_position != null)) return null;

  let total = 0;
  let allExact = true;
  let allScored = true;

  for (let i = 0; i < teamsInOrder.length; i++) {
    const predicted = i + 1;
    const actual = teamsInOrder[i].actual_position;
    if (actual == null) {
      allScored = false;
      allExact = false;
      continue;
    }
    if (actual === predicted) {
      total += GROUP_EXACT_PTS;
    } else if (isTopTwoSwap(predicted, actual)) {
      total += GROUP_SWAP_PTS;
      allExact = false;
    } else {
      allExact = false;
    }
  }

  if (allExact && allScored && teamsInOrder.length >= 2) {
    total += GROUP_PERFECT_BONUS;
  }

  return total;
}
