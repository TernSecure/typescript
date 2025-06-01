import { createFormHookContexts, createFormHook } from '@tanstack/react-form'
import {
  EmailField,
  PasswordField,
} from './FieldControl'

import { Button } from './button'

const { 
  fieldContext, 
  useFieldContext, 
  formContext, 
  useFormContext
} = createFormHookContexts()

export function SubscribeButton({ label }: { label: string }) {
  const form = useFormContext()
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => <Button disabled={isSubmitting}>{label}</Button>}
    </form.Subscribe>
  )
}

// Create base form hook with contexts
const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    EmailField,
    PasswordField,
  },
  formComponents: {
    SubscribeButton,
  }
})

// Export only the essential hooks and contexts for form usage
export {
  fieldContext,
  useFieldContext,
  formContext,
  useAppForm,
  withForm,
  useFormContext
}