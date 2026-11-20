import { MathText } from './MathText'
import type { LearningTargetContent } from '../courses/math1310TargetContent'

type TargetCardProps = {
  id: string
  name: string
  expanded: boolean
  content?: LearningTargetContent
  contentVisible?: boolean
}

export function TargetCard({
  id,
  name,
  expanded,
  content,
  contentVisible = true,
}: TargetCardProps) {
  let revealIndex = 0

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
          style={{
            borderTop: '1px solid #d8d8dd',
            marginTop: 16,
            paddingTop: 12,
            fontSize: 13,
            lineHeight: 1.5,
            textAlign: 'left',
          }}
        >
          <strong
            className="target-card-reveal-item"
            style={{ animationDelay: `${revealIndex++ * 25}ms` }}
          >
            {content.objectives.length > 0 ? 'Learning objectives' : 'About this target'}
          </strong>

          {content.objectives.length > 0 && (
            <ul
              className="target-card-objectives"
              style={{ margin: '10px 0 0', paddingLeft: 20 }}
            >
              {content.objectives.map((objective, index) => (
                <li key={index} style={{ marginBottom: 8 }}>
                  <span
                    className="target-card-reveal-item"
                    style={{
                      display: 'inline-block',
                      verticalAlign: 'top',
                      animationDelay: `${revealIndex++ * 25}ms`,
                    }}
                  >
                    <MathText>{objective}</MathText>
                  </span>
                </li>
              ))}
            </ul>
          )}

          {content.description && (
            <p
              className="target-card-reveal-item"
              style={{
                margin: '10px 0 0',
                animationDelay: `${revealIndex++ * 25}ms`,
              }}
            >
              {content.description}
            </p>
          )}

          {content.notes?.map((note, index) => (
            <p
              key={index}
              className="target-card-reveal-item"
              style={{
                margin: '12px 0 0',
                animationDelay: `${revealIndex++ * 25}ms`,
              }}
            >
              <MathText>{note}</MathText>
            </p>
          ))}

          {content.resources?.map((resource) => (
            <p
              key={resource.url}
              className="target-card-reveal-item"
              style={{
                margin: '8px 0 0',
                animationDelay: `${revealIndex++ * 25}ms`,
              }}
            >
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
