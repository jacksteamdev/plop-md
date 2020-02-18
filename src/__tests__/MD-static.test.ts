import { readFileSync } from 'fs-extra'
import { join } from 'path'
import { EmptyMD, MD, RemarkNode } from '../parser'
import { totalElements } from './elements.stats'

jest.spyOn(MD, 'create')
jest.spyOn(MD, 'match')

EmptyMD.warn = false
const elements = readFileSync(join(__dirname, 'elements.fixture.md'), 'utf8')

let md: MD
beforeEach(async () => {
  md = MD.parse(elements)
})

beforeEach(jest.clearAllMocks)

describe('static methods', () => {
  it('parses correctly', () => {
    expect(md.children.length).toBe(totalElements)
  })

  it('creates from an array of nodes', () => {
    const wrapped = MD.create(md.children.slice(0, 5))

    expect(wrapped).toBeInstanceOf(MD)
    expect(wrapped).not.toBeInstanceOf(EmptyMD)
    expect(wrapped.children.length).toBe(5)
  })

  it('creates an EmptyMD from an empty array', () => {
    const empty = MD.create([])

    expect(empty).toBeInstanceOf(EmptyMD)
  })

  it('creates an EmptyMD from no args', () => {
    expect(MD.create()).toBeInstanceOf(EmptyMD)
  })

  it('returns an array of values', () => {
    expect(MD.values(md.children[0])).toEqual(['ELEMENTS for Some Chrome Extension'])
  })
})

describe('MD.matchNode', () => {
  it('matches text values', () => {
    const matchers = ['ELEMENTS for Some Chrome Extension']
    const result = MD.match(matchers)(md.children[0])

    expect(result).toBe(true)
  })

  it('does not match missing text values', () => {
    const matchers = ['hyperbole']
    const result = MD.match(matchers)(md.children[0])

    expect(result).toBe(false)
  })

  it('matches heading nodes', () => {
    const matchers = [{ type: 'heading' }]
    const result = MD.match(matchers)(md.children[0])

    expect(result).toBe(true)
  })

  it('does not match other nodes', () => {
    const matchers = [{ type: 'heading' }]
    const result = MD.match(matchers)(md.children[1])

    expect(result).toBe(false)
  })

  it('matches predicate result', () => {
    const node = md.children[1]
    const matchers = [({ type }: RemarkNode) => type === 'heading']
    const result = MD.match(matchers)(node)

    expect(matchers[0](node)).toBe(false)
    expect(result).toBe(false)
  })

  it('returns true if all match', () => {
    const node = md.children[0]
    const matchers = [
      'ELEMENTS for Some Chrome Extension',
      { type: 'heading' },
      jest.fn(({ type }: RemarkNode) => type === 'heading'),
    ]
    const result = MD.match(matchers)(node)

    expect(result).toBe(true)
    expect(matchers[2]).toBeCalled()
  })

  it('returns false if one does not match', () => {
    const node = md.children[0]
    const matchers = [
      'something else',
      { type: 'heading' },
      jest.fn(({ type }: RemarkNode) => type === 'heading'),
    ]
    const result = MD.match(matchers)(node)

    expect(result).toBe(false)
    expect(matchers[2]).not.toBeCalled()
  })

  it('matches a node to itself', () => {
    const node = md.children[0]
    const matchers = [node]
    const result = MD.match(matchers)(node)

    expect(result).toBe(true)
  })
})
