-- 创建留言墙表
CREATE TABLE IF NOT EXISTS `guestbook_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `content` text NOT NULL,
  `visitor_name` varchar(100) NOT NULL,
  `user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `FK_guestbook_user` (`user_id`),
  CONSTRAINT `FK_guestbook_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入一些示例留言数据
INSERT INTO `guestbook_messages` (`content`, `visitor_name`, `user_id`, `created_at`) VALUES
('博客内容很棒，继续加油！', '访客1', 1, DATE_SUB(NOW(), INTERVAL 3 DAY)),
('我很喜欢你分享的技术文章，对我帮助很大。', '技术爱好者', 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('期待你的更多博客更新！', '忠实读者', 1, DATE_SUB(NOW(), INTERVAL 12 HOUR)); 