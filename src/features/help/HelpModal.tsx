import type { ReactNode } from 'react'
import {
  Bookmark,
  CalendarCheck,
  CalendarDays,
  CloudSun,
  Keyboard,
  ListTodo,
  Presentation,
  Save,
  StickyNote,
} from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { useUiStore } from '../../store/uiStore'

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] dark:border-slate-600 dark:bg-slate-800">
      {children}
    </kbd>
  )
}

function HelpCard({
  icon: Icon,
  title,
  className = '',
  children,
}: {
  icon: typeof Keyboard
  title: string
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={`rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40 ${className}`}
    >
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
        <Icon size={14} strokeWidth={1.75} />
        {title}
      </h3>
      {children}
    </section>
  )
}

function Li({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" />
      <span>{children}</span>
    </li>
  )
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
      <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
        {n}
      </span>
      <span>{children}</span>
    </li>
  )
}

export function HelpModal() {
  const closeHelp = useUiStore((s) => s.closeHelp)
  return (
    <Modal title="Help & user guide" size="lg" onClose={closeHelp}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          The <strong>Dashboard</strong> is the overview — <strong>Tasks</strong>,{' '}
          <strong>Notes</strong> and <strong>Bookmarks</strong> are the full pages behind its
          colour-coded widgets.
        </p>

        <HelpCard icon={Keyboard} title="Keyboard shortcuts">
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-sm text-slate-600 sm:grid-cols-[auto_1fr_auto_1fr] dark:text-slate-300">
            <span>
              <Kbd>N</Kbd>
            </span>
            <span>New note</span>
            <span>
              <Kbd>T</Kbd>
            </span>
            <span>New task</span>
            <span>
              <Kbd>B</Kbd>
            </span>
            <span>Bookmarks</span>
            <span>
              <Kbd>?</Kbd>
            </span>
            <span>This guide</span>
            <span className="flex gap-1">
              <Kbd>Ctrl</Kbd>
              <Kbd>Enter</Kbd>
            </span>
            <span>Save the note</span>
            <span>
              <Kbd>Esc</Kbd>
            </span>
            <span>Close dialogs</span>
            <span className="flex gap-1">
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
            </span>
            <span>Search & commands</span>
            <span>
              <Kbd>/</Kbd>
            </span>
            <span>Search (same palette)</span>
          </div>
        </HelpCard>

        <div className="grid gap-3 sm:grid-cols-2">
          <HelpCard icon={CalendarDays} title="Calendar & reminders">
            <ul className="flex flex-col gap-1">
              <Li>Click the clock to open the month calendar</Li>
              <Li>Indigo dots = task deadlines · amber = events</Li>
              <Li>Add an event directly on any day</Li>
              <Li>The bell gathers overdue, due-soon and today</Li>
            </ul>
          </HelpCard>

          <HelpCard icon={StickyNote} title="Notes">
            <ul className="flex flex-col gap-1">
              <Li>
                <Kbd>Ctrl</Kbd>+<Kbd>Enter</Kbd> saves instantly
              </Li>
              <Li>Drag the bar under the box to resize it</Li>
              <Li>Drafts survive switching tabs</Li>
              <Li>Convert a note to a task — first line becomes the title</Li>
            </ul>
          </HelpCard>

          <HelpCard icon={Bookmark} title="Bookmarks">
            <ul className="flex flex-col gap-1">
              <Li>Group your links; pick each group's colour (pencil icon)</Li>
              <Li>Reorder groups with the arrows; search covers everything</Li>
              <Li>Deleting a group keeps its links — they move to Ungrouped</Li>
              <Li>Site icons need network; offline shows a globe</Li>
            </ul>
          </HelpCard>

          <HelpCard icon={CloudSun} title="Weather">
            <ul className="flex flex-col gap-1">
              <Li>Click the place name to switch station or city</Li>
              <Li>Click the readings to open the HKO site</Li>
              <Li>Full-name or short-code label — set in Settings</Li>
              <Li>HKO blocked at work? Switch the source to Open-Meteo</Li>
            </ul>
          </HelpCard>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <HelpCard icon={ListTodo} title="Tasks & projects">
            <ul className="flex flex-col gap-1">
              <Li>
                Tag tasks in the editor, separating several with commas — tags become coloured
                chips, and a task appears under every project it carries
              </Li>
              <Li>Click a chip to filter; the layers button groups tasks by project</Li>
              <Li>Rename, recolour or reorder a project from its section header</Li>
            </ul>
          </HelpCard>

          <HelpCard icon={Presentation} title="Whiteboard">
            <ul className="flex flex-col gap-1">
              <Li>Opens from the projector button in the status bar; boards autosave locally</Li>
              <Li>Rename or switch boards and export PNG/SVG from the board header</Li>
            </ul>
          </HelpCard>
        </div>

        <HelpCard icon={CalendarCheck} title="Weekly review">
          <ul className="flex flex-col gap-1">
            <Li>Open it from the “Done this week” tile, or run it from the palette</Li>
            <Li>Arrows step back through past weeks; group by day or by project</Li>
            <Li>Copy as markdown for a standup or 1:1 — events optional</Li>
          </ul>
        </HelpCard>

        <HelpCard icon={Save} title="Backups & restore">
          <ol className="flex flex-col gap-1.5">
            <Step n={1}>Settings → Backups → choose a folder inside OneDrive.</Step>
            <Step n={2}>
              The app snapshots hourly whenever something changed (newest 30 kept) — you can also
              export a file any time.
            </Step>
            <Step n={3}>
              Restore from Settings, or from the automatic prompt if browser storage is ever
              cleared. Old backup files restore fine.
            </Step>
          </ol>
        </HelpCard>
      </div>
    </Modal>
  )
}
