import { History } from 'lucide-react'
import type { HistoryEntry } from '../types'
import { Badge, type BadgeTone } from './ui/Badge'
import { cx } from './ui/cx'

interface HistorySidebarProps {
  history: HistoryEntry[]
  selectedTimestamp: string | null
  onSelect: (timestamp: string) => void
}

const STATUS_TONE: Record<HistoryEntry['sap_validation']['overall_status'], BadgeTone> = {
  PASS: 'success',
  PASS_WITH_WARNINGS: 'warning',
  FAIL: 'danger',
}

export function HistorySidebar({ history, selectedTimestamp, onSelect }: HistorySidebarProps) {
  return (
    <aside className="w-full shrink-0 md:w-64">
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
        <History className="h-4 w-4" aria-hidden="true" />
        History
      </h3>

      {history.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No validations yet this session.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {history.map((entry) => {
            const isSelected = entry.timestamp === selectedTimestamp
            return (
              <li key={entry.timestamp}>
                <button
                  type="button"
                  className={cx(
                    'flex w-full flex-col gap-1 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                    isSelected
                      ? 'selected border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/40'
                      : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50',
                  )}
                  onClick={() => onSelect(entry.timestamp)}
                >
                  <span className="text-slate-600 dark:text-slate-300">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                  <span className="flex gap-1.5">
                    <Badge tone={STATUS_TONE[entry.sap_validation.overall_status]}>SAP</Badge>
                    <Badge tone={STATUS_TONE[entry.contract_validation.overall_status]}>Contract</Badge>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </aside>
  )
}
