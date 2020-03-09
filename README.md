# `@bumble/plop-md`

Use a markdown file to tell PlopJS how to setup your project. Plop dozens of
files at once.

## Syntax

PlopMD first creates an `ELEMENTS.md` file using the available generators. You
then fill out the elements file with comments, code blocks, and lists. Then run
`plop md` again to generate the files for a that project.

### Headings

The elements file sections are defined by Headings. Each level has a different
meaning.

- H1: Section titles. These headings are for organization, and are ignored by
  the parser.
- H2: Generator names. Each H2 should correspond to an available Plop generator.
- H3: File names. The text content under an H3 will become the value of
  `filename` in the Plop generator. Code blocks, lists, and regular paragraphs
  are supported.

### Other elements

- Code blocks, lists and plain text content at the generator level are added to
  the top of each file in order.
- Code blocks, lists and plain text content at the file level are inserted after
  generator level content, and in order of appearance.
- Lists and plain text are inserted as multiline comment blocks.
- Code blocks are inserted as inline code.
  <!-- TODO: parse data blocks - Custom template variables can be defined at the generator or file level inside
    code blocks with `plop` as the language. `plop` blocks should be either YAML
    or JSON format. Multiple `plop` blocks in one file are assigned using
    `Object.assign` from the top down, with subsequent values overwriting previous
    values. -->

### Invalid syntax

- If a generator (## heading) does not match an available generator, the
  operation will throw.
- If a generator does not match a section, that generator is ignored.
- If a generator section has no files but has some content, it is parsed as a
  file with the generator name.
- If a file (### heading) is not under a generator section, the operation will
  throw.
- Any content not under a generator (## heading) is ignored.
  <!-- TODO: support prompts - If a generator requires specific values, it should include prompts. -->

<!-- TODO: add project init -->
<!-- This generator initializes the project, first checking the `package.json` file
for name, version, and description, then prompting and updating it if those
fields are missing. -->

### Example `ELEMENTS.md` file

A PlopMD elements file looks something like this:

```md
# ELEMENTS for Sample Project

## Generator

<!-- Add comments and code blocks for each generator file here. -->

### `example file name`

<!-- Add comments and code blocks for this file here. -->
```
