import { useRef, useState } from 'react'
import { FileCheck2, Settings as SettingsIcon, UploadCloud } from 'lucide-react'
import { validate, type ValidateFiles } from './api'
import { getApiKey, getApiUrl } from './storage'
import { SettingsPanel } from './components/SettingsPanel'
import { UploadForm } from './components/UploadForm'
import { ResultsView } from './components/ResultsView'
import { HistorySidebar } from './components/HistorySidebar'
import { cx } from './components/ui/cx'
import type { ApiError, HistoryEntry } from './types'

type View = 'upload' | 'results' | 'settings'

const NAV_ITEMS: { view: View; label: string; icon: typeof UploadCloud }[] = [
  { view: 'upload', label: 'Upload', icon: UploadCloud },
  { view: 'results', label: 'Results', icon: FileCheck2 },
  { view: 'settings', label: 'Settings', icon: SettingsIcon },
]

function App() {
  const [view, setView] = useState<View>('upload')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [selectedTimestamp, setSelectedTimestamp] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  async function handleSubmit(files: ValidateFiles) {
    setIsLoading(true)
    setErrorMessage(null)
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const response = await validate(getApiUrl(), getApiKey(), files, controller.signal)
      const timestamp = new Date().toISOString()
      const entry: HistoryEntry = { ...response, timestamp }
      setHistory((prev) => [entry, ...prev])
      setSelectedTimestamp(timestamp)
      setView('results')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        // user cancelled — no error banner
      } else {
        setErrorMessage((error as ApiError).message)
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  function handleCancel() {
    abortControllerRef.current?.abort()
  }

  function handleSelectHistory(timestamp: string) {
    setSelectedTimestamp(timestamp)
    setView('results')
  }

  const selectedEntry = history.find((entry) => entry.timestamp === selectedTimestamp) ?? null

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-700">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          PO and Contract Match
        </h1>
        <nav className="flex gap-1">
          {NAV_ITEMS.map(({ view: itemView, label, icon: Icon }) => {
            const isActive = view === itemView
            const isDisabled = itemView === 'results' && !selectedEntry
            return (
              <button
                key={itemView}
                type="button"
                onClick={() => setView(itemView)}
                disabled={isDisabled}
                aria-current={isActive ? 'page' : undefined}
                className={cx(
                  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  'disabled:cursor-not-allowed disabled:opacity-40',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            )
          })}
        </nav>
      </header>

      <div className="flex flex-col gap-6 md:flex-row">
        <main className="min-w-0 flex-1">
          {view === 'upload' && (
            <UploadForm
              isLoading={isLoading}
              errorMessage={errorMessage}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          )}
          {view === 'results' && selectedEntry && (
            <ResultsView result={selectedEntry} timestamp={selectedEntry.timestamp} />
          )}
          {view === 'settings' && <SettingsPanel />}
        </main>

        <HistorySidebar
          history={history}
          selectedTimestamp={selectedTimestamp}
          onSelect={handleSelectHistory}
        />
      </div>
    </div>
  )
}

export default App
