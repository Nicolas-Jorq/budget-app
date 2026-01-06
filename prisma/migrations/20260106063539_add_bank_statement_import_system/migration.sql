-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CREDIT_CARD', 'CHECKING', 'SAVINGS', 'INVESTMENT');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'PROCESSING', 'EXTRACTED', 'REVIEWED', 'IMPORTED', 'FAILED');

-- CreateEnum
CREATE TYPE "PendingTransactionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'IMPORTED', 'DUPLICATE');

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "lastFour" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_documents" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "bankAccountId" TEXT,
    "statementStartDate" TIMESTAMP(3),
    "statementEndDate" TIMESTAMP(3),
    "extractedData" JSONB,
    "processingError" TEXT,
    "transactionCount" INTEGER,
    "llmProvider" TEXT,
    "llmModel" TEXT,
    "processingTimeMs" INTEGER,
    "userId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pending_transactions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "originalDescription" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "suggestedCategories" JSONB,
    "confidence" DOUBLE PRECISION,
    "rawText" TEXT,
    "lineNumber" INTEGER,
    "status" "PendingTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "userCategory" TEXT,
    "userNotes" TEXT,
    "importedTransactionId" TEXT,
    "duplicateOfId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_transactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_documents" ADD CONSTRAINT "bank_documents_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_documents" ADD CONSTRAINT "bank_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_transactions" ADD CONSTRAINT "pending_transactions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "bank_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
