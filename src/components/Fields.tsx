import { useId } from 'react'
import { ExclamationCircleIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import { type FieldError, type UseFormRegisterReturn } from 'react-hook-form'

export const formClasses =
  'block w-full appearance-none rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-blue-500 sm:text-sm'

const errorMessageClasses = 'mt-2 text-sm text-red-600'

export function Label({
  id,
  children,
}: {
  id?: string
  children: React.ReactNode
}) {
  return (
    <label
      htmlFor={id}
      className="mb-3 block text-sm font-medium text-gray-700"
    >
      {children}
    </label>
  )
}

export function InputField({
  label,
  type = 'text',
  register,
  className,
  error,
  customErrorMessage,
  ...props
}: Omit<React.ComponentPropsWithoutRef<'input'>, 'id'> & {
  label: string
  register: UseFormRegisterReturn
  error: FieldError | undefined
  customErrorMessage?: string
}) {
  const id = useId()

  return (
    <div className={className}>
      {label && <Label id={id}>{label}</Label>}
      <div className="relative mt-2 rounded-md shadow-sm">
        <input
          id={id}
          type={type}
          {...register}
          {...props}
          className={formClasses}
        />
        {error && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ExclamationCircleIcon
              className="h-5 w-5 text-red-500"
              aria-hidden="true"
            />
          </div>
        )}
      </div>
      {error && (
        <p className={errorMessageClasses}>
          {customErrorMessage || error.message}
        </p>
      )}
    </div>
  )
}

export function ErrorMessageText({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <p className={clsx(errorMessageClasses, className)}>{children}</p>
}

export function SelectField({
  label,
  className,
  ...props
}: Omit<React.ComponentPropsWithoutRef<'select'>, 'id'> & { label: string }) {
  const id = useId()

  return (
    <div className={className}>
      {label && <Label id={id}>{label}</Label>}
      <select id={id} {...props} className={clsx(formClasses, 'pr-8')} />
    </div>
  )
}

export function Textarea({
  label,
  className,
  register,
  ...props
}: Omit<React.ComponentPropsWithoutRef<'textarea'>, 'id'> & {
  register: UseFormRegisterReturn
  label?: string
}) {
  return (
    <div className={className}>
      {label && <Label>{label}</Label>}
      <textarea rows={4} {...register} {...props} className={formClasses} />
    </div>
  )
}
