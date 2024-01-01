import { useId } from 'react'
import { ErrorMessage } from '@hookform/error-message'
import clsx from 'clsx'
import { useController, useFormContext } from 'react-hook-form'
import Select from 'react-select'
import { type z } from 'zod'

import { ErrorMessageText, formClasses, Label } from '~/components/Fields'
import { insertWaitlistSchema } from '~/schemas/waitlist.schema'

export const EmailProviderSelect = () => {
  const {
    formState: { errors },
    setValue,
    control,
  } = useFormContext<z.infer<typeof insertWaitlistSchema>>()
  const {
    field: {
      value: emailProviderValue,
      onChange: emailProviderOnChange,
      ...restEmailProviderField
    },
  } = useController({ name: 'emailProvider', control })

  /*
  TODO: extract this into Fields.tsx
*/
  const controlStyles = {
    base: 'rounded-lg hover:cursor-pointer',
    focus: 'border-primary-600',
    nonFocus: 'border-gray-300 hover:border-gray-400',
  }
  const placeholderStyles = 'text-gray-500 pl-1 py-0.5'
  const selectInputStyles = 'pl-1 py-0.5'
  const valueContainerStyles = 'p-1 gap-1'
  const singleValueStyles = 'leading-7 ml-1'
  const multiValueStyles =
    'bg-gray-100 rounded items-center py-0.5 pl-2 pr-1 gap-1.5'
  const multiValueLabelStyles = 'leading-6 py-0.5'
  const multiValueRemoveStyles =
    'border border-gray-200 bg-white hover:bg-red-50 hover:text-red-800 text-gray-500 hover:border-red-300 rounded-md'
  const indicatorsContainerStyles = 'p-1 gap-1'
  const clearIndicatorStyles =
    'text-gray-500 p-1 rounded-md hover:bg-red-50 hover:text-red-800'
  const indicatorSeparatorStyles = 'bg-gray-300'
  const dropdownIndicatorStyles =
    'p-1 hover:bg-gray-100 text-gray-500 rounded-md hover:text-black'
  const menuStyles = 'p-1 mt-2 border border-gray-200 bg-white rounded-lg'
  const groupHeadingStyles = 'ml-3 mt-2 mb-1 text-gray-500 text-sm'
  const optionStyles = {
    base: 'hover:cursor-pointer px-3 py-2 rounded',
    focus: 'bg-gray-100 active:bg-gray-200',
    selected:
      "after:content-['✔'] after:ml-2 after:text-green-500 text-gray-500",
  }
  const noOptionsMessageStyles =
    'text-gray-500 p-2 bg-gray-50 border border-dashed border-gray-200 rounded-sm'

  const options = generateOptions()
  return (
    <>
      <div className="py-2">
        <Label>Email provider</Label>
        <Select
          unstyled
          classNames={{
            control: ({ isFocused }) =>
              clsx(
                isFocused ? controlStyles.focus : controlStyles.nonFocus,
                controlStyles.base,
              ),
            placeholder: () => placeholderStyles,
            input: () => selectInputStyles,
            valueContainer: () => valueContainerStyles,
            singleValue: () => singleValueStyles,
            multiValue: () => multiValueStyles,
            multiValueLabel: () => multiValueLabelStyles,
            multiValueRemove: () => multiValueRemoveStyles,
            indicatorsContainer: () => indicatorsContainerStyles,
            clearIndicator: () => clearIndicatorStyles,
            indicatorSeparator: () => indicatorSeparatorStyles,
            dropdownIndicator: () => dropdownIndicatorStyles,
            menu: () => menuStyles,
            groupHeading: () => groupHeadingStyles,
            option: ({ isFocused, isSelected }) =>
              clsx(
                isFocused && optionStyles.focus,
                isSelected && optionStyles.selected,
                optionStyles.base,
              ),
            noOptionsMessage: () => noOptionsMessageStyles,
          }}
          styles={{
            input: (base) => ({
              ...base,
              'input:focus': {
                boxShadow: 'none',
              },
            }),
          }}
          instanceId={useId()}
          className={clsx(formClasses, 'col-span-full')}
          options={options}
          placeholder="Select email provider"
          value={options.find((x) => x.value === emailProviderValue)}
          onChange={(option) => {
            if (!option) return
            if (option.value !== 'other') {
              setValue('otherEmailProvider', '')
            }
            emailProviderOnChange(option.value)
          }}
          {...restEmailProviderField}
        />
      </div>
      <ErrorMessage
        errors={errors}
        name="emailProvider"
        render={({ message }) => (
          <ErrorMessageText>
            {message.includes('Required')
              ? 'Please select an email provider.'
              : message.includes('Invalid enum')
              ? 'Please use the dropdown menu!'
              : message}
          </ErrorMessageText>
        )}
      />
    </>
  )
}

export const generateOptions = () => {
  const emailProviderEnum = insertWaitlistSchema.shape.emailProvider
  type EmailProviderEnum = z.infer<typeof emailProviderEnum>
  const generateLabel = (option: EmailProviderEnum) => {
    switch (option) {
      case 'gmail_personal':
        return 'Gmail (Personal)'
      case 'gmail_workspace':
        return 'Gmail (Workspace)'
      case 'outlook_personal':
        return 'Outlook (Personal)'
      case 'outlook_work':
        return 'Outlook (Work)'
      case 'apple':
        return 'Apple Mail'
      case 'yahoo':
        return 'Yahoo'
      case 'other':
        return 'Other'
      default:
        option satisfies never
        return option
    }
  }
  return emailProviderEnum.options.map((option) => {
    return { value: option, label: generateLabel(option) }
  })
}
