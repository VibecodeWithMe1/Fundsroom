-- CreateTable
CREATE TABLE "LeadStageHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "oldStage" TEXT NOT NULL,
    "newStage" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadStageHistory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeadStageHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerName" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "gstNumber" TEXT,
    "customerType" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LEAD',
    "leadStage" TEXT NOT NULL DEFAULT 'LEAD',
    "followUpDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Customer" ("address", "businessName", "createdAt", "customerName", "customerType", "email", "followUpDate", "gstNumber", "id", "mobileNumber", "status", "updatedAt") SELECT "address", "businessName", "createdAt", "customerName", "customerType", "email", "followUpDate", "gstNumber", "id", "mobileNumber", "status", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE UNIQUE INDEX "Customer_mobileNumber_key" ON "Customer"("mobileNumber");
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");
CREATE INDEX "Customer_mobileNumber_idx" ON "Customer"("mobileNumber");
CREATE INDEX "Customer_email_idx" ON "Customer"("email");
CREATE TABLE "new_FollowUp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "followUpDate" DATETIME NOT NULL,
    "contactMethod" TEXT NOT NULL DEFAULT 'CALL',
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FollowUp_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FollowUp_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FollowUp" ("createdAt", "createdBy", "customerId", "followUpDate", "id", "notes") SELECT "createdAt", "createdBy", "customerId", "followUpDate", "id", "notes" FROM "FollowUp";
DROP TABLE "FollowUp";
ALTER TABLE "new_FollowUp" RENAME TO "FollowUp";
CREATE INDEX "FollowUp_customerId_idx" ON "FollowUp"("customerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "LeadStageHistory_customerId_idx" ON "LeadStageHistory"("customerId");

-- CreateIndex
CREATE INDEX "LeadStageHistory_changedBy_idx" ON "LeadStageHistory"("changedBy");
