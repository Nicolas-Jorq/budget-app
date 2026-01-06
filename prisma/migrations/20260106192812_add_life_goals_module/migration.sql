-- CreateEnum
CREATE TYPE "LifeGoalCategory" AS ENUM ('CAREER', 'PERSONAL', 'TRAVEL', 'LEARNING', 'RELATIONSHIPS', 'HEALTH', 'CREATIVE', 'ADVENTURE', 'OTHER');

-- CreateEnum
CREATE TYPE "LifeGoalStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'ABANDONED');

-- CreateTable
CREATE TABLE "life_goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "LifeGoalCategory" NOT NULL,
    "status" "LifeGoalStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "targetDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 2,
    "imageUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "life_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "life_milestones" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "targetDate" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "life_milestones_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "life_goals" ADD CONSTRAINT "life_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "life_milestones" ADD CONSTRAINT "life_milestones_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "life_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
