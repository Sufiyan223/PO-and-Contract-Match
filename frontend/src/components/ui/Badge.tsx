import type { ReactNode } from 'react'
import { cx } from './cx'

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral'

interface BadgeProps {
  tone: BadgeTone
  icon?: ReactNode
  children: ReactNode
  className?: string
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  success:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-300',
}

export function Badge({ tone, icon, children, className }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}
