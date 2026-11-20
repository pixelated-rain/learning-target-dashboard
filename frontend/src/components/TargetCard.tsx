import { useEffect, useMemo, useState } from 'react'
import { MathText } from './MathText'
import type { LessonResource } from '../types/Course'
import type {
  LearningResource,
  LearningTargetContent,
  LessonRelationship,
  TargetLesson,
} from '../types/LearningTarget'

type TargetCardTab = 'objectives' | 'lessons' | 'connections' | 'resources'

type TargetCardProps = {
  id: string
  name: string
  expanded: boolean
  content?: LearningTargetContent
  lessons?: LessonResource[]
  contentVisible?: boolean
}

const tabLabels: Record<TargetCardTab, string> = {
  objectives: 'Objectives',
  lessons: 'Lessons',
  connections: 'Connections',
  resources: 'Resources',
}

const relationshipLabels: Record<Exclude<LessonRelationship, 'primary'>, string> = {
  preview: 'Preview',
  extension: 'Extension',
  application: 'Application',
}

function LessonRow({
  association,
  lesson,
  showRelationship = false,
}: {
  association: TargetLesson
  lesson?: LessonResource
  showRelationship?: boolean
}) {
  const title = lesson?.title ?? association.lessonId
  const number = lesson?.number
  const worksheet = lesson?.worksheet
  const key = lesson?.key

  return (
    <div className="target-card-lesson-row">
      <span className="target-card-lesson-number">
        {number ?? ''}
      </span>

      <div className="target-card-lesson-main">
        {worksheet ? (
          <a
            className="target-card-lesson-title target-card-link"
            href={worksheet.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {title}
          </a>
        ) : (
          <span className="target-card-lesson-title">{title}</span>
        )}

        {showRelationship && association.relationship !== 'primary' && (
          <span className="target-card-lesson-relationship">
            {relationshipLabels[association.relationship]}
          </span>
        )}
      </div>

      {key && (
        <a
          className="target-card-key-link target-card-link"
          href={key.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Key
        </a>
      )}
    </div>
  )
}

function ResourceItem({ resource }: { resource: LearningResource }) {
  if (resource.type === 'link') {
    return (
      <div className="target-card-resource-item">
        <a
          className="target-card-link"
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {resource.label}
        </a>
      </div>
    )
  }

  const details = [resource.section, resource.pages].filter(Boolean).join(' · ')
  const title = resource.url ? (
    <a
      className="target-card-link"
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {resource.title}
    </a>
  ) : (
    <span>{resource.title}</span>
  )

  return (
    <div className="target-card-resource-item">
      <strong>{title}</strong>
      {details && <span className="target-card-resource-details">{details}</span>}
    </div>
  )
}

export function TargetCard({
  id,
  name,
  expanded,
  content,
  lessons = [],
  contentVisible = true,
}: TargetCardProps) {
  const [activeTab, setActiveTab] = useState<TargetCardTab>('objectives')

  useEffect(() => {
    if (!expanded) {
      setActiveTab('objectives')
    }
  }, [expanded])

  const lessonsById = useMemo(
    () => new Map(lessons.map((lesson) => [lesson.id, lesson])),
    [lessons],
  )

  const associations = content?.lessons ?? []
  const primaryLessons = associations.filter(
    (association) => association.relationship === 'primary',
  )
  const connections = associations.filter(
    (association) => association.relationship !== 'primary',
  )
  const resources = content?.resources ?? []

  const availableTabs: TargetCardTab[] = [
    'objectives',
    ...(primaryLessons.length > 0 ? ['lessons' as const] : []),
    ...(connections.length > 0 ? ['connections' as const] : []),
    ...(resources.length > 0 ? ['resources' as const] : []),
  ]

  const shownTab = availableTabs.includes(activeTab) ? activeTab : 'objectives'

  function selectTab(tab: TargetCardTab) {
    setActiveTab(tab)
  }

  return (
    <div className="target-card-shell">
      <div
        className="target-card-header"
        style={{ alignItems: expanded ? 'flex-start' : 'center' }}
      >
        <strong style={{ fontSize: expanded ? 24 : 22, lineHeight: 1.1 }}>
          {id.toUpperCase()}
        </strong>
        <span style={{ fontSize: expanded ? 16 : 14, lineHeight: 1.4 }}>
          {name}
        </span>
      </div>

      {expanded && content && (
        <div
          aria-hidden={!contentVisible}
          className={`nodrag nowheel target-card-details${contentVisible ? ' target-card-details--visible' : ''}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div key={shownTab} className="target-card-tab-panel">
            {shownTab === 'objectives' && (
              <>
                <strong className="target-card-section-title">
                  {content.objectives.length > 0 ? 'Learning objectives' : 'About this target'}
                </strong>

                {content.objectives.length > 0 && (
                  <ul className="target-card-objectives">
                    {content.objectives.map((objective, index) => (
                      <li key={index}>
                        <span className="target-card-objective-text">
                          <MathText>{objective}</MathText>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {content.description && (
                  <p className="target-card-copy">{content.description}</p>
                )}

                {content.notes?.map((note, index) => (
                  <p key={index} className="target-card-copy">
                    <MathText>{note}</MathText>
                  </p>
                ))}

                {content.targetPage && (
                  <a
                    className="target-card-target-page target-card-link"
                    href={content.targetPage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {content.targetPage.label}
                  </a>
                )}
              </>
            )}

            {shownTab === 'lessons' && (
              <>
                <strong className="target-card-section-title">Lessons</strong>
                <div className="target-card-lesson-list">
                  {primaryLessons.map((association) => (
                    <LessonRow
                      key={association.lessonId}
                      association={association}
                      lesson={lessonsById.get(association.lessonId)}
                    />
                  ))}
                </div>
              </>
            )}

            {shownTab === 'connections' && (
              <>
                <strong className="target-card-section-title">Connections</strong>
                <div className="target-card-lesson-list">
                  {connections.map((association) => (
                    <LessonRow
                      key={`${association.lessonId}-${association.relationship}`}
                      association={association}
                      lesson={lessonsById.get(association.lessonId)}
                      showRelationship
                    />
                  ))}
                </div>
              </>
            )}

            {shownTab === 'resources' && (
              <>
                <strong className="target-card-section-title">Resources</strong>
                <div className="target-card-resource-list">
                  {resources.map((resource, index) => (
                    <ResourceItem key={index} resource={resource} />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="target-card-tabs" role="tablist" aria-label={`${id} details`}>
            {availableTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={shownTab === tab}
                className={`target-card-tab${shownTab === tab ? ' target-card-tab--active' : ''}`}
                onClick={(event) => {
                  event.stopPropagation()
                  selectTab(tab)
                }}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
