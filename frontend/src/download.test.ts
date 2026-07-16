import { describe, expect, it, vi } from 'vitest'
import { base64ToBytes, base64ToFile, downloadPdfFromBase64 } from './download'

describe('base64ToBytes', () => {
  it('decodes a base64 string into the original bytes', () => {
    const base64 = btoa('%PDF-1.4 hello')
    const bytes = base64ToBytes(base64)
    expect(new TextDecoder().decode(bytes)).toBe('%PDF-1.4 hello')
  })
})

describe('base64ToFile', () => {
  it('creates a File with the given name, type, and decoded content', async () => {
    const base64 = btoa('%PDF-1.4 content')
    const file = base64ToFile(base64, 'po.pdf', 'application/pdf')

    expect(file.name).toBe('po.pdf')
    expect(file.type).toBe('application/pdf')
    expect(await file.text()).toBe('%PDF-1.4 content')
  })
})

describe('downloadPdfFromBase64', () => {
  it('creates an object URL, clicks a download anchor, and revokes the URL', () => {
    const base64 = btoa('%PDF-1.4')
    const createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    downloadPdfFromBase64(base64, 'report_2026-07-16.pdf')

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')

    clickSpy.mockRestore()
  })
})
