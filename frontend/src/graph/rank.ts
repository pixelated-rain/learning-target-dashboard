import type { LearningTarget } from "../types/LearningTarget";

export function calculateRanks(targets: LearningTarget[]): Map<string, number> {
  const targetMap = new Map(targets.map((target) => [target.id, target]));

  const ranks = new Map<string, number>();

  function rank(target: LearningTarget): number {
    const existingRank = ranks.get(target.id);

    if (existingRank !== undefined) {
      return existingRank;
    }

    if (target.prerequisites.length === 0) {
      ranks.set(target.id, 0);
      return 0;
    } else {
      let maxPrereqRank = 0;

      for (const prerequisiteId of target.prerequisites) {
        const prerequisite = targetMap.get(prerequisiteId);

        if (prerequisite === undefined) {
          throw new Error(`Unknown prerequisite: ${prerequisiteId}`);
        }

        const prerequisiteRank = rank(prerequisite);

        if (prerequisiteRank > maxPrereqRank) {
          maxPrereqRank = prerequisiteRank;
        }
      }

      const targetRank = maxPrereqRank + 1;
      ranks.set(target.id, targetRank);

      return targetRank;
    }
  }

  for (const target of targets) {
    rank(target);
  }

  return ranks;
}
