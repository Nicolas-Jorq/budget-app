-- CreateTable
CREATE TABLE "house_goals" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "targetPrice" DECIMAL(12,2) NOT NULL,
    "targetLocation" TEXT,
    "targetBedrooms" INTEGER,
    "targetBathrooms" DOUBLE PRECISION,
    "downPaymentPct" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "propertyType" TEXT,
    "savedSearches" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "house_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_snapshots" (
    "id" TEXT NOT NULL,
    "houseGoalId" TEXT NOT NULL,
    "zpid" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "bedrooms" INTEGER,
    "bathrooms" DOUBLE PRECISION,
    "sqft" INTEGER,
    "yearBuilt" INTEGER,
    "propertyType" TEXT,
    "zestimate" DECIMAL(12,2),
    "imageUrl" TEXT,
    "listingUrl" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "house_goals_goalId_key" ON "house_goals"("goalId");

-- AddForeignKey
ALTER TABLE "house_goals" ADD CONSTRAINT "house_goals_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "savings_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_snapshots" ADD CONSTRAINT "property_snapshots_houseGoalId_fkey" FOREIGN KEY ("houseGoalId") REFERENCES "house_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
