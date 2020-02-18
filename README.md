# `@bumble/plop-md`

Use a markdown file to tell PlopJS how to setup your project. Plop dozens of files at once.

```typescript
/**
 * Data provided by plop-md
 */
export interface PlopMdData {
  /** Name of the generator, or H2 */
  generator: string
  /** Name of file, or H3 */
  filename: string
  /** Section as MD instance */
  md: MD
}
```