import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UploadForm } from './UploadForm'

function makeFile(name: string, content: string, type: string): File {
  return new File([content], name, { type })
}

describe('UploadForm', () => {
  it('keeps Validate disabled until all three files are chosen', async () => {
    const user = userEvent.setup()
    render(
      <UploadForm isLoading={false} errorMessage={null} onSubmit={vi.fn()} onCancel={vi.fn()} />,
    )

    expect(screen.getByRole('button', { name: 'Validate' })).toBeDisabled()

    await user.upload(screen.getByLabelText('Purchase Order (PDF)'), makeFile('po.pdf', 'x', 'application/pdf'))
    expect(screen.getByRole('button', { name: 'Validate' })).toBeDisabled()

    await user.upload(
      screen.getByLabelText('Contract (PDF)'),
      makeFile('contract.pdf', 'x', 'application/pdf'),
    )
    expect(screen.getByRole('button', { name: 'Validate' })).toBeDisabled()

    await user.upload(
      screen.getByLabelText('SAP Record (JSON)'),
      makeFile('sap.json', '{"a": 1}', 'application/json'),
    )
    expect(await screen.findByRole('button', { name: 'Validate' })).toBeEnabled()
  })

  it('shows an inline error and keeps Validate disabled when the SAP file is not valid JSON', async () => {
    const user = userEvent.setup()
    render(
      <UploadForm isLoading={false} errorMessage={null} onSubmit={vi.fn()} onCancel={vi.fn()} />,
    )

    await user.upload(screen.getByLabelText('Purchase Order (PDF)'), makeFile('po.pdf', 'x', 'application/pdf'))
    await user.upload(
      screen.getByLabelText('Contract (PDF)'),
      makeFile('contract.pdf', 'x', 'application/pdf'),
    )
    await user.upload(
      screen.getByLabelText('SAP Record (JSON)'),
      makeFile('sap.json', 'not json', 'application/json'),
    )

    expect(await screen.findByText('This file is not valid JSON.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Validate' })).toBeDisabled()
  })

  it('calls onSubmit with the chosen files when the form is submitted', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <UploadForm isLoading={false} errorMessage={null} onSubmit={onSubmit} onCancel={vi.fn()} />,
    )

    const poFile = makeFile('po.pdf', 'x', 'application/pdf')
    const contractFile = makeFile('contract.pdf', 'x', 'application/pdf')
    await user.upload(screen.getByLabelText('Purchase Order (PDF)'), poFile)
    await user.upload(screen.getByLabelText('Contract (PDF)'), contractFile)
    await user.upload(screen.getByLabelText('SAP Record (JSON)'), makeFile('sap.json', '{"a": 1}', 'application/json'))

    await user.click(await screen.findByRole('button', { name: 'Validate' }))

    expect(onSubmit).toHaveBeenCalledWith({
      poPdfFile: poFile,
      contractPdfFile: contractFile,
      sapRecordText: '{"a": 1}',
    })
  })

  it('shows the loading state and a Cancel button while isLoading is true', () => {
    render(<UploadForm isLoading={true} errorMessage={null} onSubmit={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.getByText(/this can take a minute or two/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Validate' })).not.toBeInTheDocument()
  })

  it('calls onCancel when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<UploadForm isLoading={true} errorMessage={null} onSubmit={vi.fn()} onCancel={onCancel} />)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows the error banner when errorMessage is set', () => {
    render(
      <UploadForm isLoading={false} errorMessage="Invalid API key — check Settings" onSubmit={vi.fn()} onCancel={vi.fn()} />,
    )

    expect(screen.getByText('Invalid API key — check Settings')).toBeInTheDocument()
  })
})
