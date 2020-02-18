import isMatch from 'lodash/isMatch'
import r from 'remark'
import { Node } from 'unist'

export interface RemarkPosition {
  line: number
  column: number
  offset: number
}

export interface RemarkNode extends Node {
  children: RemarkNode[]
  depth?: number
  value?: string
  position?: {
    start: RemarkPosition
    end: RemarkPosition
    indent: number[]
  }
  lang?: string
}

export type NodeMatcher =
  | ((node: RemarkNode) => boolean)
  | Partial<RemarkNode>
  | MD
  | string

export interface Heading extends RemarkNode {
  type: 'heading'
  depth: number
}

export interface Paragraph extends RemarkNode {
  type: 'paragraph'
  value: string
}

export interface Code extends RemarkNode {
  type: 'code'
  lang: string
  value: string
}

export interface List extends RemarkNode {
  type: 'list'
}

export interface ListItem extends RemarkNode {
  type: 'ListItem'
}

export type Content = Paragraph | Code | ListItem

const remark = r().use({
  settings: {
    listItemIndent: '1',
  },
})

function isString(x: any): x is string {
  return typeof x === 'string'
}

export class MD {
  /* ---------------------- STATIC METHODS --------------------- */

  static parse(text: string) {
    const node = remark.parse(text) as RemarkNode
    return new MD(node)
  }

  static create(
    node?: RemarkNode | RemarkNode[],
    ...rest: (RemarkNode | RemarkNode[])[]
  ) {
    const nodes: RemarkNode[] = [node, ...rest]
      .flat()
      .filter((x) => typeof x !== 'undefined')

    switch (nodes.length) {
      case 0:
        return new EmptyMD()
      case 1:
        return new MD(nodes[0])

      default:
        return new MD({ type: 'root', children: nodes })
    }
  }

  /* ---------------------- INSTANCE TYPES --------------------- */

  children: RemarkNode[]
  node: RemarkNode
  isEmpty: boolean

  /* --------------------- INSTANCE METHODS -------------------- */

  constructor(node: RemarkNode) {
    const { children = [] } = node

    this.node = node
    this.children = children
    this.isEmpty = false
  }

  stringify() {
    if (this.node.type !== 'root') {
      return remark.stringify({ type: 'root', children: [this.node] })
    } else {
      return remark.stringify(this.node)
    }
  }

  concat(b: MD | EmptyMD): MD | EmptyMD {
    const nodes = getNodes(this).concat(getNodes(b))

    return MD.create(nodes)

    function getNodes(x: MD) {
      return x.node.type === 'root' ? x.children : [x.node]
    }
  }

  slice(start?: number, end?: number): MD | EmptyMD {
    return MD.create(this.children.slice(start, end))
  }

  values(): string[] {
    if (this.isEmpty) return []

    return typeof this.node.value !== 'undefined'
      ? [this.node.value]
      : this.children.flatMap(MD.values)
  }

  /* ------------------------- MATCHERS ------------------------ */

  static match(matchers: NodeMatcher[]) {
    return (node: RemarkNode) => {
      return matchers.every((matcher) => {
        if (matcher instanceof MD) {
          return (
            matcher.node === node || matcher.children.some((m) => node === m)
          )
        }

        switch (typeof matcher) {
          case 'function':
            return matcher(node)
          case 'object': {
            return isMatch(node, matcher)
          }
          case 'string': {
            const values = MD.values(node).map((x) => x.toLowerCase())
            return values.includes(matcher.toLowerCase())
          }
          default:
            throw new TypeError(`Unexpected matcher type: ${typeof matcher}`)
        }
      })
    }
  }

  eachMatch(...matchers: NodeMatcher[]): MD | EmptyMD {
    if (this.isEmpty) return this

    const matches = this.children.filter(MD.match(matchers))

    return MD.create(matches)
  }

  firstMatch(...matchers: NodeMatcher[]): MD | EmptyMD {
    if (this.isEmpty) return this

    const match = this.children.find(MD.match(matchers))

    return MD.create(match)
  }

  /** Non-inclusive */
  beforeMatch(...matchers: NodeMatcher[]): MD | EmptyMD {
    if (this.isEmpty) return this

    const index = this.children.findIndex(MD.match(matchers))

    if (index >= 0) {
      // match was found, return everything before
      return MD.create(this.children.slice(0, index))
    } else {
      // no match found, so EVERYTHING is before the match
      return this
    }
  }

  /** Non-inclusive */
  afterMatch(...matchers: NodeMatcher[]): MD | EmptyMD {
    if (this.isEmpty) return this

    const index = this.children.findIndex(MD.match(matchers))

    if (index >= 0) {
      // match was found, return everything after
      return MD.create(this.children.slice(index + 1))
    } else {
      // no match found, so NOTHING is after the match
      return MD.create()
    }
  }

  /* --------------------- SECTION MATCHERS -------------------- */

  section(...names: string[]): MD | EmptyMD {
    if (this.isEmpty) return this

    const heading: MD | EmptyMD = names.reduce((r, name, i) => {
      const matcher = { type: 'heading' }

      if (i === names.length - 1) {
        // is last name in path
        return r.firstMatch(matcher, name)
      } else {
        // is intermediate path name
        return r.afterMatch(matcher, name)
      }
    }, this.slice())

    if (heading.isEmpty) {
      return MD.create()
    }

    const after = this.afterMatch(heading)
    const content = after.beforeMatch(({ type, depth }) => {
      // match first heading OUTSIDE section
      return type === 'heading' && depth! <= heading.node.depth!
    })

    return heading.concat(content)
  }

  subSections(...names: string[]): (MD | EmptyMD)[] {
    if (this.isEmpty) return []

    const section = this.section(...names)
    const heading = section.slice(0, 1)

    const subheadings = section
      .slice(1)
      .eachMatch({ depth: heading.node.depth! + 1 })

    const result = subheadings
      .values()
      .map((name) => this.section(...names, name))

    return result
  }

  /* -------------------------- VALUES ------------------------- */

  static values({ value, children }: RemarkNode): string[] {
    return value ? [value] : children?.flatMap(MD.values).filter(isString)
  }

  heading(): string {
    const match = this.firstMatch({ type: 'heading' })
    return match.values().join('\n')
  }

  content(): MD {
    return this.eachMatch(({ type }) => {
      return ['paragraph', 'code', 'list'].includes(type)
    })
  }

  paragraphs(): MD {
    return this.eachMatch({ type: 'paragraph' })
  }

  code(...languages: string[]): MD {
    if (languages.length) {
      return this.eachMatch(
        (node) =>
          node.type === 'code' && !!node.lang && languages.includes(node.lang),
      )
    } else {
      return this.eachMatch({ type: 'code' })
    }
  }

  lists(): MD {
    return this.eachMatch({ type: 'list' })
  }

  /**
   * Get all the list items in a section as a single list
   *
   * @returns {MD}
   * @memberof MD
   */
  listItems(): MD {
    const listItems = this.eachMatch({ type: 'listItem' })

    return MD.create({
      type: 'list',
      children: listItems.children,
    })
  }
}

export class EmptyMD extends MD {
  static warn = false

  constructor() {
    super({ type: 'root', children: [] })

    this.isEmpty = true

    EmptyMD.warn && console.warn('created EmptyMD')
  }
}

/* ------------------------ PLAYGROUND ----------------------- */
