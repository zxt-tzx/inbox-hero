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
import { addSendersSchema } from '~/schemas/sender.schema'
import { useManage } from '../ManageProvider'

export function AddSenders() {
  const { path } = useManage()
  const description = (() => {
    switch (path) {
      case 'in': {
        return 'Emails from senders in your In list will always be delivered to your inbox.'
      }
      case 'out': {
        return 'Emails from senders in your Out list will skip your inbox and be sent to trash.'
      }
    }
  })()
  const addSendersForm = useZodForm({
    schema: addSendersSchema,
    defaultValues: {
      senders: [{ value: '' }],
      senderScreenStatus: path,
    },
  })
  const utils = trpc.useContext()
  const [open, setOpen] = useState(false)
  const submitAddSenders = trpc.manage.addSenders.useMutation({
    onSuccess: () => {
      setOpen(false)
      toast({
        title: `Senders successfully added to your ${toCapitalCase(
          path,
        )} list!`,
        duration: 5000,
      })
      addSendersForm.reset()
      void utils.manage.listByScreenStatus.invalidate()
    },
  })
  const { mutate: submit, isLoading } = submitAddSenders
  const handleSubmit = addSendersForm.handleSubmit((data) => {
    submit(data)
  })

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button className="ml-auto">+ Add Sender</Button>
      </AlertDialogTrigger>
      <Form {...addSendersForm}>
        <form>
          <AlertDialogContent className="max-w-[90%] sm:max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>
                Add sender to {toCapitalCase(path)} list
              </AlertDialogTitle>
              <AlertDialogDescription>{description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AddSenderFields control={addSendersForm.control} />
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

function AddSenderFields({
  control,
}: {
  control: Control<(typeof addSendersSchema)['_input']>
}) {
  const { fields, append, remove } = useFieldArray({
    name: 'senders',
  })
  return (
    <div className="grid w-full items-center gap-4">
      {fields.map((field, index) => (
        <FormField
          key={field.id}
          control={control}
          name={`senders.${index}.value`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex items-center">
                  <Input {...field} placeholder="michael@dunder-mifflin.com" />
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
        Add another sender
      </Button>
    </div>
  )
}
