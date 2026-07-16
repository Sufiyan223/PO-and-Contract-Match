import { useEffect, useState } from 'react'
import { getApiKey, getApiUrl, setApiKey, setApiUrl } from '../storage'
import { getOutlookConfig, saveOutlookConfig } from '../api'
import type { ApiError } from '../types'

export function SettingsPanel() {
  const [apiUrl, setApiUrlState] = useState(getApiUrl())
  const [apiKey, setApiKeyState] = useState(getApiKey())
  const [saved, setSaved] = useState(false)

  const [tenantId, setTenantId] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [mailbox, setMailbox] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [clientSecretSet, setClientSecretSet] = useState(false)
  const [outlookSaved, setOutlookSaved] = useState(false)
  const [outlookError, setOutlookError] = useState<string | null>(null)

  const [sapNotAvailable, setSapNotAvailable] = useState(false)

  useEffect(() => {
    let cancelled = false
    getOutlookConfig(apiUrl, apiKey)
      .then((config) => {
        if (cancelled) return
        setTenantId(config.tenant_id)
        setClientId(config.client_id)
        setMailbox(config.mailbox)
        setSubjectFilter(config.subject_filter)
        setClientSecretSet(config.client_secret_set)
      })
      .catch((error: ApiError) => {
        if (cancelled || error.status === 404) return
        setOutlookError(error.message)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSave() {
    setApiUrl(apiUrl.trim())
    setApiKey(apiKey.trim())
    setSaved(true)
  }

  async function handleSaveOutlookConfig() {
    setOutlookError(null)
    try {
      const result = await saveOutlookConfig(apiUrl, apiKey, {
        tenant_id: tenantId,
        client_id: clientId,
        client_secret: clientSecret,
        mailbox,
        subject_filter: subjectFilter,
      })
      setClientSecretSet(result.client_secret_set)
      setClientSecret('')
      setOutlookSaved(true)
    } catch (error) {
      setOutlookError((error as ApiError).message)
    }
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

      <h3>Outlook Connection</h3>

      <label htmlFor="outlook-tenant-id">Tenant ID</label>
      <input
        id="outlook-tenant-id"
        type="text"
        value={tenantId}
        onChange={(e) => {
          setTenantId(e.target.value)
          setOutlookSaved(false)
        }}
      />

      <label htmlFor="outlook-client-id">Client ID</label>
      <input
        id="outlook-client-id"
        type="text"
        value={clientId}
        onChange={(e) => {
          setClientId(e.target.value)
          setOutlookSaved(false)
        }}
      />

      <label htmlFor="outlook-client-secret">Client Secret</label>
      <input
        id="outlook-client-secret"
        type="password"
        placeholder={clientSecretSet ? 'Client Secret: configured ✓' : ''}
        value={clientSecret}
        onChange={(e) => {
          setClientSecret(e.target.value)
          setOutlookSaved(false)
        }}
      />

      <label htmlFor="outlook-mailbox">Mailbox</label>
      <input
        id="outlook-mailbox"
        type="text"
        value={mailbox}
        onChange={(e) => {
          setMailbox(e.target.value)
          setOutlookSaved(false)
        }}
      />

      <label htmlFor="outlook-subject-filter">Subject Filter</label>
      <input
        id="outlook-subject-filter"
        type="text"
        value={subjectFilter}
        onChange={(e) => {
          setSubjectFilter(e.target.value)
          setOutlookSaved(false)
        }}
      />

      <button type="button" onClick={() => void handleSaveOutlookConfig()}>
        Save Outlook Connection
      </button>
      {outlookSaved && <span className="settings-saved">Saved</span>}
      {outlookError && <p className="error-banner">{outlookError}</p>}

      <h3>SAP Connection</h3>
      <button type="button" onClick={() => setSapNotAvailable(true)}>
        Connect to SAP
      </button>
      {sapNotAvailable && <p className="field-hint">SAP integration is not yet available.</p>}
    </div>
  )
}
