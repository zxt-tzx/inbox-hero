ALTER TABLE `waitlist` MODIFY COLUMN `sent_welcome_email` boolean NOT NULL;--> statement-breakpoint
ALTER TABLE `waitlist` MODIFY COLUMN `sent_welcome_email` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `waitlist` MODIFY COLUMN `whitelisted` boolean NOT NULL;--> statement-breakpoint
ALTER TABLE `waitlist` MODIFY COLUMN `whitelisted` boolean NOT NULL DEFAULT false;