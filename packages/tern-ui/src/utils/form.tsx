'use client'

import { Alert, AlertDescription } from '../components/elements/alert'
import { Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'

interface FormErrorsProps {
  errors: any[]
}

export function FormErrors({ errors }: FormErrorsProps) {
  if (!errors || errors.length === 0) return null

  return (
    <Alert variant="destructive" className="animate-in fade-in-50">
      <AlertDescription>
        {errors.map((error, i) => (
          <div key={i}>{error}</div>
        ))}
      </AlertDescription>
    </Alert>
  )
}

interface FormButtonProps {
  canSubmit: boolean
  isSubmitting: boolean
  submitText: string
  submittingText: string
  className?: string
}

export function FormButton({ 
  canSubmit,
  isSubmitting,
  submitText,
  submittingText,
  className
}: FormButtonProps) {
  return (
    <button
      type="submit"
      disabled={!canSubmit || isSubmitting}
      className={cn("w-full", className)}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {submittingText}
        </>
      ) : (
        submitText
      )}
    </button>
  )
}

export const emailValidator = ({ value }: { value: string }) => {
  if (!value) return "Email is required"
  const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
  if (!emailPattern.test(value)) return "Invalid email format"
  return undefined
}

export const passwordValidator = ({ value }: { value: string }) => {
  if (!value) return "Password is required"
  if (value.length < 8) return "Password must be at least 8 characters"
  if (!/[A-Z]/.test(value)) return "Password must contain at least one uppercase letter"
  if (!/[a-z]/.test(value)) return "Password must contain at least one lowercase letter"
  if (!/\d/.test(value)) return "Password must contain at least one number"
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
    return "Password must contain at least one special character"
  }
  return undefined
}
