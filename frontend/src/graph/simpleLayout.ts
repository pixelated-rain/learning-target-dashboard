import type { LearningTarget } from "../types/LearningTarget";
import { calculateRanks } from "./rank";

export const NODE_WIDTH = 170;
export const NODE_HEIGHT = 110;

const COLUMN_GAP = 140;
const ROW_GAP = 36;

export function simpleLayout(targets: LearningTarget[]) {
  const ranks = calculateRanks(targets);

  // Group targets by rank.
  const layers = new Map<number, LearningTarget[]>();

  for (const target of targets) {
    const rank = ranks.get(target.id);

    if (rank === undefined) {
      throw new Error(`Missing rank for ${target.id}`);
    }

    const layer = layers.get(rank) ?? [];
    layer.push(target);
    layers.set(rank, layer);
  }

  const positions = new Map<string, { x: number; y: number }>();

  // Process ranks from left to right.
  const sortedLayers = [...layers.entries()].sort((a, b) => a[0] - b[0]);

  for (const [rank, layer] of sortedLayers) {
    // Average vertical position of a target's prerequisites.
    function barycenter(target: LearningTarget): number {
      if (target.prerequisites.length === 0) {
        return 0;
      }

      let sum = 0;

      for (const id of target.prerequisites) {
        const position = positions.get(id);

        if (position === undefined) {
          throw new Error(`Missing prerequisite position: ${id}`);
        }

        sum += position.y;
      }

      return sum / target.prerequisites.length;
    }

    // Place targets near their prerequisites.
    layer.sort((a, b) => barycenter(a) - barycenter(b));

    // Evenly space the targets within each rank.
    layer.forEach((target, index) => {
      positions.set(target.id, {
        x: rank * (NODE_WIDTH + COLUMN_GAP),
        y: (index - (layer.length - 1) / 2) * (NODE_HEIGHT + ROW_GAP),
      });
    });
  }

  // Preserve every original prerequisite arrow.
  const edges = targets.flatMap((target) =>
    target.prerequisites.map((source) => ({
      source,
      target: target.id,
    })),
  );

  return { positions, edges };
}
