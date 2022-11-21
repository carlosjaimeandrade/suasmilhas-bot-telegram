/*
  Warnings:

  - You are about to drop the column `code` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `userID` on the `users` table. All the data in the column will be lost.
  - Added the required column `first_name` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `code`,
    DROP COLUMN `name`,
    DROP COLUMN `userID`,
    ADD COLUMN `first_name` VARCHAR(191) NOT NULL,
    ADD COLUMN `is_Vip` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_bot` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `language` VARCHAR(191) NULL,
    ADD COLUMN `userId` INTEGER NOT NULL,
    MODIFY `username` VARCHAR(191) NULL;
