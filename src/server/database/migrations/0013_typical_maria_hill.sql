DROP INDEX `user_id_status_idx` ON `screeners`;--> statement-breakpoint
ALTER TABLE `emails` MODIFY COLUMN `email_type` enum('waitlist_signup','auth_expired','auth_expiring_soon','runtime_error','screener') NOT NULL;--> statement-breakpoint
ALTER TABLE `screeners` ADD `provider` enum('resend','gmail');--> statement-breakpoint
ALTER TABLE `screeners` ADD `provider_id` varchar(255);--> statement-breakpoint
ALTER TABLE `screeners` ADD `sent_at` datetime;--> statement-breakpoint
CREATE INDEX `status_idx` ON `screeners` (`status`);--> statement-breakpoint
ALTER TABLE `screeners` DROP COLUMN `email_id`;
