import { NodePlopAPI } from 'plop'
import { createElementsMD } from './createElementsMD'
import { getActionsFromMD } from './getActionsFromMD'
import { MD } from './parser'
import { ELEMENTS } from './paths'
import { LoadFile } from './prompts/loadFile'
import { FullPlopGenerator, PlopMdGenerator } from './types'

function getGenerators(plop: NodePlopAPI) {
  return plop
    .getGeneratorList()
    .filter(({ name }) => name !== 'md')
    .sort((a, b) => {
      if (/storage/.test(b.name) || /messages/.test(b.name)) {
        return -1
      } else {
        return 1
      }
    })
}

// eslint-disable-next-line
// @ts-ignore
export const md: PlopMdGenerator = (plop) => {
  // eslint-disable-next-line no-extra-semi
  ;(plop as any).inquirer.registerPrompt('loadFile', LoadFile)

  return {
    description: 'Generate files from a project outline',
    prompts: [
      {
        type: 'loadFile',
        name: 'md',
        filepath: ELEMENTS,
        filter(fileContents: string) {
          return MD.parse(fileContents)
        },
      },
      // TODO: fill out package.json here
    ],
    actions({ md }: { md: MD | null }) {
      const generators = getGenerators(plop)

      if (md) {
        return getActionsFromMD(
          md,
          generators.map(
            ({ name }): FullPlopGenerator => ({
              name,
              ...plop.getGenerator(name),
            }),
          ),
          { md },
        )
      } else {
        return createElementsMD(generators)
      }
    },
  }
}
