/**
 * The palette's command registry — pure data, no store imports, so
 * searchAll stays node-testable. Icons live in the palette component
 * (a UI concern); execution lives in runResultAction (searchAll.ts).
 */
export type CommandId =
  | 'new-task'
  | 'new-note'
  | 'go-dashboard'
  | 'go-tasks'
  | 'go-notes'
  | 'go-bookmarks'
  | 'open-calendar'
  | 'open-whiteboard'
  | 'open-settings'
  | 'open-help'

export interface CommandDef {
  id: CommandId
  label: string
  /** Space-joined synonyms the matcher may hit when the label misses. */
  keywords: string
}

export const COMMANDS: CommandDef[] = [
  { id: 'new-task', label: 'New task', keywords: 'add create todo t' },
  { id: 'new-note', label: 'New note', keywords: 'add capture jot n' },
  { id: 'go-dashboard', label: 'Go to Dashboard', keywords: 'home overview' },
  { id: 'go-tasks', label: 'Go to Tasks', keywords: 'list board' },
  { id: 'go-notes', label: 'Go to Notes', keywords: 'jottings' },
  { id: 'go-bookmarks', label: 'Go to Bookmarks', keywords: 'links b' },
  { id: 'open-calendar', label: 'Open calendar', keywords: 'month events schedule' },
  { id: 'open-whiteboard', label: 'Open whiteboard', keywords: 'excalidraw draw sketch board' },
  { id: 'open-settings', label: 'Open Settings', keywords: 'preferences backups weather theme' },
  { id: 'open-help', label: 'Open help', keywords: 'guide shortcuts manual ?' },
]
