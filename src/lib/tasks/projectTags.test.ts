import { describe, expect, it } from 'vitest'
import type { Task } from '../../types'
import {
  allProjectTags,
  formatProjectTags,
  normalizeProjectTags,
  parseProjectTags,
  projectsOf,
} from './projectTags'

const NOW = '2026-09-15T08:00:00.000Z'
let n = 0
function task(projects?: string[]): Task {
  n++
  return {
    id: `t${n}`,
    title: `Task ${n}`,
    description: '',
    status: 'todo',
    priority: 'medium',
    projects,
    createdAt: NOW,
    updatedAt: NOW,
  }
}

describe('parseProjectTags', () => {
  it('splits on commas and trims', () => {
    expect(parseProjectTags('site, report ,  ops')).toEqual(['site', 'report', 'ops'])
  })

  it('drops empty segments from stray commas', () => {
    expect(parseProjectTags(', site,, ,report,')).toEqual(['site', 'report'])
  })

  it('dedupes case-insensitively, keeping the first spelling', () => {
    expect(parseProjectTags('Site, site, SITE')).toEqual(['Site'])
  })

  it('returns undefined for nothing usable, so untagged tasks store nothing', () => {
    expect(parseProjectTags('')).toBeUndefined()
    expect(parseProjectTags('   ,  , ')).toBeUndefined()
  })

  it('keeps a single tag working exactly as the old single field did', () => {
    expect(parseProjectTags('  website-revamp  ')).toEqual(['website-revamp'])
  })

  it('round-trips through formatProjectTags', () => {
    const tags = parseProjectTags('site, report')
    expect(parseProjectTags(formatProjectTags(tags))).toEqual(tags)
  })
})

describe('normalizeProjectTags', () => {
  it('cleans a list the same way it cleans a field', () => {
    expect(normalizeProjectTags([' site ', 'SITE', '', 'report'])).toEqual(['site', 'report'])
  })

  it('ignores non-strings from hand-edited data', () => {
    expect(normalizeProjectTags(['site', 7, null, undefined, {}])).toEqual(['site'])
  })
})

describe('projectsOf', () => {
  it('is empty for a task that never had tags', () => {
    expect(projectsOf(task())).toEqual([])
    expect(projectsOf({ projects: undefined })).toEqual([])
  })

  it('trims and drops junk rather than trusting stored data', () => {
    expect(projectsOf({ projects: [' site ', '', '  '] as string[] })).toEqual(['site'])
    expect(projectsOf({ projects: 'site' as unknown as string[] })).toEqual([])
  })
})

describe('allProjectTags', () => {
  it('is the sorted union across every task', () => {
    expect(allProjectTags([task(['ops', 'site']), task(['site']), task()])).toEqual([
      'ops',
      'site',
    ])
  })
})
