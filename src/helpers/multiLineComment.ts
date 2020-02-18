import importCwd from 'import-cwd'
import { Options as PrettierOptions, format } from 'prettier'

const { printWidth = 65 } = (importCwd.silent('./.prettierrc.yaml') ||
  {}) as PrettierOptions

const header = '/**'
const leader = ' * '
const footer = ' */'
const eolRegEx = /[\n\r]+/g
const eol = '\n'

export const multiLineComment = (comment: string) => {
  if (!comment.trim().length) return ''

  const formatted = format(comment, {
    parser: 'markdown',
    proseWrap: 'always',
    printWidth,
  })

  const lines = formatted
    .trim()
    .split(eolRegEx)
    .map((line) => leader + line)

  return [header, ...lines, footer].join(eol)
}
