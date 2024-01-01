CREATE TABLE `emails` (
	`id` varchar(26) NOT NULL,
	`email_type` enum('waitlistSignup') NOT NULL,
	`from` varchar(255) NOT NULL,
	`to` varchar(255) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`cc_bcc` json,
	`reply_to` varchar(255),
	`body` text NOT NULL,
	`provider` enum('resend','gmail') NOT NULL,
	`provider_id` varchar(255) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(15) NOT NULL,
	`email` varchar(255) NOT NULL,
	`gmail_id` varchar(255),
	`gmail_user_metadata` json,
	`gmail_scopes` json,
	`oauth_expire_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_gmail_id_unique` UNIQUE(`gmail_id`)
);
--> statement-breakpoint
CREATE TABLE `waitlist` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_provider` enum('gmail_personal','gmail_workspace','outlook_personal','outlook_work','apple','yahoo','other') NOT NULL,
	`other_email_provider` varchar(255),
	`sent_welcome_email` enum('yes','no') NOT NULL DEFAULT 'no',
	`whitelisted` enum('yes','no','account_created') NOT NULL DEFAULT 'no',
	`comments` varchar(1000),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `waitlist_id` PRIMARY KEY(`id`),
	CONSTRAINT `waitlist_email_unique` UNIQUE(`email`)
);
