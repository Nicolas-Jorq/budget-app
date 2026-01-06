/**
 * @fileoverview Form Field Components
 *
 * Reusable form field components with React Hook Form integration.
 * Provides consistent styling and error handling across all forms.
 *
 * @module components/form/FormField
 */

import { forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { FieldError } from 'react-hook-form'

// ===========================================
// Types
// ===========================================

interface BaseFieldProps {
  label: string
  error?: FieldError
  hint?: string
}

// ===========================================
// Field Wrapper
// ===========================================

interface FieldWrapperProps extends BaseFieldProps {
  children: React.ReactNode
  htmlFor?: string
}

export function FieldWrapper({ label, error, hint, htmlFor, children }: FieldWrapperProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-content-secondary">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error.message}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-content-tertiary">{hint}</p>
      )}
    </div>
  )
}

// ===========================================
// Input Field
// ===========================================

interface InputFieldProps extends BaseFieldProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, hint, ...props }, ref) => {
    return (
      <FieldWrapper label={label} error={error} hint={hint} htmlFor={props.id}>
        <input
          ref={ref}
          className={`w-full px-3 py-2 bg-theme-elevated border rounded-lg text-content-primary
            placeholder:text-content-tertiary
            focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-border-subtle'}`}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
      </FieldWrapper>
    )
  }
)

InputField.displayName = 'InputField'

// ===========================================
// Select Field
// ===========================================

interface SelectFieldProps extends BaseFieldProps, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  children: React.ReactNode
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, hint, children, ...props }, ref) => {
    return (
      <FieldWrapper label={label} error={error} hint={hint} htmlFor={props.id}>
        <select
          ref={ref}
          className={`w-full px-3 py-2 bg-theme-elevated border rounded-lg text-content-primary
            focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-border-subtle'}`}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        >
          {children}
        </select>
      </FieldWrapper>
    )
  }
)

SelectField.displayName = 'SelectField'

// ===========================================
// Textarea Field
// ===========================================

interface TextareaFieldProps extends BaseFieldProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, hint, ...props }, ref) => {
    return (
      <FieldWrapper label={label} error={error} hint={hint} htmlFor={props.id}>
        <textarea
          ref={ref}
          className={`w-full px-3 py-2 bg-theme-elevated border rounded-lg text-content-primary
            placeholder:text-content-tertiary resize-none
            focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-border-subtle'}`}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
      </FieldWrapper>
    )
  }
)

TextareaField.displayName = 'TextareaField'

// ===========================================
// Submit Button
// ===========================================

interface SubmitButtonProps {
  children: React.ReactNode
  isSubmitting?: boolean
  disabled?: boolean
}

export function SubmitButton({ children, isSubmitting, disabled }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isSubmitting || disabled}
      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors"
    >
      {isSubmitting ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Saving...
        </span>
      ) : (
        children
      )}
    </button>
  )
}

// ===========================================
// Form Error Summary
// ===========================================

interface FormErrorSummaryProps {
  errors: Record<string, FieldError | undefined>
}

export function FormErrorSummary({ errors }: FormErrorSummaryProps) {
  const errorMessages = Object.values(errors).filter(Boolean).map(e => e?.message)

  if (errorMessages.length === 0) return null

  return (
    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg" role="alert">
      <p className="text-sm font-medium text-red-500 mb-1">Please fix the following errors:</p>
      <ul className="list-disc list-inside text-sm text-red-400">
        {errorMessages.map((message, i) => (
          <li key={i}>{message}</li>
        ))}
      </ul>
    </div>
  )
}
