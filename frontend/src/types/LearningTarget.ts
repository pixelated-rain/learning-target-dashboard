export type ResourceLink = {
  label: string
  url: string
}

export type LessonRelationship =
  | 'primary'
  | 'preview'
  | 'reinforcement'
  | 'application'

export type LessonAssociationBasis =
  | 'explicit-target'
  | 'objective-match'
  | 'curricular-inference'

export type TargetLesson = {
  lessonId: string
  relationship: LessonRelationship
  basis?: LessonAssociationBasis
  note?: string
}

export type LearningTargetContent = {
  objectives: string[]
  description?: string
  notes?: string[]
  lessons?: TargetLesson[]
  resources?: ResourceLink[]
}

export type LearningTarget = {
  id: string
  name: string
  prerequisites: string[]
  isCore?: boolean
  content?: LearningTargetContent
}
