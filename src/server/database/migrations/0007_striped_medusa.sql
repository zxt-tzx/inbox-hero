CREATE TABLE `domains` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` varchar(26) NOT NULL,
	`domain` varchar(255) NOT NULL,
	`screen_status` enum('in','out') NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `domains_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_id_domain_unique` UNIQUE(`user_id`,`domain`)
);
--> statement-breakpoint
CREATE TABLE `senders` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` varchar(26) NOT NULL,
	`email` varchar(255) NOT NULL,
	`screen_status` enum('in','out') NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `senders_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_id_email_unique` UNIQUE(`user_id`,`email`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `has_completed_onboarding` boolean DEFAULT false NOT NULL;
