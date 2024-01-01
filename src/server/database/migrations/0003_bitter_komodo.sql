ALTER TABLE `users` ADD `access_token` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `access_token_expire_at` datetime;--> statement-breakpoint
CREATE INDEX `watch_expire_at_idx` ON `users` (`watch_expire_at`);--> statement-breakpoint
CREATE INDEX `refresh_token_expire_at_idx` ON `users` (`refresh_token_expire_at`);
