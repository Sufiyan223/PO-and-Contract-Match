export type Severity = 'match' | 'minor' | 'major'
export type OverallStatus = 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL'
export type ValidationType = 'PO_vs_SAP' | 'PO_vs_Contract'

export interface DiscrepancyItem {
  field: string
  source_a: string
  source_b: string
  severity: Severity
  note: string
}

export interface ValidationReport {
  validation_type: ValidationType
  summary: string
  discrepancies: DiscrepancyItem[]
  overall_status: OverallStatus
}

export interface ValidateResponse {
  sap_validation: ValidationReport
  contract_validation: ValidationReport
  report_pdf_base64: string
}

export interface HistoryEntry extends ValidateResponse {
  timestamp: string
}

export interface ApiError {
  status: number
  message: string
}
