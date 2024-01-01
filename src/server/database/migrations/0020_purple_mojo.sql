CREATE INDEX `user_id_status_index` ON `domains` (`user_id`,`screen_status`);--> statement-breakpoint
CREATE INDEX `user_id_status_index` ON `senders` (`user_id`,`screen_status`);