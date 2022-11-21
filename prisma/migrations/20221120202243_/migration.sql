/*
  Warnings:

  - You are about to drop the column `balance` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `requests` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `services` table. All the data in the column will be lost.
  - Added the required column `code` to the `services` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `services` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `services` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceperUnit` to the `services` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `services` DROP COLUMN `balance`,
    DROP COLUMN `requests`,
    DROP COLUMN `updated_at`,
    DROP COLUMN `user_id`,
    ADD COLUMN `code` VARCHAR(191) NOT NULL,
    ADD COLUMN `description` VARCHAR(191) NOT NULL,
    ADD COLUMN `price` DOUBLE NOT NULL,
    ADD COLUMN `priceperUnit` DOUBLE NOT NULL,
    ADD COLUMN `status` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `status` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `servicesId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_servicesId_fkey` FOREIGN KEY (`servicesId`) REFERENCES `services`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
