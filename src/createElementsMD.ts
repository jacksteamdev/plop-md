import importCwd from 'import-cwd'
import { NodePlopAPI } from 'plop'
import * as paths from './paths'

const packageJson = importCwd('./package.json') as {
  name: string
  version: string
  description: string
}

export function createElementsMD(
  generators: ReturnType<NodePlopAPI['getGeneratorList']>,
) {
  return [
    {
      type: 'add',
      path: paths.ELEMENTS,
      templateFile: '.plop/templates/ELEMENTS.md.hbs',
      data: { generators, packageJson },
    },
  ]
}
