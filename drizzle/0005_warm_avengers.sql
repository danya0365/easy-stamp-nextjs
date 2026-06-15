CREATE TABLE `stamp_types` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`name` text NOT NULL,
	`threshold` integer DEFAULT 10 NOT NULL,
	`reward_text` text DEFAULT '' NOT NULL,
	`price_satang` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `stamp_types_shop_idx` ON `stamp_types` (`shop_id`);--> statement-breakpoint
CREATE TABLE `stamp_balances` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`stamp_type_id` text NOT NULL,
	`current_stamps` integer DEFAULT 0 NOT NULL,
	`lifetime_stamps` integer DEFAULT 0 NOT NULL,
	`rewards_earned` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `stamp_cards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stamp_type_id`) REFERENCES `stamp_types`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stamp_balances_card_type_unique` ON `stamp_balances` (`card_id`,`stamp_type_id`);--> statement-breakpoint
ALTER TABLE `stamp_transactions` ADD `stamp_type_id` text REFERENCES stamp_types(id);--> statement-breakpoint
ALTER TABLE `reward_redemptions` ADD `stamp_type_id` text REFERENCES stamp_types(id);--> statement-breakpoint
INSERT INTO `stamp_types` (`id`, `shop_id`, `name`, `threshold`, `reward_text`, `price_satang`, `is_active`, `is_default`, `sort_order`, `created_at`, `updated_at`)
SELECT lower(hex(randomblob(16))), s.`id`, 'แสตมป์', s.`stamp_threshold`, s.`reward_text`, NULL, 1, 1, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')
FROM `shops` s
WHERE NOT EXISTS (SELECT 1 FROM `stamp_types` t WHERE t.`shop_id` = s.`id` AND t.`is_default` = 1);--> statement-breakpoint
INSERT INTO `stamp_balances` (`id`, `card_id`, `stamp_type_id`, `current_stamps`, `lifetime_stamps`, `rewards_earned`, `updated_at`)
SELECT lower(hex(randomblob(16))), c.`id`, t.`id`, c.`current_stamps`, c.`lifetime_stamps`, c.`rewards_earned`, strftime('%Y-%m-%dT%H:%M:%fZ','now')
FROM `stamp_cards` c
JOIN `stamp_types` t ON t.`shop_id` = c.`shop_id` AND t.`is_default` = 1
WHERE NOT EXISTS (SELECT 1 FROM `stamp_balances` b WHERE b.`card_id` = c.`id` AND b.`stamp_type_id` = t.`id`);--> statement-breakpoint
UPDATE `stamp_transactions` SET `stamp_type_id` = (SELECT t.`id` FROM `stamp_types` t WHERE t.`shop_id` = `stamp_transactions`.`shop_id` AND t.`is_default` = 1) WHERE `stamp_type_id` IS NULL;--> statement-breakpoint
UPDATE `reward_redemptions` SET `stamp_type_id` = (SELECT t.`id` FROM `stamp_types` t WHERE t.`shop_id` = `reward_redemptions`.`shop_id` AND t.`is_default` = 1) WHERE `stamp_type_id` IS NULL;