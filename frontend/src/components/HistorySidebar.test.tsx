import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HistorySidebar } from './HistorySidebar'
import type { HistoryEntry } from '../types'

function makeEntry(timestamp: string, sapStatus: HistoryEntry['sap_validation']['overall_status']): HistoryEntry {
  return {
    timestamp,
    sap_validation: {
      validation_type: 'PO_vs_SAP',
      summary: '',
      discrepancies: [],
      overall_status: sapStatus,
    },
    contract_validation: {
      validation_type: 'PO_vs_Contract',
      summary: '',
      discrepancies: [],
      overall_status: 'PASS',
    },
    report_pdf_base64: '',
  }
}

describe('HistorySidebar', () => {
  it('shows an empty-state message when there is no history', () => {
    render(<HistorySidebar history={[]} selectedTimestamp={null} onSelect={vi.fn()} />)
    expect(screen.getByText('No validations yet this session.')).toBeInTheDocument()
  })

  it('lists each history entry with its timestamp', () => {
    const history = [makeEntry('2026-07-16T10:00:00.000Z', 'PASS'), makeEntry('2026-07-16T09:00:00.000Z', 'FAIL')]
    render(<HistorySidebar history={history} selectedTimestamp={null} onSelect={vi.fn()} />)

    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('calls onSelect with the entry timestamp when clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const history = [makeEntry('2026-07-16T10:00:00.000Z', 'PASS')]
    render(<HistorySidebar history={history} selectedTimestamp={null} onSelect={onSelect} />)

    await user.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith('2026-07-16T10:00:00.000Z')
  })

  it('marks the selected entry with the selected class', () => {
    const history = [makeEntry('2026-07-16T10:00:00.000Z', 'PASS')]
    render(<HistorySidebar history={history} selectedTimestamp="2026-07-16T10:00:00.000Z" onSelect={vi.fn()} />)

    expect(screen.getByRole('button')).toHaveClass('selected')
  })
})
