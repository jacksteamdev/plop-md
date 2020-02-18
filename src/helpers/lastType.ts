import { PlopMdData } from '../types'
import { getExportedTypes } from './units/getExportedTypes'

export function lastType(
  this: PlopMdData,
  options: Handlebars.HelperOptions,
): string {
  const code = this.md
    .code('typescript', 'ts')
    .values()
    .join('\n\n')

  const [type] = getExportedTypes(code).pop() || []

  if (type) {
    return options.fn({ type })
  } else {
    return ''
  }
}
