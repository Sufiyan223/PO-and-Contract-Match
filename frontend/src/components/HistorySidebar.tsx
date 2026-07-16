import type { HistoryEntry } from '../types'

interface HistorySidebarProps {
  history: HistoryEntry[]
  selectedTimestamp: string | null
  onSelect: (timestamp: string) => void
}

export function HistorySidebar({ history, selectedTimestamp, onSelect }: HistorySidebarProps) {
  if (history.length === 0) {
    return (
      <aside className="history-sidebar">
        <h3>History</h3>
        <p className="history-empty">No validations yet this session.</p>
      </aside>
    )
  }

  return (
    <aside className="history-sidebar">
      <h3>History</h3>
      <ul>
        {history.map((entry) => (
          <li key={entry.timestamp}>
            <button
              type="button"
              className={entry.timestamp === selectedTimestamp ? 'history-item selected' : 'history-item'}
              onClick={() => onSelect(entry.timestamp)}
            >
              <span>{new Date(entry.timestamp).toLocaleString()}</span>
              <span className={`status-dot status-${entry.sap_validation.overall_status.toLowerCase()}`}>
                SAP
              </span>
              <span className={`status-dot status-${entry.contract_validation.overall_status.toLowerCase()}`}>
                Contract
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
