import startCase from 'lodash/startCase'
import { ActionConfig, ActionType, NodePlopAPI } from 'plop'
import { MD } from './parser'
import { FullPlopGenerator, PlopMdData } from './types'

export function getActionsFromMD(
  elements: MD,
  generators: FullPlopGenerator[],
  data: any,
): ActionType<PlopMdData>[] {
  return (
    generators
      .flatMap(matchGeneratorsToSections)
      // Remove unused generators
      .filter((x) => x)
  )

  function matchGeneratorsToSections({ name, actions }: FullPlopGenerator) {
    // Generator name
    const title = startCase(name)
    // Files under generator name
    const fileSections = elements.subSections(title)

    if (fileSections.length) {
      // For each named file
      return fileSections.flatMap(handleFile)
    } else {
      // No files under generator
      // Only one file named for the generator
      return handleFile(elements.section(title))
    }

    function handleFile(fileSection: MD) {
      // File section is empty
      if (fileSection.isEmpty) return

      const filename = fileSection.heading()

      const _data: Pick<PlopMdData, 'section' | 'filename'> = {
        section: fileSection,
        filename,
      }

      // Handle dynamic action function
      if (typeof actions === 'function') {
        const result = actions({ ...data, ..._data })
        return result.map(addDataToAction(_data))
      } else {
        return actions.map(addDataToAction(_data))
      }
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
