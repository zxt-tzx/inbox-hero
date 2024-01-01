// import { connect } from '@planetscale/database'
// import { desc, eq, or, sql } from 'drizzle-orm'
// import { drizzle } from 'drizzle-orm/planetscale-serverless'
// import { google } from 'googleapis'
// // import pSettle from 'p-settle'
// // import { Resend } from 'resend'
// import { Config } from 'sst/node/config'
// import { stringify } from 'superjson'

// import { authGmailClient } from '~/lib/gmail/gmail.auth'
// import { getFullFormatMessage } from '~/lib/gmail/gmail.message'
// import { setWatch, setWatchUserId, stopWatch } from '~/lib/gmail/gmail.watch'
// // import { checkEmailScreenStatus } from '~/lib/screener/screen-status'
// // import {
// //   getMessageFormatFullSchema,
// //   messagesInsertSchema,
// // } from '~/schemas/gmail.schema'
// // import { getMessageFormatFullSchema } from '~/schemas/gmail.schema'
// import { assert } from '~/server/database/client'
// import { users } from '~/server/database/model/user.model'
// import { processWebhook } from '../api/gmail-webhook'
// import { enqueueWlRecentlySentSenders } from '../gmail/sqs'

// // const RESEND_API_KEY = Config.RESEND_API_KEY
// // const resend = new Resend(RESEND_API_KEY)

// const OAuth2 = google.auth.OAuth2
// // const oauth2Client = new OAuth2(
// //   Config.GOOGLE_CLIENT_ID,
// //   Config.GOOGLE_CLIENT_SECRET,
// // )

// const dbConnection = connect({
//   url: Config.DATABASE_URL,
// })
// const db = drizzle(dbConnection)

// export async function handler() {
//   const selectedUsers = await db
//     .select()
//     .from(users)
//     .where(
//       or(
//         eq(users.email, 'email2@gmail.com'),
//         eq(users.email, 'email1@gmail.com'),
//       ),
//     )
//   for (const user of selectedUsers) {
//     await stopWatch({
//       userId: user.id,
//       db,
//       oauth2Client: new OAuth2(
//         Config.GOOGLE_CLIENT_ID,
//         Config.GOOGLE_CLIENT_SECRET,
//       ),
//     })
//     await setWatchUserId({
//       db,
//       env: 'production',
//       userId: user.id,
//       oauth2Client: new OAuth2(
// Config.GOOGLE_CLIENT_ID,
//         Config.GOOGLE_CLIENT_SECRET,
//       ),
//     })
//   }
//   // assert(user, 'user not found')
//   // const userId = user.id
//   // await enqueueWlRecentlySentSenders(userId)
//   // const {
//   //   accessToken,
//   //   accessTokenExpireAt,
//   //   gmailId,
//   //   refreshToken,
//   //   refreshTokenExpireAt,
//   //   historyId,
//   //   email,
//   // } = user
//   // const gmail = await authGmailClient({
//   //   db,
//   //   oauth2Client,
//   //   accessToken,
//   //   accessTokenExpireAt,
//   //   refreshToken,
//   //   refreshTokenExpireAt,
//   //   gmailId,
//   // })
//   // await processWebhook({
//   //   webhookHistoryId: 12918697,
//   //   userHistoryId: Number(historyId),
//   //   userId,
//   //   gmail,
//   //   db,
//   //   userEmail: email,
//   // })
// }
