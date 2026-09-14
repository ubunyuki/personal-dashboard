import type { ReactNode } from 'react'
import { Modal } from '../../components/ui/Modal'
import { useUiStore } from '../../store/uiStore'

const bodyCls = 'text-sm text-slate-600 dark:text-slate-300'

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] dark:border-slate-600 dark:bg-slate-800">
      {children}
    </kbd>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
        {title}
      </h3>
      {children}
    </section>
  )
}

export function HelpModal() {
  const closeHelp = useUiStore((s) => s.closeHelp)
  return (
    <Modal title="Help & user guide" size="lg" onClose={closeHelp}>
      <div className="flex flex-col gap-5">
        <Section title="Around the app">
          <p className={bodyCls}>
            <strong>Dashboard</strong> shows your task buckets (overdue, due today, due this
            week, in progress), metric tiles, upcoming events, recent notes and bookmarks — each
            section carries its own colour. <strong>Tasks</strong>, <strong>Notes</strong> and{' '}
            <strong>Bookmarks</strong> are the full pages behind those widgets.
          </p>
        </Section>

        <Section title="Keyboard shortcuts">
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5">
            <span>
              <Kbd>N</Kbd>
            </span>
            <span className={bodyCls}>New note — jumps to Notes and focuses the capture box</span>
            <span>
              <Kbd>T</Kbd>
            </span>
            <span className={bodyCls}>New task — opens the task editor</span>
            <span>
              <Kbd>B</Kbd>
            </span>
            <span className={bodyCls}>Bookmarks — jumps there and focuses the add-link box</span>
            <span>
              <Kbd>?</Kbd>
            </span>
            <span className={bodyCls}>Open this guide</span>
            <span className="flex gap-1">
              <Kbd>Ctrl</Kbd>
              <Kbd>Enter</Kbd>
            </span>
            <span className={bodyCls}>Save the note you are typing</span>
            <span>
              <Kbd>Esc</Kbd>
            </span>
            <span className={bodyCls}>Close any dialog or popover</span>
          </div>
        </Section>

        <Section title="Calendar & reminders">
          <p className={bodyCls}>
            Click the clock (top right) to open the month calendar: indigo dots are task
            deadlines, amber dots are events, and you can add an event inline on any day. The
            bell collects overdue and due-soon tasks plus today's events.
          </p>
        </Section>

        <Section title="Notes">
          <p className={bodyCls}>
            The capture box saves with <Kbd>Ctrl</Kbd>+<Kbd>Enter</Kbd>. Drag its bottom corner
            to resize it — the size is remembered — and half-typed drafts survive switching
            tabs. Any note can become a task: the first line turns into the title, the rest into
            the description, linked both ways.
          </p>
        </Section>

        <Section title="Bookmarks">
          <p className={bodyCls}>
            Save links into groups and search across all of them. Deleting a group keeps its
            links (they move to Ungrouped). Links open in a new tab; site icons come from the
            network, so offline you'll see a globe instead.
          </p>
        </Section>

        <Section title="Weather">
          <p className={bodyCls}>
            The chip shows your chosen place, temperature and humidity. In Settings you pick the
            source (an HKO station, or any city via Open-Meteo), the unit, and whether the label
            is the full name or a short code like “ST” — clicking the chip takes you there. If
            HKO is blocked on a work network, switch the source to Open-Meteo.
          </p>
        </Section>

        <Section title="Whiteboard">
          <p className={bodyCls}>
            The presentation button opens Excalidraw. Boards autosave locally; use the board
            header to rename or switch boards and to export PNG/SVG.
          </p>
        </Section>

        <Section title="Backups & restore">
          <p className={bodyCls}>
            Data lives only in this browser, so pick a backup folder (ideally inside OneDrive)
            in Settings — the app then writes a snapshot every hour something changed, keeping
            the newest 30, and nudges you when backups go stale. You can also export a file
            manually. To restore, use Settings or the prompt the app shows if browser storage
            was ever cleared; old backup files from before bookmarks existed restore fine.
          </p>
        </Section>
      </div>
    </Modal>
  )
}
