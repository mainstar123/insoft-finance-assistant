/*
  Warnings:

  - You are about to drop the column `country` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "FinancialLiteracyLevel" AS ENUM ('NO_KNOWLEDGE', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FinancialGoal" ADD VALUE 'BUY_PROPERTY';
ALTER TYPE "FinancialGoal" ADD VALUE 'START_BUSINESS';
ALTER TYPE "FinancialGoal" ADD VALUE 'EDUCATION';
ALTER TYPE "FinancialGoal" ADD VALUE 'TRAVEL';
ALTER TYPE "FinancialGoal" ADD VALUE 'VEHICLE';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "country",
ADD COLUMN     "financialKnowledge" "FinancialLiteracyLevel" NOT NULL DEFAULT 'NO_KNOWLEDGE',
ADD COLUMN     "postalCode" VARCHAR(10),
ADD COLUMN     "preferredLanguage" VARCHAR(5) DEFAULT 'pt';
