import type { ButtonHTMLAttributes } from 'react'

const variants = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  danger: 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950',
} as const

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }

export function Button({ variant = 'ghost', className = '', type = 'button', ...props }: Props) {
  return (
    <button
      type={type}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
