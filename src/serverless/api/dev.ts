// import { connect } from '@planetscale/database'
// import {
//   type APIGatewayProxyEvent,
//   type APIGatewayProxyResult,
// } from 'aws-lambda'
// import { drizzle } from 'drizzle-orm/planetscale-serverless'
// import { google } from 'googleapis'
// import { Config } from 'sst/node/config'

// const OAuth2 = google.auth.OAuth2
// const oauth2Client = new OAuth2(
//   Config.GOOGLE_CLIENT_ID,
//   Config.GOOGLE_CLIENT_SECRET,
// )

// const dbConnection = connect({
//   url: Config.DATABASE_URL,
// })
// const db = drizzle(dbConnection)

// export const handler = (event: APIGatewayProxyEvent): APIGatewayProxyResult => {
//   try {
//     console.log('event', event)
//     return {
//       statusCode: 200,
//       body: JSON.stringify({
//         message: 'hello world',
//       }),
//     }
//   } catch (err) {
//     console.log(err)
//     return {
//       statusCode: 500,
//       body: JSON.stringify({
//         message: 'some error happened',
//       }),
//     }
//   }
// }
