/*
  Warnings:

  - You are about to drop the `account` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `balance` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requests` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `account` DROP FOREIGN KEY `account_user_id_fkey`;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `balance` DOUBLE NOT NULL,
    ADD COLUMN `requests` INTEGER NOT NULL;

-- DropTable
DROP TABLE `account`;

-- CreateTable
CREATE TABLE `services` (
    `id` VARCHAR(191) NOT NULL,
    `balance` DOUBLE NOT NULL,
    `requests` INTEGER NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
