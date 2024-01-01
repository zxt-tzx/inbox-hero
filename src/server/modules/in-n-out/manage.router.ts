import { and, eq, sql } from 'drizzle-orm'

import {
  addDomainsSchema,
  listByScreenStatusSchema,
  manageDomainsSchema,
} from '~/schemas/domain.schema'
import { addSendersSchema, manageSendersSchema } from '~/schemas/sender.schema'
import { domains as domainModel } from '~/server/database/model/domain.model'
import { senders as senderModel } from '~/server/database/model/sender.model'
import { protectedProcedure, router } from '~/server/trpc'
import { enqueueMoveTrashedEmailsToInbox } from '~/serverless/gmail/sqs'

export const manageRouter = router({
  listByScreenStatus: protectedProcedure
    .input(listByScreenStatusSchema)
    .query(async ({ ctx, input: { screenStatus } }) => {
      const domains = (
        await ctx.db
          .select({
            id: domainModel.id,
            domain: domainModel.domain,
            screenStatus: domainModel.screenStatus,
            updatedAt: domainModel.updatedAt,
          })
          .from(domainModel)
          .where(
            and(
              eq(domainModel.userId, ctx.session.user.id),
              eq(domainModel.screenStatus, screenStatus),
            ),
          )
      )
        // sort by most recent first
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      const senders = (
        await ctx.db
          .select()
          .from(senderModel)
          .where(
            and(
              eq(senderModel.userId, ctx.session.user.id),
              eq(senderModel.screenStatus, screenStatus),
            ),
          )
      )
        // sort by most recent first
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      return {
        domains,
        senders,
      }
    }),
  updateDomains: protectedProcedure.input(manageDomainsSchema).mutation(
    async ({
      ctx,
      input: {
        domainsDecision: { inDomains, outDomains, neitherDomains },
      },
    }) => {
      await ctx.db.transaction(async (tx) => {
        if (inDomains.length > 0) {
          await tx
            .update(domainModel)
            .set({ screenStatus: 'in', updatedAt: new Date() })
            .where(
              and(
                eq(domainModel.userId, ctx.session.user.id),
                sql`${domainModel.domain} IN ${inDomains}`,
              ),
            )
        }
        if (outDomains.length > 0) {
          await tx
            .update(domainModel)
            .set({ screenStatus: 'out', updatedAt: new Date() })
            .where(
              and(
                eq(domainModel.userId, ctx.session.user.id),
                sql`${domainModel.domain} IN ${outDomains}`,
              ),
            )
        }
        if (neitherDomains.length > 0) {
          await tx
            .delete(domainModel)
            .where(
              and(
                eq(domainModel.userId, ctx.session.user.id),
                sql`${domainModel.domain} IN ${neitherDomains}`,
              ),
            )
        }
      })
    },
  ),
  updateSenders: protectedProcedure.input(manageSendersSchema).mutation(
    async ({
      ctx,
      input: {
        sendersDecision: { inSenders, outSenders, neitherSenders },
      },
    }) => {
      await ctx.db.transaction(async (tx) => {
        if (inSenders.length > 0) {
          await Promise.all([
            tx
              .update(senderModel)
              .set({ screenStatus: 'in', updatedAt: new Date() })
              .where(
                and(
                  eq(senderModel.userId, ctx.session.user.id),
                  sql`${senderModel.email} IN ${inSenders}`,
                ),
              ),
            enqueueMoveTrashedEmailsToInbox({
              userId: ctx.session.user.id,
              senders: inSenders,
            }),
          ])
        }
        if (outSenders.length > 0) {
          await tx
            .update(senderModel)
            .set({ screenStatus: 'out', updatedAt: new Date() })
            .where(
              and(
                eq(senderModel.userId, ctx.session.user.id),
                sql`${senderModel.email} IN ${outSenders}`,
              ),
            )
        }
        if (neitherSenders.length > 0) {
          await tx
            .delete(senderModel)
            .where(
              and(
                eq(senderModel.userId, ctx.session.user.id),
                sql`${senderModel.email} IN ${neitherSenders}`,
              ),
            )
        }
      })
    },
  ),
  addDomains: protectedProcedure
    .input(addDomainsSchema)
    .mutation(async ({ ctx, input: { domainScreenStatus, domains } }) => {
      await ctx.db
        .insert(domainModel)
        .values(
          domains.map(({ value }) => ({
            userId: ctx.session.user.id,
            domain: value.toLowerCase(),
            screenStatus: domainScreenStatus,
          })),
        )
        .onDuplicateKeyUpdate({
          set: {
            screenStatus: domainScreenStatus,
          },
        })
    }),
  addSenders: protectedProcedure
    .input(addSendersSchema)
    .mutation(async ({ ctx, input: { senderScreenStatus, senders } }) => {
      await ctx.db
        .insert(senderModel)
        .values(
          senders.map(({ value }) => ({
            userId: ctx.session.user.id,
            email: value.toLowerCase(),
            screenStatus: senderScreenStatus,
            fromName: null,
          })),
        )
        .onDuplicateKeyUpdate({
          set: {
            screenStatus: senderScreenStatus,
          },
        })
    }),
})
