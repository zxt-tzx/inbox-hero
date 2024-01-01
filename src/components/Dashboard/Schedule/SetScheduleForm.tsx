import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Form, FormField, FormItem } from '~/components/ui/form'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { useToast } from '~/components/ui/use-toast'
import { useZodForm } from '~/lib/form'
import {
  formatScheduledAt,
  getNextScreenerTimings,
} from '~/lib/time/screener.utils'
import { trpc } from '~/lib/trpc'
import { setScheduleSchema } from '~/schemas/screener.schema'
import { useSchedule } from './ScheduleProvider'

export function SetScheduleForm() {
  const { userTimezone, timezoneOptions, timeOptions, defaultScreenerTime } =
    useSchedule()
  const form = useZodForm({
    schema: setScheduleSchema,
    defaultValues: {
      timezone: userTimezone,
      dailyScreenerTime: defaultScreenerTime,
    },
  })
  const utils = trpc.useContext()
  const [tzVal, dstVal] = form.watch(['timezone', 'dailyScreenerTime'])
  const { toast } = useToast()
  const { scheduledAt } = getNextScreenerTimings(
    dstVal ?? defaultScreenerTime,
    tzVal ?? userTimezone,
  )
  const formattedScheduledAt = formatScheduledAt(
    scheduledAt.toDate(),
    dstVal ?? defaultScreenerTime,
    tzVal ?? userTimezone,
  )
  const submitSetSchedule = trpc.screener.schedule.set.useMutation({
    onSuccess: () => {
      toast({
        title: 'Schedule set successfully!',
        description: `You will receive your screener on at ${formattedScheduledAt}`,
        duration: 5000,
      })
      void utils.screener.schedule.get.invalidate()
    },
  })
  const { mutate: setSchedule, status } = submitSetSchedule
  const isLoading = status === 'loading'
  const handleSubmit = form.handleSubmit((data) => setSchedule(data))
  return (
    <Card>
      <Form {...form}>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Set schedule</CardTitle>
            <CardDescription className="pt-2">
              Each day, if you receive emails from first-time senders, these
              emails will be removed from your inbox. You can screen these
              senders via a daily email from Inbox Hero?
            </CardDescription>
            <CardDescription>
              When would you like to receive this screening email?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="timezone">Your timezone</Label>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value ?? userTimezone}
                      >
                        <SelectTrigger id="timezone">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="item-aligned">
                          {timezoneOptions.map((option) => {
                            return (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dailyScreenerTime"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="dailyScreenerTime">Scheduled time</Label>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value ?? defaultScreenerTime}
                      >
                        <SelectTrigger id="dailyScreenerTime">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent position="item-aligned">
                          {timeOptions.map((option) => {
                            return (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            <CardDescription className="pt-4">
              Based on the selection, you will receive your screener at:
            </CardDescription>
            <p>{formattedScheduledAt}</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button className="mx-auto" type="submit" disabled={isLoading}>
              {isLoading ? 'Submitting' : 'Confirm'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
