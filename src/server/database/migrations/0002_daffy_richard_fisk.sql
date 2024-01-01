ALTER TABLE `users` RENAME COLUMN `oauth_expire_at` TO `watch_expire_at`;--> statement-breakpoint
ALTER TABLE `users` ADD `refresh_token` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `refresh_token_expire_at` datetime;