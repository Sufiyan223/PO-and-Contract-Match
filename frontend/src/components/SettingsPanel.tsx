import { useEffect, useState } from 'react'
import { CheckCircle2, Database, Mail, Server } from 'lucide-react'
import { getApiKey, getApiUrl, setApiKey, setApiUrl } from '../storage'
import { getOutlookConfig, saveOutlookConfig } from '../api'
import type { ApiError } from '../types'
import { Alert } from './ui/Alert'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { TextField } from './ui/TextField'

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
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Settings</h2>

      <Card title="API Connection" icon={<Server className="h-4 w-4 text-slate-400" aria-hidden="true" />}>
        <div className="flex flex-col gap-3">
          <TextField
            id="api-url"
            label="API base URL"
            type="text"
            placeholder="http://localhost:8000"
            value={apiUrl}
            onChange={(e) => {
              setApiUrlState(e.target.value)
              setSaved(false)
            }}
          />
          <TextField
            id="api-key"
            label="API key"
            type="password"
            placeholder="X-API-Key value"
            value={apiKey}
            onChange={(e) => {
              setApiKeyState(e.target.value)
              setSaved(false)
            }}
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
            {saved && (
              <Badge tone="success" icon={<CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}>
                Saved
              </Badge>
            )}
          </div>
        </div>
      </Card>

      <Card title="Outlook Connection" icon={<Mail className="h-4 w-4 text-slate-400" aria-hidden="true" />}>
        <div className="flex flex-col gap-3">
          <TextField
            id="outlook-tenant-id"
            label="Tenant ID"
            type="text"
            value={tenantId}
            onChange={(e) => {
              setTenantId(e.target.value)
              setOutlookSaved(false)
            }}
          />
          <TextField
            id="outlook-client-id"
            label="Client ID"
            type="text"
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value)
              setOutlookSaved(false)
            }}
          />
          <TextField
            id="outlook-client-secret"
            label="Client Secret"
            type="password"
            placeholder={clientSecretSet ? 'Client Secret: configured ✓' : ''}
            value={clientSecret}
            onChange={(e) => {
              setClientSecret(e.target.value)
              setOutlookSaved(false)
            }}
          />
          <TextField
            id="outlook-mailbox"
            label="Mailbox"
            type="text"
            value={mailbox}
            onChange={(e) => {
              setMailbox(e.target.value)
              setOutlookSaved(false)
            }}
          />
          <TextField
            id="outlook-subject-filter"
            label="Subject Filter"
            type="text"
            value={subjectFilter}
            onChange={(e) => {
              setSubjectFilter(e.target.value)
              setOutlookSaved(false)
            }}
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => void handleSaveOutlookConfig()}>
              Save Outlook Connection
            </Button>
            {outlookSaved && (
              <Badge tone="success" icon={<CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}>
                Saved
              </Badge>
            )}
          </div>
          {outlookError && <Alert>{outlookError}</Alert>}
        </div>
      </Card>

      <Card title="SAP Connection" icon={<Database className="h-4 w-4 text-slate-400" aria-hidden="true" />}>
        <div className="flex flex-col gap-2">
          <Button variant="secondary" size="sm" onClick={() => setSapNotAvailable(true)}>
            Connect to SAP
          </Button>
          {sapNotAvailable && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              SAP integration is not yet available.
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
