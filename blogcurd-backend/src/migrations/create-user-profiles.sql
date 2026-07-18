-- 创建用户配置文件表
CREATE TABLE IF NOT EXISTS `user_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nickname` varchar(100) NULL,
  `avatar` varchar(255) NULL,
  `bio` text NULL,
  `theme_preference` enum('light', 'dark') DEFAULT 'light',
  `default_post_status` enum('draft', 'published', 'private') DEFAULT 'draft',
  `email_notification` boolean DEFAULT false,
  `last_login` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY (`user_id`),
  CONSTRAINT `FK_user_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 