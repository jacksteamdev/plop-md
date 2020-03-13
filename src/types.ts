import { ActionType, NodePlopAPI, PlopGenerator } from 'plop'
import { MD } from './parser'

/**
 * Data provided by plop-md
 */
export interface PlopMdData {
  /** Full ELEMENTS.md as MD instance */
  md: MD
  /** Name of file, or H3 */
  filename: string
  /** Section as MD instance */
  section: MD
}

export type PlopMdGenerator = (plop: NodePlopAPI) => PlopGenerator
export type FullPlopGenerator = PlopGenerator & { name: string }
export type PlopMdAction = ActionType<PlopMdData>
