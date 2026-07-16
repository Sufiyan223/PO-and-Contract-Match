export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function base64ToFile(base64: string, filename: string, mimeType: string): File {
  return new File([base64ToBytes(base64) as BlobPart], filename, { type: mimeType })
}

export function downloadPdfFromBase64(base64: string, filename: string): void {
  const blob = new Blob([base64ToBytes(base64) as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()

  URL.revokeObjectURL(url)
}
