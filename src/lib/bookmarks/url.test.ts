import { describe, expect, it } from 'vitest'
import { domainOf, normalizeUrl } from './url'

describe('normalizeUrl', () => {
  it('prefixes https:// when no scheme is present', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com')
    expect(normalizeUrl('  example.com/path?q=1 ')).toBe('https://example.com/path?q=1')
  })

  it('leaves existing schemes alone', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com')
    expect(normalizeUrl('https://example.com/a')).toBe('https://example.com/a')
  })

  it('returns an empty string for blank input', () => {
    expect(normalizeUrl('')).toBe('')
    expect(normalizeUrl('   ')).toBe('')
  })
})

describe('domainOf', () => {
  it('extracts the hostname', () => {
    expect(domainOf('https://sub.example.com/a/b?q=1')).toBe('sub.example.com')
  })

  it('returns null for unparsable urls', () => {
    expect(domainOf('not a url')).toBeNull()
    expect(domainOf('')).toBeNull()
  })
})
