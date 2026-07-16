import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsPanel } from './SettingsPanel'
import * as api from '../api'
import type { ApiError, OutlookConfigResponse } from '../types'

vi.mock('../api', () => ({
  getOutlookConfig: vi.fn(),
  saveOutlookConfig: vi.fn(),
}))

const mockGetOutlookConfig = vi.mocked(api.getOutlookConfig)
const mockSaveOutlookConfig = vi.mocked(api.saveOutlookConfig)

function notConfiguredError(): ApiError {
  return { status: 404, message: 'Outlook is not configured yet' }
}

describe('SettingsPanel — Outlook Connection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('leaves the fields blank when Outlook is not configured yet (404)', async () => {
    mockGetOutlookConfig.mockRejectedValue(notConfiguredError())

    render(<SettingsPanel />)

    await waitFor(() => expect(mockGetOutlookConfig).toHaveBeenCalled())
    expect(screen.getByLabelText('Tenant ID')).toHaveValue('')
    expect(screen.queryByText(/outlook is not configured/i)).not.toBeInTheDocument()
  })

  it('pre-fills the non-secret fields from the existing config', async () => {
    const existing: OutlookConfigResponse = {
      tenant_id: 'tenant-123',
      client_id: 'client-abc',
      mailbox: 'procurement@clientco.com',
      subject_filter: 'PO and Contract',
      client_secret_set: true,
    }
    mockGetOutlookConfig.mockResolvedValue(existing)

    render(<SettingsPanel />)

    expect(await screen.findByDisplayValue('tenant-123')).toBeInTheDocument()
    expect(screen.getByDisplayValue('client-abc')).toBeInTheDocument()
    expect(screen.getByDisplayValue('procurement@clientco.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('PO and Contract')).toBeInTheDocument()
  })

  it('shows an error banner for a non-404 failure while loading the config', async () => {
    mockGetOutlookConfig.mockRejectedValue({ status: 500, message: 'Validation failed on the server.' })

    render(<SettingsPanel />)

    expect(await screen.findByText('Validation failed on the server.')).toBeInTheDocument()
  })

  it('saves the Outlook config and clears the secret field on success', async () => {
    const user = userEvent.setup()
    mockGetOutlookConfig.mockRejectedValue(notConfiguredError())
    mockSaveOutlookConfig.mockResolvedValue({
      tenant_id: 't',
      client_id: 'c',
      mailbox: 'm@clientco.com',
      subject_filter: 'PO',
      client_secret_set: true,
    })

    render(<SettingsPanel />)
    await waitFor(() => expect(mockGetOutlookConfig).toHaveBeenCalled())

    await user.type(screen.getByLabelText('Tenant ID'), 't')
    await user.type(screen.getByLabelText('Client ID'), 'c')
    await user.type(screen.getByLabelText('Client Secret'), 's')
    await user.type(screen.getByLabelText('Mailbox'), 'm@clientco.com')
    await user.type(screen.getByLabelText('Subject Filter'), 'PO')
    await user.click(screen.getByRole('button', { name: 'Save Outlook Connection' }))

    await waitFor(() => expect(mockSaveOutlookConfig).toHaveBeenCalled())
    expect(mockSaveOutlookConfig.mock.calls[0][2]).toEqual({
      tenant_id: 't',
      client_id: 'c',
      client_secret: 's',
      mailbox: 'm@clientco.com',
      subject_filter: 'PO',
    })
    expect(screen.getByLabelText('Client Secret')).toHaveValue('')
  })
})
