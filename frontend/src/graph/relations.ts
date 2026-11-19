import type { LearningTarget } from '../types/LearningTarget'

export type RelationRole =
  | 'active'
  | 'prerequisite'
  | 'postrequisite'
  | 'none'

export function relationRole(
  target: LearningTarget,
  focusedTarget: LearningTarget | undefined,
): RelationRole {
  if (focusedTarget === undefined) return 'none'
  if (target.id === focusedTarget.id) return 'active'

  if (focusedTarget.prerequisites.includes(target.id)) {
    return 'prerequisite'
  }

  if (target.prerequisites.includes(focusedTarget.id)) {
    return 'postrequisite'
  }

  return 'none'
}
