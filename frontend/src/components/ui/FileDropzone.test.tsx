import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileDropzone } from './FileDropzone'

function makeFile(name: string, content: string, type: string): File {
  return new File([content], name, { type })
}

describe('FileDropzone', () => {
  it('selects a file via the hidden input (click-to-browse path)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FileDropzone id="po-pdf" label="Purchase Order (PDF)" accept="application/pdf" value={null} onChange={onChange} />)

    const file = makeFile('po.pdf', 'x', 'application/pdf')
    await user.upload(screen.getByLabelText('Purchase Order (PDF)'), file)

    expect(onChange).toHaveBeenCalledWith(file)
  })

  it('selects a file when dropped onto the dropzone', () => {
    const onChange = vi.fn()
    render(<FileDropzone id="po-pdf" label="Purchase Order (PDF)" accept="application/pdf" value={null} onChange={onChange} />)

    const file = makeFile('po.pdf', 'x', 'application/pdf')
    const dropzone = screen.getByRole('button')

    const dataTransfer = { files: [file] } as unknown as DataTransfer
    dropzone.dispatchEvent(
      Object.assign(new Event('drop', { bubbles: true, cancelable: true }), { dataTransfer }),
    )

    expect(onChange).toHaveBeenCalledWith(file)
  })

  it('shows the selected file name and clears it when the remove button is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const file = makeFile('po.pdf', 'x', 'application/pdf')
    render(<FileDropzone id="po-pdf" label="Purchase Order (PDF)" accept="application/pdf" value={file} onChange={onChange} />)

    expect(screen.getByText('po.pdf')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove po.pdf' }))
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
