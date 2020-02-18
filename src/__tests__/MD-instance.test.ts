import { readFileSync } from 'fs-extra'
import { join } from 'path'
import { totalElements } from './elements.stats'
import { EmptyMD, MD } from '../parser'

jest.spyOn(MD, 'create')
jest.spyOn(MD, 'match')

EmptyMD.warn = false
const elements = readFileSync(join(__dirname, 'elements.fixture.md'), 'utf8')

let md: MD
beforeEach(async () => {
  md = MD.parse(elements)
})

beforeEach(jest.clearAllMocks)

describe('MD instance methods', () => {
  it('constructs with correct defaults', () => {
    expect(md.children).toBeInstanceOf(Array)
    expect(md.node).toMatchObject({
      type: 'root',
      children: md.children,
    })
    expect(md.isEmpty).toBe(false)
  })

  it('stringifies a root node', () => {
    const nodes = md.children.slice(0, 2)
    const wrapper = MD.create(nodes)
    const expected =
      elements
        .split('\n')
        .slice(0, 3)
        .join('\n') + '\n'

    expect(md.stringify()).toBe(elements)
    expect(wrapper.stringify()).toBe(expected)
  })

  it('stringifies a non-root node', () => {
    const node = md.children.slice(0, 1)
    const wrapper = MD.create(node)
    const expected = '# ELEMENTS for Some Chrome Extension\n'

    expect(md.stringify()).toBe(elements)
    expect(wrapper.stringify()).toBe(expected)
  })

  it('gets the values of an instance', () => {
    const result = md.slice(0, 2).values()

    expect(result).toEqual([
      'ELEMENTS for Some Chrome Extension',
      '<!-- Describe the project here. -->',
    ])
  })
})

describe('MD#slice', () => {
  it('slices a root node', () => {
    const nodes = md.children.slice(0, 2)
    const expected = MD.create(nodes)

    const result = md.slice(0, 2)

    expect(result).not.toBe(expected)
    expect(result.children).toEqual(expected.children)
  })

  it('slices a non-root node', () => {
    const expected = MD.create(md.children[0])
    const result = md.slice(0, 1)

    expect(result).not.toBe(expected)
    expect(result.node).toBe(expected.node)
    expect(result.children).toEqual(expected.children)
  })
})

describe('MD#concat', () => {
  it('concats two root nodes', () => {
    const a = MD.create(md.children.slice(0, 2))
    const b = MD.create(md.children.slice(2, 4))
    const result = a.concat(b)
    const expected = MD.create(md.children.slice(0, 4))

    expect(result).not.toBe(expected)
    expect(result.children).toEqual(expected.children)
  })

  it('concats a single node and a root node', () => {
    const a = MD.create(md.children[0])
    const b = MD.create(md.children.slice(1, 4))
    const result = a.concat(b)
    const expected = MD.create(md.children.slice(0, 4))

    expect(result).not.toBe(expected)
    expect(result.children).toEqual(expected.children)
  })

  it('concats a root node and a single node', () => {
    const a = MD.create(md.children.slice(0, 2))
    const b = MD.create(md.children[2])
    const result = a.concat(b)
    const expected = MD.create(md.children.slice(0, 3))

    expect(result).not.toBe(expected)
    expect(result.children).toEqual(expected.children)
  })

  it('concats two single nodes', () => {
    const a = MD.create(md.children[0])
    const b = MD.create(md.children[1])
    const result = a.concat(b)
    const expected = MD.create(md.children.slice(0, 2))

    expect(result).not.toBe(expected)
    expect(result.children).toEqual(expected.children)
  })
})

describe('MD#eachMatch', () => {
  it('matches nodes that match', () => {
    const result = md.eachMatch({
      type: 'heading',
      depth: 2,
    })
    const values = result.values()

    expect(MD.match).toBeCalled()
    expect(result).toBeInstanceOf(MD)
    expect(result.children.length).toBe(4)
    expect(values).toContain('Background')
    expect(values).toContain('Scripts')
    expect(values).toContain('Storage')
    expect(values).toContain('Messages')
  })

  it('returns empty if no matches', () => {
    const result = md.eachMatch({
      test: 'test',
    })

    expect(result).toBeInstanceOf(EmptyMD)
  })

  it('returns self if empty', () => {
    const empty = MD.create()
    const result = empty.eachMatch('test')

    expect(result).toBe(empty)
  })
})

describe('MD#firstMatch', () => {
  it('matches first nodes that match', () => {
    const result = md.firstMatch({
      type: 'heading',
    })
    const values = result.values()

    expect(MD.match).toBeCalled()
    expect(result).toBeInstanceOf(MD)
    expect(result.children.length).toBe(1)
    expect(values).toContain('ELEMENTS for Some Chrome Extension')
  })

  it('returns empty if no matches', () => {
    const result = md.firstMatch({
      test: 'test',
    })

    expect(result).toBeInstanceOf(EmptyMD)
  })

  it('returns self if empty', () => {
    const empty = MD.create()
    const result = empty.firstMatch('test')

    expect(result).toBe(empty)
  })
})

describe('MD#afterMatch', () => {
  it('matches all nodes after first match', () => {
    const result = md.afterMatch({
      type: 'heading',
    })
    const values = result.values()

    expect(MD.match).toBeCalled()
    expect(result).toBeInstanceOf(MD)
    expect(result.children.length).toBe(totalElements - 1)
    expect(values).not.toContain('ELEMENTS for Some Chrome Extension')
  })

  it('returns empty if first match is last node', () => {
    const result = md.afterMatch(
      {
        type: 'code',
      },
      (node) => MD.values(node).some((x) => x.includes('Message1')),
    )

    expect(MD.match).toBeCalled()
    expect(result).toBeInstanceOf(EmptyMD)
    expect(result.children.length).toBe(0)
  })

  it('returns empty if no matches', () => {
    const result = md.afterMatch({
      test: 'test',
    })

    expect(result).toBeInstanceOf(EmptyMD)
  })

  it('returns self if empty', () => {
    const empty = MD.create()
    const result = empty.afterMatch('test')

    expect(result).toBe(empty)
  })
})

describe('MD#beforeMatch', () => {
  it('matches all nodes before first match', () => {
    const result = md.beforeMatch(
      {
        type: 'code',
      },
      (node) => MD.values(node)[0].includes('Background'),
    )
    const values = result.values()

    expect(MD.match).toBeCalled()
    expect(result.children.length).toBe(totalElements)
    expect(values).toContain('Messages')
    expect(values).not.toContain(expect.stringMatching(/Message2/))
  })

  it('matches all nodes before node', () => {
    const first = md.firstMatch('Background')
    const result = md.beforeMatch(first)
    const values = result.values()

    expect(result.children.length).toBe(2)

    expect(values.length).toBe(2)
    expect(values).toContain('ELEMENTS for Some Chrome Extension')
    expect(values).not.toContain('Messages')
  })

  it('returns empty if first match is first node', () => {
    const result = md.beforeMatch({
      type: 'heading',
    })

    expect(MD.match).toBeCalled()
    expect(result).toBeInstanceOf(EmptyMD)
    expect(result.children.length).toBe(0)
  })

  it('returns self if no matches', () => {
    const result = md.beforeMatch({
      test: 'test',
    })

    expect(result).toBe(md)
  })

  it('returns self if empty', () => {
    const empty = MD.create()
    const result = empty.beforeMatch('test')

    expect(result).toBe(empty)
  })
})
