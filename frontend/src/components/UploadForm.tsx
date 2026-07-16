import { useState } from 'react'
import type { ValidateFiles } from '../api'

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

  const canSubmit = Boolean(poPdfFile && contractPdfFile && sapRecordText) && !isLoading

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!poPdfFile || !contractPdfFile || !sapRecordText) return
    onSubmit({ poPdfFile, contractPdfFile, sapRecordText })
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <h2>Upload documents</h2>

      <label htmlFor="po-pdf">Purchase Order (PDF)</label>
      <input
        id="po-pdf"
        type="file"
        accept="application/pdf"
        onChange={(e) => setPoPdfFile(e.target.files?.[0] ?? null)}
      />

      <label htmlFor="contract-pdf">Contract (PDF)</label>
      <input
        id="contract-pdf"
        type="file"
        accept="application/pdf"
        onChange={(e) => setContractPdfFile(e.target.files?.[0] ?? null)}
      />

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
