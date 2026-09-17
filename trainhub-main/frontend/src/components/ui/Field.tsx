import { useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

const baseInput =
  'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-800 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 transition-colors'

interface WrapperProps {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
}

export function FieldWrapper({ label, hint, error, required, children }: WrapperProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-ink-700">
          {label}
          {required && <span className="text-accent-600"> *</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export function Input({ label, hint, error, className = '', required, ...rest }: InputProps) {
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required}>
      <input className={`${baseInput} ${className}`} required={required} {...rest} />
    </FieldWrapper>
  )
}

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  hint?: string
  error?: string
}

export function PasswordInput({ label, hint, error, className = '', required, ...rest }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required}>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          className={`${baseInput} pe-11 ${className}`}
          required={required}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 end-0 flex items-center px-3 text-ink-400 hover:text-ink-600 cursor-pointer"
        >
          {visible ? '🙈' : '👁️'}
        </button>
      </div>
    </FieldWrapper>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export function Textarea({ label, hint, error, className = '', ...rest }: TextareaProps) {
  return (
    <FieldWrapper label={label} hint={hint} error={error}>
      <textarea className={`${baseInput} min-h-24 resize-y ${className}`} {...rest} />
    </FieldWrapper>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  children: ReactNode
}

export function Select({ label, hint, error, className = '', children, ...rest }: SelectProps) {
  return (
    <FieldWrapper label={label} hint={hint} error={error}>
      <select className={`${baseInput} ${className}`} {...rest}>
        {children}
      </select>
    </FieldWrapper>
  )
}
