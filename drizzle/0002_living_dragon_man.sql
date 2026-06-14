CREATE TABLE `topup_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`payment_id` text,
	`type` text NOT NULL,
	`days_added` integer NOT NULL,
	`bonus_days_added` integer DEFAULT 0 NOT NULL,
	`amount_satang` integer DEFAULT 0 NOT NULL,
	`expiry_before_at` text,
	`expiry_after_at` text NOT NULL,
	`performed_by` text NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`performed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `topup_tx_shop_created_idx` ON `topup_transactions` (`shop_id`,`created_at`);--> statement-breakpoint
DROP INDEX "shop_categories_slug_unique";--> statement-breakpoint
DROP INDEX "shops_slug_unique";--> statement-breakpoint
DROP INDEX "shops_category_idx";--> statement-breakpoint
DROP INDEX "branches_shop_idx";--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
DROP INDEX "users_email_idx";--> statement-breakpoint
DROP INDEX "users_shop_idx";--> statement-breakpoint
DROP INDEX "users_branch_idx";--> statement-breakpoint
DROP INDEX "sessions_user_idx";--> statement-breakpoint
DROP INDEX "sessions_expires_idx";--> statement-breakpoint
DROP INDEX "customers_publicCode_unique";--> statement-breakpoint
DROP INDEX "customers_shop_idx";--> statement-breakpoint
DROP INDEX "customers_shop_phone_unique";--> statement-breakpoint
DROP INDEX "customer_devices_customer_idx";--> statement-breakpoint
DROP INDEX "bind_codes_customer_idx";--> statement-breakpoint
DROP INDEX "stamp_cards_shop_customer_unique";--> statement-breakpoint
DROP INDEX "stamp_tx_shop_customer_idx";--> statement-breakpoint
DROP INDEX "stamp_tx_card_idx";--> statement-breakpoint
DROP INDEX "stamp_tx_shop_created_idx";--> statement-breakpoint
DROP INDEX "redemptions_shop_customer_idx";--> statement-breakpoint
DROP INDEX "redemptions_shop_created_idx";--> statement-breakpoint
DROP INDEX "subscriptions_shopId_unique";--> statement-breakpoint
DROP INDEX "payments_shop_created_idx";--> statement-breakpoint
DROP INDEX "payments_status_idx";--> statement-breakpoint
DROP INDEX "topup_tx_shop_created_idx";--> statement-breakpoint
ALTER TABLE `subscriptions` ALTER COLUMN "amount_satang" TO "amount_satang" integer NOT NULL DEFAULT 0;--> statement-breakpoint
CREATE UNIQUE INDEX `shop_categories_slug_unique` ON `shop_categories` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `shops_slug_unique` ON `shops` (`slug`);--> statement-breakpoint
CREATE INDEX `shops_category_idx` ON `shops` (`category_id`);--> statement-breakpoint
CREATE INDEX `branches_shop_idx` ON `branches` (`shop_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_shop_idx` ON `users` (`shop_id`);--> statement-breakpoint
CREATE INDEX `users_branch_idx` ON `users` (`branch_id`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expires_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_publicCode_unique` ON `customers` (`public_code`);--> statement-breakpoint
CREATE INDEX `customers_shop_idx` ON `customers` (`shop_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_shop_phone_unique` ON `customers` (`shop_id`,`phone`);--> statement-breakpoint
CREATE INDEX `customer_devices_customer_idx` ON `customer_devices` (`customer_id`);--> statement-breakpoint
CREATE INDEX `bind_codes_customer_idx` ON `bind_codes` (`customer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `stamp_cards_shop_customer_unique` ON `stamp_cards` (`shop_id`,`customer_id`);--> statement-breakpoint
CREATE INDEX `stamp_tx_shop_customer_idx` ON `stamp_transactions` (`shop_id`,`customer_id`);--> statement-breakpoint
CREATE INDEX `stamp_tx_card_idx` ON `stamp_transactions` (`card_id`);--> statement-breakpoint
CREATE INDEX `stamp_tx_shop_created_idx` ON `stamp_transactions` (`shop_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `redemptions_shop_customer_idx` ON `reward_redemptions` (`shop_id`,`customer_id`);--> statement-breakpoint
CREATE INDEX `redemptions_shop_created_idx` ON `reward_redemptions` (`shop_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_shopId_unique` ON `subscriptions` (`shop_id`);--> statement-breakpoint
CREATE INDEX `payments_shop_created_idx` ON `payments` (`shop_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `payments_status_idx` ON `payments` (`status`);--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `price_per_day_satang` integer DEFAULT 1000 NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `days_to_add` integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `bonus_days` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `package_id` text;