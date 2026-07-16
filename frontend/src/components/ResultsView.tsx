import type { ValidationReport, ValidateResponse } from '../types'
import { downloadPdfFromBase64 } from '../download'

interface ResultsViewProps {
  result: ValidateResponse
  timestamp: string
}

const STATUS_LABEL: Record<ValidationReport['overall_status'], string> = {
  PASS: 'PASS',
  PASS_WITH_WARNINGS: 'PASS WITH WARNINGS',
  FAIL: 'FAIL',
}

function ReportSection({ report }: { report: ValidationReport }) {
  const flagged = report.discrepancies.filter((d) => d.severity !== 'match')

  return (
    <section className="report-section">
      <h3>
        {report.validation_type}{' '}
        <span className={`status-badge status-${report.overall_status.toLowerCase()}`}>
          {STATUS_LABEL[report.overall_status]}
        </span>
      </h3>
      <p>{report.summary}</p>

      {flagged.length === 0 ? (
        <p className="no-discrepancies">No discrepancies found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Value A</th>
              <th>Value B</th>
              <th>Severity</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {flagged.map((item, index) => (
              <tr key={index}>
                <td>{item.field}</td>
                <td>{item.source_a}</td>
                <td>{item.source_b}</td>
                <td className={`severity-${item.severity}`}>{item.severity}</td>
                <td>{item.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

export function ResultsView({ result, timestamp }: ResultsViewProps) {
  function handleDownload() {
    downloadPdfFromBase64(result.report_pdf_base64, `report_${timestamp}.pdf`)
  }

  return (
    <div className="results-view">
      <h2>Validation Results</h2>
      <ReportSection report={result.sap_validation} />
      <ReportSection report={result.contract_validation} />
      <button type="button" onClick={handleDownload}>
        Download PDF Report
      </button>
    </div>
  )
}
