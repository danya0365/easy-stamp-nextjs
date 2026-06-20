CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text,
	`actor_role` text,
	`action` text NOT NULL,
	`target_type` text,
	`target_id` text,
	`shop_id` text,
	`ip` text,
	`user_agent` text,
	`metadata` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_shop_created_idx` ON `audit_logs` (`shop_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_actor_created_idx` ON `audit_logs` (`actor_user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_action_created_idx` ON `audit_logs` (`action`,`created_at`);