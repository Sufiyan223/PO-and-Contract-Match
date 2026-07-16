import { useState } from 'react'
import { fetchFromOutlook } from '../api'
import type { ValidateFiles } from '../api'
import { base64ToFile } from '../download'
import { getApiKey, getApiUrl } from '../storage'
import type { ApiError } from '../types'

interface UploadFormProps {
  isLoading: boolean
  errorMessage: string | null
  onSubmit: (files: ValidateFiles) => void
  onCancel: () => void
}

export function UploadForm({ isLoading, errorMessage, onSubmit, onCancel }: UploadFormProps) {
  const [poPdfFile, setPoPdfFile] = useState<File | null>(null)
  const [contractPdfFile, setContractPdfFile] = useState<File | null>(null)
  const [sapJsonError, setSapJsonError] = useState<string | null>(null)
  const [sapRecordText, setSapRecordText] = useState<string | null>(null)
  const [isFetchingOutlook, setIsFetchingOutlook] = useState(false)
  const [outlookFetchError, setOutlookFetchError] = useState<string | null>(null)

  async function handleSapFileChange(file: File | null) {
    setSapJsonError(null)
    setSapRecordText(null)
    if (!file) return

    const text = await file.text()
    try {
      JSON.parse(text)
      setSapRecordText(text)
    } catch {
      setSapJsonError('This file is not valid JSON.')
    }
  }

  async function handleFetchFromOutlook() {
    setOutlookFetchError(null)
    setIsFetchingOutlook(true)
    try {
      const result = await fetchFromOutlook(getApiUrl(), getApiKey())
      setPoPdfFile(base64ToFile(result.po_pdf_base64, 'po.pdf', 'application/pdf'))
      setContractPdfFile(base64ToFile(result.contract_pdf_base64, 'contract.pdf', 'application/pdf'))
    } catch (error) {
      setOutlookFetchError((error as ApiError).message)
    } finally {
      setIsFetchingOutlook(false)
    }
  }

  const canSubmit = Boolean(poPdfFile && contractPdfFile && sapRecordText) && !isLoading

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!poPdfFile || !contractPdfFile || !sapRecordText) return
    onSubmit({ poPdfFile, contractPdfFile, sapRecordText })
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <h2>Upload documents</h2>

      <button type="button" onClick={() => void handleFetchFromOutlook()} disabled={isFetchingOutlook}>
        {isFetchingOutlook ? 'Fetching from Outlook…' : 'Fetch from Outlook'}
      </button>
      {outlookFetchError && <p className="error-banner">{outlookFetchError}</p>}

      <label htmlFor="po-pdf">Purchase Order (PDF)</label>
      <input
        id="po-pdf"
        type="file"
        accept="application/pdf"
        onChange={(e) => setPoPdfFile(e.target.files?.[0] ?? null)}
      />
      {poPdfFile && <p className="field-hint">Selected: {poPdfFile.name}</p>}

      <label htmlFor="contract-pdf">Contract (PDF)</label>
      <input
        id="contract-pdf"
        type="file"
        accept="application/pdf"
        onChange={(e) => setContractPdfFile(e.target.files?.[0] ?? null)}
      />
      {contractPdfFile && <p className="field-hint">Selected: {contractPdfFile.name}</p>}

      <label htmlFor="sap-json">SAP Record (JSON)</label>
      <input
        id="sap-json"
        type="file"
        accept="application/json"
        onChange={(e) => void handleSapFileChange(e.target.files?.[0] ?? null)}
      />
      {sapJsonError && <p className="field-error">{sapJsonError}</p>}

      {!canSubmit && !isLoading && (
        <p className="field-hint">Select all three files (SAP record must be valid JSON) to continue.</p>
      )}

      {errorMessage && <p className="error-banner">{errorMessage}</p>}

      {isLoading ? (
        <div className="loading-state">
          <p>Validating — this can take a minute or two…</p>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      ) : (
        <button type="submit" disabled={!canSubmit}>
          Validate
        </button>
      )}
    </form>
  )
}
