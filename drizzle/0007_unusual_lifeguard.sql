ALTER TABLE `users` ADD `login_otp_hash` text;--> statement-breakpoint
ALTER TABLE `users` ADD `login_otp_expires_at` text;--> statement-breakpoint
ALTER TABLE `users` ADD `login_otp_attempts` integer DEFAULT 0 NOT NULL;