import { Loader2 } from 'lucide-react'
import { cx } from './cx'

interface SpinnerProps {
  className?: string
}

export function Spinner({ className }: SpinnerProps) {
  return <Loader2 className={cx('animate-spin', className)} aria-hidden="true" />
}
