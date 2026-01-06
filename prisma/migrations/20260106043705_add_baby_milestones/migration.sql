-- CreateEnum
CREATE TYPE "MilestoneCategory" AS ENUM ('PRE_BIRTH', 'NURSERY', 'GEAR', 'FIRST_YEAR', 'CHILDCARE', 'HEALTHCARE', 'EDUCATION');

-- CreateTable
CREATE TABLE "baby_milestones" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "MilestoneCategory" NOT NULL,
    "targetAmount" DECIMAL(10,2) NOT NULL,
    "currentAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "dueMonth" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "baby_milestones_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "baby_milestones" ADD CONSTRAINT "baby_milestones_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "savings_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
