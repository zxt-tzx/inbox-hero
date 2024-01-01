import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/20/solid'
import { useFieldArray, type Control } from 'react-hook-form'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { toast } from '~/components/ui/use-toast'
import { useZodForm } from '~/lib/form'
import { trpc } from '~/lib/trpc'
import { toCapitalCase } from '~/lib/utils'
import { addDomainsSchema } from '~/schemas/domain.schema'
import { useManage } from '../ManageProvider'

export function AddDomains() {
  const { path } = useManage()
  const description = (() => {
    switch (path) {
      case 'in': {
        return 'Emails from domains in your In list will always be delivered to your inbox.'
      }
      case 'out': {
        return 'Emails from domains in your Out list will skip your inbox and be sent to trash.'
      }
    }
  })()
  const addDomainsForm = useZodForm({
    schema: addDomainsSchema,
    defaultValues: {
      domains: [{ value: '' }],
      domainScreenStatus: path,
    },
  })
  const utils = trpc.useContext()
  const [open, setOpen] = useState(false)
  const submitAddDomains = trpc.manage.addDomains.useMutation({
    onSuccess: () => {
      setOpen(false)
      toast({
        title: `Domains successfully added to your ${toCapitalCase(
          path,
        )} list!`,
        duration: 5000,
      })
      addDomainsForm.reset()
      void utils.manage.listByScreenStatus.invalidate()
    },
  })
  const { mutate: submit, isLoading } = submitAddDomains
  const handleSubmit = addDomainsForm.handleSubmit((data) => {
    submit(data)
  })

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button className="ml-auto">+ Add Domain</Button>
      </AlertDialogTrigger>
      <Form {...addDomainsForm}>
        <form>
          <AlertDialogContent className="max-w-[90%] sm:max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>
                Add domain to {toCapitalCase(path)} list
              </AlertDialogTitle>
              <AlertDialogDescription>{description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AddDomainFields control={addDomainsForm.control} />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button type="submit" disabled={isLoading} onClick={handleSubmit}>
                {isLoading ? 'Adding...' : 'Confirm'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </form>
      </Form>
    </AlertDialog>
  )
}

function AddDomainFields({
  control,
}: {
  control: Control<(typeof addDomainsSchema)['_input']>
}) {
  const { fields, append, remove } = useFieldArray({
    name: 'domains',
  })
  return (
    <div className="grid w-full items-center gap-4">
      {fields.map((field, index) => (
        <FormField
          key={field.id}
          control={control}
          name={`domains.${index}.value`}
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
  )
}
