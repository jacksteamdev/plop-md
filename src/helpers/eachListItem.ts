import { PlopMdData } from '../types'
import { MD } from '../parser'

export function eachListItem(
  this: PlopMdData,
  options: Handlebars.HelperOptions,
) {
  const lists = this.md.eachMatch({ type: 'list' })

  const listItems = MD.create(lists.children).children.map((li) =>
    MD.values(li).join(' '),
  )

  return listItems
    .map((listItem) => {
      return options.fn({ listItem })
    })
    .join('\n\n')
}
