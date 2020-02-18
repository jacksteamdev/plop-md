import { readFileSync } from 'fs-extra'
import { join } from 'path'
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

describe('MD#section', () => {
  it('returns self if first node matches', () => {
    const result = md.section('ELEMENTS for Some Chrome Extension')

    expect(result).toStrictEqual(md)
  })

  it('returns title and content of section 1', () => {
    const section = md.section('Manifest')

    expect(section.children.length).toBe(2)
  })

  it('returns title and content of section 2', () => {
    const result = md.section('Scripts')

    expect(result.children.length).toBe(7)
    expect(result.values()).toEqual([
      'Scripts',
      'Background',
      expect.stringMatching(/^Describe/),
      'Content Script 1',
      expect.stringMatching(/^Describe/),
      'Content Script 2',
      expect.stringMatching(/^Describe/),
    ])
  })

  it('returns title and content of sub section', () => {
    const result = md.section('Content Script 1')

    expect(result.children.length).toBe(2)
  })

  it('returns title and content of nested section 1', () => {
    const result = md.section('ELEMENTS for Some Chrome Extension', 'Pages')

    expect(result.children.length).toBe(3)
    expect(result.values()).toEqual([
      'Pages',
      'Options',
      expect.stringMatching(/^Describe/),
    ])
  })

  it('returns title and content of nested section 2', () => {
    const result = md.section('Units', 'Use API')

    expect(result.children.length).toBe(3)
  })

  it('returns title and content of nested section 3', () => {
    const result = md.section('Chrome APIs', 'Storage')

    expect(result.children.length).toBe(2)
    expect(result.values()).toEqual([
      'Storage',
      expect.stringMatching(/^interface Store/),
    ])
  })

  it('returns empty if no matches', () => {
    const result = md.section('test')

    expect(result).toBeInstanceOf(EmptyMD)
  })

  it('returns self if empty', () => {
    const empty = MD.create()
    const result = empty.section('test')

    expect(result).toBe(empty)
  })
})

describe.only('MD#subSections', () => {
  it('should exclude main title and intro paragraph', () => {
    const result = md.subSections('ELEMENTS for Some Chrome Extension')

    expect(result.length).toBe(4)
  })

  it('should include scripts only', () => {
    const result = md.subSections('Scripts')

    expect(result.length).toBe(3)
  })

  it('should include storage only', () => {
    const result = md.subSections('Storage')

    expect(result.length).toBe(1)
  })

  it('returns empty if no sub sections', () => {
    const result = md.subSections('Options')

    expect(result).toEqual([])
  })

  it('returns empty if no matches', () => {
    const result = md.subSections('test')

    expect(result).toEqual([])
  })

  it('returns array of self if empty', () => {
    const result = MD.create().subSections('test')

    expect(result).toEqual([])
  })
})
