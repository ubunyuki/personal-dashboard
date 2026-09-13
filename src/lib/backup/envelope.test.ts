import { describe, expect, it } from 'vitest'
import { SCHEMA_VERSION, type PersistedAppData } from '../../types'
import { defaultSettings } from '../../store/migrations'
import { applyEnvelope, buildEnvelope, summarizeEnvelope, validateEnvelope } from './envelope'

const A = '2026-09-14T08:00:00.000Z'

function sampleAppData(): PersistedAppData {
  return {
    tasks: [
      {
        id: 't1',
        title: 'Ship report',
        description: 'with charts',
        status: 'todo',
        priority: 'high',
        dueDate: '2026-09-18',
        createdAt: A,
        updatedAt: A,
      },
    ],
    notes: [{ id: 'n1', text: 'hello\nworld', createdAt: A, updatedAt: A }],
    events: [],
    boards: [{ id: 'b1', name: 'Sketch', createdAt: A, updatedAt: A }],
    settings: defaultSettings(),
    lastChangeAt: A,
  }
}

const sampleBoards = () => [
  {
    id: 'b1',
    name: 'Sketch',
    scene: {
      elements: [{ type: 'rectangle', x: 1 }],
      appState: { zoom: { value: 1 } },
      files: {},
    },
  },
]

describe('envelope round-trip', () => {
  it('build → stringify → parse → validate → apply preserves the data', () => {
    const env = buildEnvelope(sampleAppData(), sampleBoards())
    const revived = validateEnvelope(JSON.parse(JSON.stringify(env)))
    const { appData, boards } = applyEnvelope(revived)
    expect(appData).toEqual(sampleAppData())
    expect(boards).toEqual(sampleBoards())
    expect(revived.version).toBe(SCHEMA_VERSION)
  })

  it('summarizes counts', () => {
    const env = buildEnvelope(sampleAppData(), sampleBoards())
    expect(summarizeEnvelope(env)).toMatchObject({ tasks: 1, notes: 1, events: 0, boards: 1 })
  })
})

describe('validateEnvelope rejections', () => {
  it('rejects non-objects', () => {
    expect(() => validateEnvelope('nope')).toThrow(/JSON object/)
    expect(() => validateEnvelope([1, 2])).toThrow(/JSON object/)
  })

  it('rejects a missing version', () => {
    expect(() => validateEnvelope({ appData: sampleAppData() })).toThrow(/schema version/i)
  })

  it('refuses versions newer than the app', () => {
    const env = buildEnvelope(sampleAppData(), [])
    expect(() => validateEnvelope({ ...env, version: SCHEMA_VERSION + 1 })).toThrow(
      /Update the app/,
    )
  })

  it('rejects non-array tasks', () => {
    const env = JSON.parse(JSON.stringify(buildEnvelope(sampleAppData(), [])))
    env.appData.tasks = 'oops'
    expect(() => validateEnvelope(env)).toThrow(/appData\.tasks/)
  })

  it('rejects malformed board scenes', () => {
    const env = JSON.parse(JSON.stringify(buildEnvelope(sampleAppData(), sampleBoards())))
    env.boards[0].scene = { appState: {} }
    expect(() => validateEnvelope(env)).toThrow(/malformed scene/)
  })
})

describe('applyEnvelope migration path', () => {
  it('fills defaults for fields missing from older/partial data', () => {
    const env = validateEnvelope({
      version: 1,
      exportedAt: A,
      appData: { tasks: [], notes: [], events: [], boards: [] },
      boards: [],
    })
    const { appData } = applyEnvelope(env)
    expect(appData.settings).toEqual(defaultSettings())
    expect(appData.lastChangeAt).toBeNull()
  })
})
