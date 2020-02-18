import { PlopMdData } from '../types'
import { getExportedTypes } from './units/getExportedTypes'

export function eachType(
  this: PlopMdData,
  options: Handlebars.HelperOptions,
): string {
  const code = this.md
    .code('typescript', 'ts')
    .values()
    .join('\n\n')

  const types = getExportedTypes(code)

  return types
    .reduce((r, [type]) => {
      const async = /^Async/.test(type)

      return [r, options.fn({ type, async })].join('\n\n')
    }, '')
    .trim()
}
