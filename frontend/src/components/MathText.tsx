import katex from 'katex'

type MathTextProps = {
  children: string
}

export function MathText({ children }: MathTextProps) {
  const parts = children.split(/(\\\(.*?\\\))/g)

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('\\(') && part.endsWith('\\)')) {
          return (
            <span
              key={index}
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(part.slice(2, -2), {
                  throwOnError: false,
                }),
              }}
            />
          )
        }

        return part
      })}
    </>
  )
}
