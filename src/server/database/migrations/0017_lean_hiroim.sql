ALTER TABLE `emails` MODIFY COLUMN `email_type` enum('waitlist_signup','auth_expired','auth_expiring_soon','runtime_error','screener','successful_activation') NOT NULL;
