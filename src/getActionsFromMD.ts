import startCase from 'lodash/startCase'
import { ActionConfig, ActionType, NodePlopAPI } from 'plop'
import { MD } from './parser'
import { FullPlopGenerator, PlopMdData } from './types'

export function getActionsFromMD(
  elements: MD,
  generators: FullPlopGenerator[],
): ActionType<PlopMdData>[] {
  return (
    generators
      .flatMap(matchGeneratorsToActions)
      // Remove undefined sections
      .filter((x) => x)
  )

  function matchGeneratorsToActions({ name, actions }: FullPlopGenerator) {
    const title = startCase(name)
    const subSections = elements.subSections(title)

    if (subSections.length) {
      // For sub sections like units
      return subSections.map(handleSection)
    } else {
      // For sections without sub sections
      return handleSection(elements.section(title))
    }

    function handleSection(section: MD) {
      if (typeof actions === 'function') {
        throw new TypeError(
          '[plop-md] Dynamic action functions are not supported',
        )
      }
      if (section.isEmpty) return

      const filename = section.heading()
      const sections = elements
        .eachMatch({ type: 'heading', depth: 2 })
        .values()

      const data: Pick<PlopMdData, 'section' | 'filename' | 'sections'> = {
        section,
        filename,
        sections,
      }

      return actions.map(addDataToAction(data))
    }
  }
}

function addDataToAction(data: any) {
  return (action: any) => {
    if (typeof action === 'function') {
      return async (_data: any, options: any, plop: NodePlopAPI) => {
        const result = await action(mergeData(_data, data), options, plop)
        return result
      }
    } else {
      const result = {
        ...action,
        data: mergeData(action.data, data),
      } as any
      return result
    }
  }
}

function mergeData(
  actionData: ActionConfig<object>['data'],
  data: Partial<PlopMdData>,
) {
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
