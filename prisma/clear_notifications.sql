-- Drop foreign key constraints first
SET FOREIGN_KEY_CHECKS = 0;
-- Drop notifications table
DROP TABLE IF EXISTS Notification;
-- Reset foreign key checks
SET FOREIGN_KEY_CHECKS = 1;