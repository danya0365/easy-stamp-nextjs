DROP INDEX `payments_status_idx`;--> statement-breakpoint
CREATE INDEX `payments_status_created_idx` ON `payments` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `customers_shop_created_idx` ON `customers` (`shop_id`,`created_at`);