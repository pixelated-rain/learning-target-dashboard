import type { LearningTarget } from './LearningTarget'

/**
 * Minimal course shape used by generic graph/layout code and lightweight
 * fixtures. A portable course package uses CourseDefinition below.
 */
export type Course = {
  targets: LearningTarget[]
}

export type LessonResource = {
  id: string
  number?: number
  title: string
  worksheetUrl?: string
  keyUrl?: string
}

/**
 * Canonical, serializable course format consumed by the dashboard.
 * Keep this plain-data-shaped so it can later be loaded from JSON/YAML.
 */
export type CourseDefinition = Course & {
  schemaVersion: 1
  id: string
  title: string
  lessons: LessonResource[]
}
