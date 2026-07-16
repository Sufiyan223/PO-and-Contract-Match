import { AlertTriangle, CheckCircle2, Download, XCircle } from 'lucide-react'
import type { DiscrepancyItem, ValidationReport, ValidateResponse } from '../types'
import { downloadPdfFromBase64 } from '../download'
import { Badge, type BadgeTone } from './ui/Badge'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

interface ResultsViewProps {
  result: ValidateResponse
  timestamp: string
}

const STATUS_META: Record<
  ValidationReport['overall_status'],
  { label: string; tone: BadgeTone; icon: typeof CheckCircle2 }
> = {
  PASS: { label: 'PASS', tone: 'success', icon: CheckCircle2 },
  PASS_WITH_WARNINGS: { label: 'PASS WITH WARNINGS', tone: 'warning', icon: AlertTriangle },
  FAIL: { label: 'FAIL', tone: 'danger', icon: XCircle },
}

const SEVERITY_TONE: Record<DiscrepancyItem['severity'], BadgeTone> = {
  match: 'neutral',
  minor: 'warning',
  major: 'danger',
}

function ReportSection({ report }: { report: ValidationReport }) {
  const flagged = report.discrepancies.filter((d) => d.severity !== 'match')
  const status = STATUS_META[report.overall_status]
  const StatusIcon = status.icon

  return (
    <Card
      title={report.validation_type}
      headerExtra={
        <Badge tone={status.tone} icon={<StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />}>
          {status.label}
        </Badge>
      }
    >
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">{report.summary}</p>

      {flagged.length === 0 ? (
        <p className="flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          No discrepancies found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="py-2 pr-3 font-medium">Field</th>
                <th className="py-2 pr-3 font-medium">Value A</th>
                <th className="py-2 pr-3 font-medium">Value B</th>
                <th className="py-2 pr-3 font-medium">Severity</th>
                <th className="py-2 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {flagged.map((item, index) => (
                <tr
                  key={index}
                  className="border-b border-slate-100 last:border-0 even:bg-slate-50 dark:border-slate-700 dark:even:bg-slate-700/30"
                >
                  <td className="py-2 pr-3 font-medium text-slate-700 dark:text-slate-200">
                    {item.field}
                  </td>
                  <td className="py-2 pr-3 text-slate-600 dark:text-slate-300">{item.source_a}</td>
                  <td className="py-2 pr-3 text-slate-600 dark:text-slate-300">{item.source_b}</td>
                  <td className="py-2 pr-3">
                    <Badge tone={SEVERITY_TONE[item.severity]}>{item.severity}</Badge>
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-300">{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

export function ResultsView({ result, timestamp }: ResultsViewProps) {
  function handleDownload() {
    downloadPdfFromBase64(result.report_pdf_base64, `report_${timestamp}.pdf`)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Validation Results
        </h2>
        <Button variant="secondary" size="sm" icon={<Download className="h-4 w-4" />} onClick={handleDownload}>
          Download PDF Report
        </Button>
      </div>
      <ReportSection report={result.sap_validation} />
      <ReportSection report={result.contract_validation} />
    </div>
  )
}
