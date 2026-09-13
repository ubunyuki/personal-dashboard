import { describe, expect, it } from 'vitest'
import { splitNoteForTask } from './splitNoteForTask'

describe('splitNoteForTask', () => {
  it('splits first line into title, rest into description', () => {
    expect(splitNoteForTask('Call vendor\nAsk about licence count\nCC the manager')).toEqual({
      title: 'Call vendor',
      description: 'Ask about licence count\nCC the manager',
    })
  })

  it('returns empty description for a single-line note', () => {
    expect(splitNoteForTask('Book meeting room')).toEqual({
      title: 'Book meeting room',
      description: '',
    })
  })

  it('trims surrounding blank lines and whitespace', () => {
    expect(splitNoteForTask('\n\n  Weekly report  \n\ndraft by Thursday\n\n')).toEqual({
      title: 'Weekly report',
      description: 'draft by Thursday',
    })
  })

  it('keeps internal blank lines inside the description', () => {
    expect(splitNoteForTask('Title\npara one\n\npara two')).toEqual({
      title: 'Title',
      description: 'para one\n\npara two',
    })
  })

  it('handles empty input', () => {
    expect(splitNoteForTask('   \n  ')).toEqual({ title: '', description: '' })
  })
})
