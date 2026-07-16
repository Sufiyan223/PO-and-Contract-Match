import type { ReactNode } from 'react'
import { cx } from './cx'

interface CardProps {
  title?: string
  icon?: ReactNode
  headerExtra?: ReactNode
  children: ReactNode
  className?: string
}

export function Card({ title, icon, headerExtra, children, className }: CardProps) {
  return (
    <div
      className={cx(
        'rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800',
        'p-4',
        className,
      )}
    >
      {title && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
            {icon}
            {title}
          </h3>
          {headerExtra}
        </div>
      )}
      {children}
    </div>
  )
}
