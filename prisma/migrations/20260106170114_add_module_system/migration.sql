-- CreateEnum
CREATE TYPE "ModuleType" AS ENUM ('FINANCE', 'HEALTH', 'TASKS', 'LIFE_GOALS');

-- CreateTable
CREATE TABLE "user_modules" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "module" "ModuleType" NOT NULL,
    "enabledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settings" JSONB,

    CONSTRAINT "user_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obsidian_syncs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vaultPath" TEXT,
    "lastExport" TIMESTAMP(3),
    "lastImport" TIMESTAMP(3),
    "syncSettings" JSONB,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "obsidian_syncs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_modules_userId_module_key" ON "user_modules"("userId", "module");

-- CreateIndex
CREATE UNIQUE INDEX "obsidian_syncs_userId_key" ON "obsidian_syncs"("userId");

-- AddForeignKey
ALTER TABLE "user_modules" ADD CONSTRAINT "user_modules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obsidian_syncs" ADD CONSTRAINT "obsidian_syncs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
