import { useRef, useState } from 'react'
import { FileText, UploadCloud, X } from 'lucide-react'
import { cx } from './cx'

interface FileDropzoneProps {
  id: string
  label: string
  accept: string
  value: File | null
  onChange: (file: File | null) => void
}

export function FileDropzone({ id, label, accept, value, onChange }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    onChange(e.dataTransfer.files?.[0] ?? null)
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation()
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cx(
          'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500',
          isDragging
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
            : 'border-slate-300 dark:border-slate-600',
          value && 'border-solid bg-slate-50 dark:bg-slate-700/40',
        )}
      >
        {value ? (
          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="max-w-[220px] truncate">{value.name}</span>
            <button
              type="button"
              onClick={handleRemove}
              aria-label={`Remove ${value.name}`}
              className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud className="h-6 w-6 text-slate-400" aria-hidden="true" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium text-indigo-600 dark:text-indigo-400">{label}</span>
              <br />
              Drag & drop, or click to browse
            </p>
          </>
        )}
      </div>
    </div>
  )
}
