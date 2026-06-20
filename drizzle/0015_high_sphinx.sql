ALTER TABLE `users` ADD `totp_secret` text;--> statement-breakpoint
ALTER TABLE `users` ADD `totp_confirmed_at` text;--> statement-breakpoint
ALTER TABLE `users` ADD `totp_recovery_codes` text;