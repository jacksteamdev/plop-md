import { readFile } from 'fs-extra'
import importCwd from 'import-cwd'
import startCase from 'lodash/startCase'
import { join } from 'path'
import {
  ActionConfig,
  AddActionConfig,
  NodePlopAPI,
  PlopGenerator,
  ActionType,
  CustomActionFunction,
} from 'plop'
import { MD } from './parser'
import { PlopMdData, PlopMdGenerator } from './types'

const success = 'Loaded ELEMENTS.md'
const failure = 'Could not load ELEMENTS.md'

const packageJson = importCwd('./package.json') as {
  name: string
  version: string
  description: string
}

const paths = {
  PLOP: join(process.cwd(), '.plop'),
  ELEMENTS: join(process.cwd(), 'ELEMENTS.md'),
}

function getGenerators(plop: NodePlopAPI) {
  return plop!
    .getGeneratorList()
    .map(
      ({ name }) => [name, plop!.getGenerator(name)] as [string, PlopGenerator],
    )
}

function getElementsMD() {
  return readFile(paths.ELEMENTS, 'utf8').then(MD.parse)
}

export const md: PlopMdGenerator = {
  description: 'Generate files from a project outline',
  prompts: [],
  actions: [
    async (answers: any, config: any, plop: NodePlopAPI) => {
      const generators = getGenerators(plop!).filter(([key]) => key !== 'md')

      try {
        const elements = await getElementsMD()
        generators.forEach(handleElementsMD(elements))
      } catch (error) {
        if (error.message?.startsWith('ENOENT')) {
          return createElementsMD(generators.map(([k]) => k))
        } else {
          throw error
        }
      }

      if (md.actions.length > 1) {
        return success
      } else {
        throw new Error(failure)
      }
    },
  ],
}

function createElementsMD(generators: string[]) {
  md.actions.push({
    type: 'add',
    path: paths.ELEMENTS,
    templateFile: '.plop/templates/ELEMENTS.md.hbs',
    data: { generators, packageJson },
  } as AddActionConfig)

  return 'Creating ELEMENTS.md'
}

function handleElementsMD(elements: MD) {
  return ([key, generator]: [string, PlopGenerator]) => {
    const title = startCase(key)
    const subSections = elements.subSections(title)

    
    if (subSections.length) {
      // For sub sections like units
      subSections.forEach(handleSection)
    } else {
      // For sections without sub sections
      handleSection(elements.section(title))
    }
    
    function handleSection(section: MD) {
      if (section.isEmpty) return
      
      const filename = section.heading()

      
      const sections = elements
      .eachMatch({ type: 'heading', depth: 2 })
        .values()

        const data: PlopMdData = {
        md: section,
        filename,
        sections,
        // TODO: Get data from json/yaml code blocks
        // data: section.data()
      }
      
      const actions = generator.actions
      if (typeof actions === 'function') {
        // No longer a DynamicActionsFunction, just a CustomActionFunction
        md.actions.push(async () => {
          const result = await (actions as Function)(data)
          
          addActions(result)
          
          return announceSection()
        })
      } else {
        md.actions.push(announceSection)

        addActions(actions)
      }

      function announceSection() {
        return `Starting ${key} actions for ${filename}`
      }

      function addActions(
        actions: (ActionType<object> | CustomActionFunction)[],
      ) {
        md.actions.push(
          ...actions.map(
            // Add data property to each action
            (action: any) => {
              if (typeof action === 'function') {
                return async (_data: any, options: any, plop: NodePlopAPI) => {
                  const result = await action(
                    mergeData(_data, data),
                    options,
                    plop,
                  )

                  return result
                }
              } else {
                const result = {
                  ...action,
                  data: mergeData(action.data, data),
                } as any

                return result
              }
            },
          ),
        )
      }
    }
  }
}

function mergeData(actionData: ActionConfig<object>['data'], data: PlopMdData) {
  if (typeof actionData === 'function') {
    const _data = { ...data }
    return async () => {
      const result = { ..._data, ...(await actionData()) }
      return result
    }
  } else {
    const result = { ...data, ...actionData }
    return result
  }
}
