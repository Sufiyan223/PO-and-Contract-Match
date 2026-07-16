import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'

interface AlertProps {
  children: ReactNode
}

export function Alert({ children }: AlertProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}
