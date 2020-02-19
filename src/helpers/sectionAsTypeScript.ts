import { PlopMdData } from '../types'
import { MD } from '../parser'
import { multiLineComment } from './multiLineComment'

/**
 * Transform Paragraphs, Code, and ListItems
 * in order to a single string
 */
export function sectionAsTypeScript(this: PlopMdData): string {
  const content = this.md.content()
  const nodes = content.children.length ? content.children : [content.node]

  return nodes.reduce(
      (r, node) => {
        const { type, content } = r.pop()!

        if (node.type === 'code') {
          const value = node.value || ''

          if (type === 'code') {
            return [...r, { type, content: `${content}\n\n${value}` }]
          } else {
            return [
              ...r,
              { type, content },
              { type: 'code' as 'code', content: value },
            ]
          }
        } else {
          const value = MD.create(node).stringify()

          if (type === 'comment') {
            return [...r, { type, content: `${content}\n\n${value}` }]
          } else {
            return [
              ...r,
              { type, content },
              { type: 'comment' as 'comment', content: value },
            ]
          }
        }
      },
      [{ type: 'comment', content: '' }] as {
        type: 'code' | 'comment'
        content: string
      }[],
    )
    .map(({ type, content }) =>
      type === 'code' ? content : multiLineComment(content),
    )
    .join('\n\n')
}


