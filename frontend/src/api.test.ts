import { describe, expect, it, vi, beforeEach } from 'vitest'
import { validate } from './api'
import type { ApiError } from './types'

function makeFile(name: string, content: string, type: string): File {
  return new File([content], name, { type })
}

const files = {
  poPdfFile: makeFile('po.pdf', '%PDF-1.4', 'application/pdf'),
  contractPdfFile: makeFile('contract.pdf', '%PDF-1.4', 'application/pdf'),
  sapRecordText: '{"po_number": "CC-PO-2025-001234"}',
}

describe('validate', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('sends the correct multipart form data and X-API-Key header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ sap_validation: {}, contract_validation: {}, report_pdf_base64: 'abc' }), {
        status: 200,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await validate('http://localhost:8000', 'my-key', files)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:8000/validate')
    expect(options.method).toBe('POST')
    expect(options.headers['X-API-Key']).toBe('my-key')
    const body = options.body as FormData
    expect(body.get('po_pdf')).toBeInstanceOf(File)
    expect(body.get('contract_pdf')).toBeInstanceOf(File)
    expect(body.get('sap_record')).toBe(files.sapRecordText)
  })

  it('returns the parsed response on success', async () => {
    const payload = { sap_validation: { overall_status: 'PASS' }, contract_validation: {}, report_pdf_base64: 'abc' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 })))

    const result = await validate('http://localhost:8000', 'my-key', files)
    expect(result).toEqual(payload)
  })

  it('maps a 401 response to an "invalid API key" error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: 'nope' }), { status: 401 })),
    )

    await expect(validate('http://localhost:8000', 'wrong-key', files)).rejects.toMatchObject({
      status: 401,
      message: 'Invalid API key — check Settings',
    } satisfies ApiError)
  })

  it('maps a 400 response to the API detail message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: 'sap_record must be valid JSON' }), { status: 400 }),
      ),
    )

    await expect(validate('http://localhost:8000', 'my-key', files)).rejects.toMatchObject({
      status: 400,
      message: 'sap_record must be valid JSON',
    } satisfies ApiError)
  })

  it('maps a 500 response to a generic server-error message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: 'stack trace...' }), { status: 500 })),
    )

    await expect(validate('http://localhost:8000', 'my-key', files)).rejects.toMatchObject({
      status: 500,
      message: 'Validation failed on the server. Check the backend logs.',
    } satisfies ApiError)
  })

  it('maps a network failure to a "could not reach the API" error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(validate('http://localhost:8000', 'my-key', files)).rejects.toMatchObject({
      status: 0,
      message: 'Could not reach the API — check the URL in Settings and that the server is running',
    } satisfies ApiError)
  })

  it('re-throws AbortError without wrapping it', async () => {
    const abortError = new DOMException('cancelled', 'AbortError')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError))

    await expect(validate('http://localhost:8000', 'my-key', files)).rejects.toBe(abortError)
  })
})
