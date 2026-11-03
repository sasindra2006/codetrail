CREATE TABLE `problem_submission` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`problem_slug` varchar(128) NOT NULL,
	`language` varchar(32) NOT NULL DEFAULT 'cpp17',
	`source_code` text NOT NULL,
	`status` varchar(32) NOT NULL,
	`passed_count` int NOT NULL DEFAULT 0,
	`total_count` int NOT NULL DEFAULT 0,
	`is_sample_run` boolean NOT NULL DEFAULT true,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `problem_submission_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `problem_submission` ADD CONSTRAINT `problem_submission_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `problem_submission_user_problem_idx` ON `problem_submission` (`user_id`,`problem_slug`);--> statement-breakpoint
CREATE INDEX `problem_submission_user_created_idx` ON `problem_submission` (`user_id`,`created_at`);