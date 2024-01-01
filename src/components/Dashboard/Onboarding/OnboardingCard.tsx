import { useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
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
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Form } from '~/components/ui/form'
import { toast } from '~/components/ui/use-toast'
import { useZodForm } from '~/lib/form'
import { formatDailyScreenerTime } from '~/lib/time/screener.utils'
import { trpc } from '~/lib/trpc'
import { onboardingFormSchema } from '~/schemas/screener.schema'
import { useSchedule } from '../Schedule/ScheduleProvider'
import { OnboardingForm } from './OnboardingForm'

export function OnboardingCard() {
  const {
    dailyScreenerInfo: { dailyScreenerTime },
  } = useSchedule()

  const utils = trpc.useContext()
  const { mutate: skip } = trpc.screener.onboarding.skip.useMutation({
    onSuccess: () => {
      toast({
        title: 'Skipped whitelisting!',
        description:
          'If you change your mind, drop us an email at help@inboxhero.org!',
        duration: 5000,
      })
      void utils.screener.schedule.get.invalidate()
    },
  })

  const [showForm, setShowForm] = useState(false)
  const onboardingForm = useZodForm({
    schema: onboardingFormSchema,
    defaultValues: {
      whitelistedDomains: [{ value: '' }],
      whitelistRecentSenders: true,
    },
  })
  const submitOnboardingForm = trpc.screener.onboarding.submit.useMutation({
    onSuccess: () => {
      toast({
        title: 'Submitted successfully!',
        description:
          'Your whitelist preferences have been saved. Whitelisting recent senders may take a while to complete.',
        duration: 5000,
      })
      void utils.screener.schedule.get.invalidate()
    },
  })
  const { mutate: submit, isLoading } = submitOnboardingForm
  const handleSubmit = onboardingForm.handleSubmit((data) => {
    submit(data)
  })
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle className="flex items-center justify-center">
            Whitelist frequent senders? (optional)
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>You have successfully activated Inbox Hero!</CardContent>
      <CardContent>
        From now, emails from senders that have not been whitelisted by Inbox
        Hero will be moved out of your inbox.{' '}
        {dailyScreenerTime &&
          `You will receive a daily email at
        ${formatDailyScreenerTime(dailyScreenerTime)} to screen these senders.`}
      </CardContent>
      <CardContent>
        To help Inbox Hero learn which emails should reach you promptly, you can
        do a one-time setup to whitelist:
        <li>
          all senders whose emails <mark>you have read in the last 7 days</mark>
          ;
        </li>
        <li>
          all emails sent from <mark>specific domains</mark>.
        </li>
      </CardContent>
      <CardContent>
        This step is optional! You can skip this and wait for the daily email
        from Inbox Hero to screen these senders.
      </CardContent>
      <Form {...onboardingForm}>
        <form onSubmit={handleSubmit}>
          {showForm && <OnboardingForm control={onboardingForm.control} />}
          <CardFooter className="flex justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">Skip</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Skip whitelisting?</AlertDialogTitle>
                  <AlertDialogDescription className="text-left">
                    If you choose to skip, you will not see this screen again.
                    You can always manually whitelist senders and domains later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => skip()}>
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>Proceed</Button>
            )}
            {showForm && (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Submit'}
              </Button>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
