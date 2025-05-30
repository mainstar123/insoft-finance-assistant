/*
  Warnings:

  - You are about to drop the column `financialChallenge` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `primaryFinancialGoal` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "financialChallenge",
DROP COLUMN "primaryFinancialGoal";
