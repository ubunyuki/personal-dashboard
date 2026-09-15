import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

const widthCls = { md: 'max-w-md', lg: 'max-w-lg' } as const

/** Right-side slide-over shell, shared by the task editor and the weekly
 *  review. The Escape listener lives here, so it exists only while a drawer
 *  is actually on screen. */
export function Drawer({
  title,
  onClose,
  width = 'md',
  children,
}: {
  title: string
  onClose: () => void
  width?: keyof typeof widthCls
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-slate-900/30 dark:bg-black/50" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute top-0 right-0 flex h-full w-full ${widthCls[width]} flex-col border-l border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900`}
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            type="button"
            title="Close"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X size={16} />
          </button>
        </header>
        {children}
      </aside>
    </div>
  )
}
