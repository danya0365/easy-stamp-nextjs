CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`link_url` text,
	`is_read` integer DEFAULT false NOT NULL,
	`read_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_user_read_idx` ON `notifications` (`user_id`,`is_read`);--> statement-breakpoint
CREATE INDEX `notifications_user_created_idx` ON `notifications` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `contact_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`created_by` text NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`contact_channel` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`resolved_by` text,
	`resolved_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `contact_requests_status_created_idx` ON `contact_requests` (`status`,`created_at`);--> statement-breakpoint
ALTER TABLE `users` ADD `line_user_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `line_link_code` text;--> statement-breakpoint
CREATE UNIQUE INDEX `users_lineUserId_unique` ON `users` (`line_user_id`);--> statement-breakpoint
CREATE INDEX `users_line_link_code_idx` ON `users` (`line_link_code`);