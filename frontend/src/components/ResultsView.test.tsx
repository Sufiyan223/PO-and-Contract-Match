import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResultsView } from './ResultsView'
import * as downloadModule from '../download'
import type { ValidateResponse } from '../types'

const sampleResult: ValidateResponse = {
  sap_validation: {
    validation_type: 'PO_vs_SAP',
    summary: 'One major discrepancy found.',
    overall_status: 'FAIL',
    discrepancies: [
      {
        field: 'contract_price',
        source_a: 'INR 45,00,000',
        source_b: 'INR 45,50,000',
        severity: 'major',
        note: 'Price differs by INR 50,000',
      },
    ],
  },
  contract_validation: {
    validation_type: 'PO_vs_Contract',
    summary: 'Everything matches.',
    overall_status: 'PASS',
    discrepancies: [],
  },
  report_pdf_base64: 'JVBERi0xLjQ=',
}

describe('ResultsView', () => {
  it('renders both reports with status badges, summaries, and discrepancy rows', () => {
    render(<ResultsView result={sampleResult} timestamp="2026-07-16T10:00:00.000Z" />)

    expect(screen.getByText('PO_vs_SAP')).toBeInTheDocument()
    expect(screen.getByText('FAIL')).toBeInTheDocument()
    expect(screen.getByText('One major discrepancy found.')).toBeInTheDocument()
    expect(screen.getByText('contract_price')).toBeInTheDocument()
    expect(screen.getByText('INR 45,00,000')).toBeInTheDocument()
    expect(screen.getByText('Price differs by INR 50,000')).toBeInTheDocument()

    expect(screen.getByText('PO_vs_Contract')).toBeInTheDocument()
    expect(screen.getByText('PASS')).toBeInTheDocument()
    expect(screen.getByText('No discrepancies found.')).toBeInTheDocument()
  })

  it('triggers a PDF download with the decoded base64 and a timestamped filename', async () => {
    const user = userEvent.setup()
    const spy = vi.spyOn(downloadModule, 'downloadPdfFromBase64').mockImplementation(() => {})

    render(<ResultsView result={sampleResult} timestamp="2026-07-16T10:00:00.000Z" />)
    await user.click(screen.getByRole('button', { name: 'Download PDF Report' }))

    expect(spy).toHaveBeenCalledWith('JVBERi0xLjQ=', 'report_2026-07-16T10:00:00.000Z.pdf')
  })
})
