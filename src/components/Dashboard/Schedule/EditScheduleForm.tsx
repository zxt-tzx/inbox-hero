import { PencilSquareIcon } from '@heroicons/react/20/solid'

import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '~/components/ui/form'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Switch } from '~/components/ui/switch'
import { toast } from '~/components/ui/use-toast'
import { useZodForm } from '~/lib/form'
import {
  formatScheduledAt,
  getNextScreenerTimings,
} from '~/lib/time/screener.utils'
import { trpc } from '~/lib/trpc'
import {
  setScheduleSchema,
  toggleScheduleSchema,
} from '~/schemas/screener.schema'
import { useSchedule } from './ScheduleProvider'

export function EditScheduleForm() {
  const {
    isEditingForm,
    setIsEditingForm,
    timezoneOptions,
    timeOptions,
    dailyScreenerInfo,
    userTimezone,
    defaultScreenerTime,
  } = useSchedule()
  const {
    dailyScreenerTime: prevDst,
    timezone: prevTz,
    isDailyScreenerOn,
    nextScreenerScheduledAt,
  } = dailyScreenerInfo
  // setting schedule
  const setScheduleForm = useZodForm({
    schema: setScheduleSchema,
    defaultValues: {
      timezone: prevTz,
      dailyScreenerTime: prevDst,
    },
  })
  const [tzVal, dstVal] = setScheduleForm.watch([
    'timezone',
    'dailyScreenerTime',
  ])
  const utils = trpc.useContext()
  const submitSetSchedule = trpc.screener.schedule.set.useMutation({
    onSuccess: () => {
      toast({
        title: 'Schedule edited successfully!',
        description: `You will receive your next screener on at ${formattedSelectedScheduledAt}`,
        duration: 5000,
      })
      setIsEditingForm(false)
      void utils.screener.schedule.get.invalidate()
    },
  })
  const { mutate: setSchedule, status: setScheduleStatus } = submitSetSchedule
  const setScheduleHandleSubmit = setScheduleForm.handleSubmit((data) =>
    setSchedule(data),
  )
  const isLoading = setScheduleStatus === 'loading'
  const { scheduledAt } = getNextScreenerTimings(
    dstVal ?? prevDst,
    tzVal ?? prevTz,
  )
  const formattedSelectedScheduledAt = formatScheduledAt(
    scheduledAt.toDate(),
    dstVal ?? defaultScreenerTime,
    tzVal ?? userTimezone,
  )

  // toggling schedule
  const toggleScheduledForm = useZodForm({
    schema: toggleScheduleSchema,
    defaultValues: {
      turnOnDailyScreener: isDailyScreenerOn,
    },
  })
  const submitToggleSchedule = trpc.screener.schedule.toggle.useMutation({
    onSuccess: (data) => {
      const { dailyScreenerOn } = data
      toast({
        title: 'Toggled schedule',
        description: `You have successfully turned ${
          dailyScreenerOn ? 'on' : 'off'
        } your daily screener.${
          dailyScreenerOn
            ? ''
            : ' Any emails that are pending screening will be moved to your inbox.'
        }`,
        duration: 3000,
      })
      void utils.screener.schedule.get.invalidate()
    },
  })
  const { mutate: toggleSchedule, status: toggleScheduleStatus } =
    submitToggleSchedule
  const toggleScheduleHandleSubmit = toggleScheduledForm.handleSubmit((data) =>
    toggleSchedule(data),
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle className="flex items-center justify-center py-2">
            {isEditingForm ? 'Edit Schedule' : 'Current Schedule'}
          </CardTitle>
        </div>
        {isEditingForm && (
          <CardDescription className="pt-2">
            Edit your schedule to receive your screener at a different time.
          </CardDescription>
        )}
        {!isEditingForm && isDailyScreenerOn && (
          <>
            <CardDescription className="pt-2">
              You have set your schedule and you will receive your next screener
              at:
            </CardDescription>
            <p>
              {formatScheduledAt(
                nextScreenerScheduledAt,
                dstVal ?? defaultScreenerTime,
                tzVal ?? userTimezone,
              )}
            </p>
          </>
        )}
        {!isEditingForm && !isDailyScreenerOn && (
          <CardDescription className="pt-2">
            You have switched off your daily screener and will not receive any
            screener emails.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-3">
        <Form {...toggleScheduledForm}>
          <form onChange={toggleScheduleHandleSubmit}>
            <FormField
              control={toggleScheduledForm.control}
              name="turnOnDailyScreener"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Toggle schedule</FormLabel>
                    <FormDescription>
                      Your daily screener is switched{' '}
                      {isDailyScreenerOn ? 'on' : 'off'}.
                      {isDailyScreenerOn &&
                        ' If you switch this off, any emails that are pending screening will be moved to your inbox. This cannot be undone.'}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      disabled={toggleScheduleStatus === 'loading'}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <Form {...setScheduleForm}>
        <form onSubmit={setScheduleHandleSubmit}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <FormField
                control={setScheduleForm.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex flex-col space-y-1.5">
                      <div className="flex flex-row items-center justify-between">
                        <Label htmlFor="timezone" className="text-base">
                          {isDailyScreenerOn
                            ? 'Your timezone'
                            : 'Previously set timezone'}
                        </Label>
                        {!isEditingForm && (
                          <Button
                            variant="secondary"
                            onClick={() => setIsEditingForm(true)}
                          >
                            <PencilSquareIcon
                              className="-ml-1.5 h-5 w-6 pr-2"
                              aria-hidden="true"
                            />
                            Edit
                          </Button>
                        )}
                      </div>
                      <Select
                        value={tzVal ?? userTimezone}
                        onValueChange={field.onChange}
                        defaultValue={field.value ?? userTimezone}
                        disabled={!isEditingForm}
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
                control={setScheduleForm.control}
                name="dailyScreenerTime"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="dailyScreenerTime" className="text-base">
                        {isDailyScreenerOn
                          ? 'Scheduled time'
                          : 'Previously scheduled time'}
                      </Label>
                      <Select
                        value={dstVal ?? defaultScreenerTime}
                        onValueChange={field.onChange}
                        defaultValue={field.value ?? defaultScreenerTime}
                        disabled={!isEditingForm}
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
            {isEditingForm && (
              <>
                <CardDescription className="pt-4">
                  Based on the selection, you will receive your screener at:
                </CardDescription>
                <p>{formattedSelectedScheduledAt}</p>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            {isEditingForm && (
              <div>
                <Button
                  variant="outline"
                  className="mx-2"
                  onClick={() => {
                    setIsEditingForm(false)
                    setScheduleForm.setValue('timezone', prevTz)
                    setScheduleForm.setValue('dailyScreenerTime', prevDst)
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="ml-2" disabled={isLoading}>
                  {isLoading ? 'Submitting' : 'Confirm'}
                </Button>
              </div>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
