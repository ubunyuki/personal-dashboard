import type { ReactNode } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Field, inputCls } from '../../components/ui/Field'
import { useAppStore } from '../../store/appStore'
import { useUiStore } from '../../store/uiStore'
import type { Settings } from '../../types'
import { BackupSection } from './BackupSection'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-5 last:mb-0">
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
        {title}
      </h3>
      {children}
    </section>
  )
}

export function SettingsModal() {
  const close = useUiStore((s) => s.closeSettings)
  const persisted = useUiStore((s) => s.storagePersisted)
  const theme = useAppStore((s) => s.settings.theme)
  const updateSettings = useAppStore((s) => s.updateSettings)
  return (
    <Modal title="Settings" onClose={close}>
      <Section title="Backups">
        <BackupSection />
      </Section>
      <Section title="Appearance">
        <Field label="Theme">
          <select
            className={inputCls}
            value={theme}
            onChange={(e) => updateSettings({ theme: e.target.value as Settings['theme'] })}
          >
            <option value="system">Follow system</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </Field>
      </Section>
      <Section title="Storage">
        <p className="text-sm">
          {persisted
            ? 'Browser storage is persistent — the browser will not evict this app’s data under disk pressure.'
            : 'Browser storage is best-effort. Installing this site as an app (Edge menu → Apps) is the strongest way to protect your data from eviction.'}
        </p>
      </Section>
      <Section title="Weather">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Weather arrives in milestone 6 — Hong Kong Observatory readings, with a station picker.
        </p>
      </Section>
    </Modal>
  )
}
