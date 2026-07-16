import { useState } from 'react'
import { getApiKey, getApiUrl, setApiKey, setApiUrl } from '../storage'

export function SettingsPanel() {
  const [apiUrl, setApiUrlState] = useState(getApiUrl())
  const [apiKey, setApiKeyState] = useState(getApiKey())
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setApiUrl(apiUrl.trim())
    setApiKey(apiKey.trim())
    setSaved(true)
  }

  return (
    <div className="settings-panel">
      <h2>Settings</h2>
      <label htmlFor="api-url">API base URL</label>
      <input
        id="api-url"
        type="text"
        placeholder="http://localhost:8000"
        value={apiUrl}
        onChange={(e) => {
          setApiUrlState(e.target.value)
          setSaved(false)
        }}
      />

      <label htmlFor="api-key">API key</label>
      <input
        id="api-key"
        type="password"
        placeholder="X-API-Key value"
        value={apiKey}
        onChange={(e) => {
          setApiKeyState(e.target.value)
          setSaved(false)
        }}
      />

      <button type="button" onClick={handleSave}>
        Save
      </button>
      {saved && <span className="settings-saved">Saved</span>}
    </div>
  )
}
