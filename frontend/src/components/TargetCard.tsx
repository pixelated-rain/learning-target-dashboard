import type { LearningTargetContent } from '../courses/math1310TargetContent'
import { MathText } from './MathText'

type TargetCardProps = {
  id: string
  name: string
  expanded: boolean
  content?: LearningTargetContent
}

export function TargetCard({ id, name, expanded, content }: TargetCardProps) {
  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: expanded ? 'flex-start' : 'center',
          gap: 8,
        }}
      >
        <strong style={{ fontSize: expanded ? 24 : 20, lineHeight: 1.1 }}>
          {id.toUpperCase()}
        </strong>
        <span style={{ fontSize: expanded ? 16 : 12, lineHeight: 1.4 }}>
          {name}
        </span>
      </div>

      {expanded && content && (
        <div
          className="nodrag nowheel"
          style={{
            borderTop: '1px solid #d8d8dd',
            marginTop: 16,
            paddingTop: 12,
            fontSize: 13,
            lineHeight: 1.5,
            textAlign: 'left',
          }}
        >
          <strong>
            {content.objectives.length > 0 ? 'Learning objectives' : 'About this target'}
          </strong>

          {content.objectives.length > 0 && (
            <ul style={{ margin: '10px 0 0', paddingLeft: 20 }}>
              {content.objectives.map((objective, index) => (
                <li key={index} style={{ marginBottom: 8 }}>
                  <MathText>{objective}</MathText>
                </li>
              ))}
            </ul>
          )}

          {content.description && (
            <p style={{ margin: '10px 0 0' }}>{content.description}</p>
          )}

          {content.notes?.map((note, index) => (
            <p key={index} style={{ margin: '12px 0 0' }}>
              <MathText>{note}</MathText>
            </p>
          ))}

          {content.resources?.map((resource) => (
            <p key={resource.url} style={{ margin: '8px 0 0' }}>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                {resource.label}
              </a>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
