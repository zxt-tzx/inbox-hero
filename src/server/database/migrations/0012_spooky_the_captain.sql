CREATE TABLE `limbo_emails` (
	`id` varchar(26) NOT NULL,
	`user_id` varchar(26) NOT NULL,
	`email` varchar(255) NOT NULL,
	`message_id` varchar(255) NOT NULL,
	`thread_id` varchar(255) NOT NULL,
	`from_name` varchar(255),
	`subject` varchar(255) NOT NULL,
	`body` text,
	`snippet` text,
	`email_date` datetime NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `limbo_emails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `user_id_email_idx` ON `limbo_emails` (`user_id`,`email`);
