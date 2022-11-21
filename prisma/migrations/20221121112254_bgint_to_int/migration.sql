-- AlterTable
ALTER TABLE `services` MODIFY `status` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `users` MODIFY `userId` BIGINT NULL;
