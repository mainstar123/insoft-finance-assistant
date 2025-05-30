-- CreateEnum
CREATE TYPE "FinancialGoal" AS ENUM ('SAVE_MONEY', 'TRACK_EXPENSES', 'PAY_DEBT', 'BUILD_EMERGENCY_FUND', 'PLAN_RETIREMENT', 'INVEST');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "financialChallenge" VARCHAR(255),
ADD COLUMN     "primaryFinancialGoal" "FinancialGoal";
