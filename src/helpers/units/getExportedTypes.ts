import { Project } from 'ts-morph'

const project = new Project({
  tsConfigFilePath: require.resolve('../tsconfig.json'),
  addFilesFromTsConfig: false,
})

/**
 * Parse TS and get an array of [typeName, splitSrcCode] tuples.
 * The src code is split after each exported type and the exported type name is extracted,
 * The first element in the tuple is the exported type name,
 * and the second element is the split source code.
 *
 * @export
 * @param {string} src TypeScript code
 * @returns {[string, string]} [typeName, splitSrcCode]
 */
export function getExportedTypes(src: string): [string, string][] {
  const sourceFile = project.createSourceFile('types.ts', src)
  const { types } = [
    ...sourceFile.getInterfaces(),
    ...sourceFile.getTypeAliases(),
  ]
    .sort((a, b) => a.getPos() - b.getPos())
    .filter((t) => t.isExported())
    .reduce(
      ({ pos, types }, t) => {
        const end = t.getEnd()
        const type = [t.getName(), src.slice(pos, end).trim()] as [
          string,
          string,
        ]

        return { pos: end, types: [...types, type] }
      },
      { pos: 0, types: [] as ReturnType<typeof getExportedTypes> },
    )

  return types
}
