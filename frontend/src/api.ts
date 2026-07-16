import type { ApiError, ValidateResponse } from './types'

export interface ValidateFiles {
  poPdfFile: File
  contractPdfFile: File
  sapRecordText: string
}

function messageForStatus(status: number, detail: unknown): string {
  if (status === 401) {
    return 'Invalid API key — check Settings'
  }
  if (status === 400) {
    return typeof detail === 'string' ? detail : 'The request was invalid.'
  }
  if (status === 500) {
    return 'Validation failed on the server. Check the backend logs.'
  }
  return `Unexpected error (status ${status})`
}

export async function validate(
  baseUrl: string,
  apiKey: string,
  files: ValidateFiles,
  signal?: AbortSignal,
): Promise<ValidateResponse> {
  const formData = new FormData()
  formData.append('po_pdf', files.poPdfFile)
  formData.append('contract_pdf', files.contractPdfFile)
  formData.append('sap_record', files.sapRecordText)

  let response: Response
  try {
    response = await fetch(`${baseUrl}/validate`, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey },
      body: formData,
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    const apiError: ApiError = {
      status: 0,
      message:
        'Could not reach the API — check the URL in Settings and that the server is running',
    }
    throw apiError
  }

  if (!response.ok) {
    let detail: unknown
    try {
      const body = await response.json()
      detail = body?.detail
    } catch {
      detail = undefined
    }
    const apiError: ApiError = {
      status: response.status,
      message: messageForStatus(response.status, detail),
    }
    throw apiError
  }

  return (await response.json()) as ValidateResponse
}
