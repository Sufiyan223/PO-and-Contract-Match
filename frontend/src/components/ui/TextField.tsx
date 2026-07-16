import type { InputHTMLAttributes } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
}

export function TextField({ id, label, ...rest }: TextFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <input
        id={id}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        {...rest}
      />
    </div>
  )
}
