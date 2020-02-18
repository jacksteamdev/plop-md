import { PlopMdData } from '../types'
import { MD } from '../parser'

export function eachListItem(
  this: PlopMdData,
  options: Handlebars.HelperOptions,
) {
  return this.md
    .eachMatch({ type: 'listItem' })
    .children.map((li) => {
      return options.fn({ listItem: MD.values(li).join(' ') })
    })
    .join('\n\n')
}
