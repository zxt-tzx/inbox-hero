import winston, { format } from 'winston'

import { env } from '~/env.mjs'

const { combine, timestamp, prettyPrint, colorize } = format

export const createBaseLogger = (path: string) => {
  const formats = [
    winston.format.json(),
    timestamp(),
    env.APP_ENV === 'development' ? prettyPrint() : undefined,
    env.APP_ENV === 'development' ? colorize() : undefined,
  ].filter((v) => !!v) as winston.Logform.Format[]

  return winston.createLogger({
    format: combine(...formats),
    exitOnError: false,
    transports: [
      new winston.transports.Console({
        silent: env.APP_ENV === 'testing',
      }),
    ],
    defaultMeta: {
      path,
    },
  })
}
