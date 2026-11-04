CREATE TABLE `tutor_conversation` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`title` varchar(120) NOT NULL DEFAULT 'New conversation',
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tutor_conversation_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tutor_daily_usage` (
	`user_id` varchar(36) NOT NULL,
	`period_date` date NOT NULL,
	`request_count` int NOT NULL DEFAULT 0,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tutor_daily_usage_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `tutor_message` (
	`id` varchar(36) NOT NULL,
	`conversation_id` varchar(36) NOT NULL,
	`role` varchar(16) NOT NULL,
	`content` text NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'complete',
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `tutor_message_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_preference` ADD `ai_tutor_consent_at` timestamp(3);--> statement-breakpoint
ALTER TABLE `tutor_conversation` ADD CONSTRAINT `tutor_conversation_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tutor_daily_usage` ADD CONSTRAINT `tutor_daily_usage_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tutor_message` ADD CONSTRAINT `tutor_message_conversation_id_tutor_conversation_id_fk` FOREIGN KEY (`conversation_id`) REFERENCES `tutor_conversation`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `tutor_conversation_user_updated_idx` ON `tutor_conversation` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `tutor_message_conversation_created_idx` ON `tutor_message` (`conversation_id`,`created_at`);
