CREATE TABLE `screeners` (
	`id` varchar(26) NOT NULL,
	`user_id` varchar(26) NOT NULL,
	`email_id` varchar(26),
	`status` enum('scheduled','enqueued','sent','delivered') NOT NULL DEFAULT 'scheduled',
	`scheduled_at` datetime NOT NULL,
	`expire_at` datetime NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `screeners_id` PRIMARY KEY(`id`)
);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `id` varchar(26) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `timezone` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `daily_screener_time` varchar(5);--> statement-breakpoint
ALTER TABLE `users` ADD `is_daily_screener_on` boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `user_id_status_idx` ON `screeners` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `provider_id_idx` ON `emails` (`provider`,`provider_id`);
