import { readFile } from 'fs-extra'

export class LoadFile {
  filter = (fileContents: string) => fileContents as any
  filepath: string

  constructor(question: {
    filter?: (fileContents: string) => any
    filepath: string
  }) {
    this.filepath = question.filepath

    if (question.filter) {
      this.filter = question.filter
    }
  }

  async run() {
    try {
      const fileContents = await readFile(this.filepath, 'utf8')
      return this.filter(fileContents)
    } catch (error) {
      if (error.message.includes('ENOENT')) {
        return null
      } else {
        throw new Error(error.message)
      }
    }
  }
}
