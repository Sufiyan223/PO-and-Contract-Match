import { useRef, useState } from 'react'
import './App.css'
import { validate, type ValidateFiles } from './api'
import { getApiKey, getApiUrl } from './storage'
import { SettingsPanel } from './components/SettingsPanel'
import { UploadForm } from './components/UploadForm'
import { ResultsView } from './components/ResultsView'
import { HistorySidebar } from './components/HistorySidebar'
import type { ApiError, HistoryEntry } from './types'

type View = 'upload' | 'results' | 'settings'

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
    <div className="app-layout">
      <nav className="app-nav">
        <button type="button" onClick={() => setView('upload')} disabled={view === 'upload'}>
          Upload
        </button>
        <button
          type="button"
          onClick={() => setView('results')}
          disabled={view === 'results' || !selectedEntry}
        >
          Results
        </button>
        <button type="button" onClick={() => setView('settings')} disabled={view === 'settings'}>
          Settings
        </button>
      </nav>

      <div className="app-body">
        <main className="app-main">
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
