CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`reset_at` text NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_contact_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text,
	`created_by` text,
	`email` text,
	`source` text DEFAULT 'operator' NOT NULL,
	`ip_address` text,
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
INSERT INTO `__new_contact_requests`("id", "shop_id", "created_by", "subject", "message", "contact_channel", "status", "resolved_by", "resolved_at", "created_at") SELECT "id", "shop_id", "created_by", "subject", "message", "contact_channel", "status", "resolved_by", "resolved_at", "created_at" FROM `contact_requests`;--> statement-breakpoint
DROP TABLE `contact_requests`;--> statement-breakpoint
ALTER TABLE `__new_contact_requests` RENAME TO `contact_requests`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `contact_requests_status_created_idx` ON `contact_requests` (`status`,`created_at`);