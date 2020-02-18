import { PlopGenerator } from 'plop'
import { MD } from './parser'

/**
 * Data provided by plop-md
 */
export interface PlopMdData {
  /** Name of file, or H3 */
  filename: string
  /** Section as MD instance */
  md: MD
  /** Does this project use React? */
  sections: string[]
}

export interface PlopMdGenerator extends PlopGenerator {
  actions: any[]
}
