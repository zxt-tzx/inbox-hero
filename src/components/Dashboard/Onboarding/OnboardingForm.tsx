import { XMarkIcon } from '@heroicons/react/20/solid'
import { useFieldArray, type Control } from 'react-hook-form'

import { Button } from '~/components/ui/button'
import { CardContent } from '~/components/ui/card'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Switch } from '~/components/ui/switch'
import { type onboardingFormSchema } from '~/schemas/screener.schema'

export function OnboardingForm({
  control,
}: {
  control: Control<(typeof onboardingFormSchema)['_input']>
}) {
  const { fields, append, remove } = useFieldArray({
    name: 'whitelistedDomains',
  })
  return (
    <CardContent>
      <div className="grid w-full items-center gap-4">
        <FormField
          control={control}
          name="whitelistRecentSenders"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg">
              <div className="space-y-0.5 pr-8">
                <FormLabel className="text-base">
                  Whitelist recent senders?
                </FormLabel>
                <FormDescription>
                  Inbox Hero will whitelist senders whose emails you have read
                  in the last 7 days. Senders whose emails are unread or sent to
                  the trash or spam folders will not be whitelisted!
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="space-y-0.5">
          <FormLabel className="text-base">Whitelist domains?</FormLabel>
          <FormDescription>
            All emails from these domains will reach your inbox directly without
            screening.
          </FormDescription>
        </div>
        {fields.map((field, index) => (
          <FormField
            key={field.id}
            control={control}
            name={`whitelistedDomains.${index}.value`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex items-center">
                    <Input {...field} placeholder="@dunder-mifflin.com" />
                    <div className="ml-2">
                      <XMarkIcon
                        type="button"
                        className="h-5 w-5 text-gray-400"
                        onClick={() => remove(index)}
                      />
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mx-auto mt-2"
          onClick={() => append({ value: '' })}
        >
          Add another domain
        </Button>
      </div>
    </CardContent>
  )
}
