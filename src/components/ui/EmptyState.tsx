export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="text-lg font-medium text-slate-500 dark:text-slate-400">{title}</p>
      {hint && <p className="max-w-md text-sm text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  )
}
