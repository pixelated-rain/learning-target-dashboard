export type ResourceLink = {
  label: string
  url: string
}

export type LinkResource = {
  type: 'link'
  label: string
  url: string
}

export type TextbookResource = {
  type: 'textbook'
  title: string
  section?: string
  pages?: string
  url?: string
}

export type LearningResource = LinkResource | TextbookResource

export type LessonRelationship =
  | 'primary'
  | 'preview'
  | 'extension'
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
  targetPage?: ResourceLink
  lessons?: TargetLesson[]
  resources?: LearningResource[]
}

export type LearningTarget = {
  id: string
  name: string
  prerequisites: string[]
  isCore?: boolean
  content?: LearningTargetContent
}
