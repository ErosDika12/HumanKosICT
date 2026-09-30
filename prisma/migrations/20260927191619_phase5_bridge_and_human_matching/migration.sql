/*
  Warnings:

  - Added the required column `mutualBenefit` to the `BridgeProposal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `needId` to the `BridgeProposal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requiredResources` to the `BridgeProposal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `score` to the `BridgeProposal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `suggestedNextAction` to the `BridgeProposal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `BridgeProposal` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConnectionRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" DATETIME,
    CONSTRAINT "ConnectionRequest_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConnectionRequest_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BridgeProposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "communityAId" TEXT NOT NULL,
    "communityBId" TEXT NOT NULL,
    "needId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "mutualBenefit" TEXT NOT NULL,
    "requiredResources" TEXT NOT NULL,
    "suggestedNextAction" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUGGESTED',
    "draftProjectId" TEXT,
    "decidedById" TEXT,
    "decidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BridgeProposal_communityAId_fkey" FOREIGN KEY ("communityAId") REFERENCES "Community" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BridgeProposal_communityBId_fkey" FOREIGN KEY ("communityBId") REFERENCES "Community" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BridgeProposal_needId_fkey" FOREIGN KEY ("needId") REFERENCES "CommunityNeed" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BridgeProposal_draftProjectId_fkey" FOREIGN KEY ("draftProjectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BridgeProposal_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BridgeProposal" ("communityAId", "communityBId", "createdAt", "id", "reason", "status") SELECT "communityAId", "communityBId", "createdAt", "id", "reason", "status" FROM "BridgeProposal";
DROP TABLE "BridgeProposal";
ALTER TABLE "new_BridgeProposal" RENAME TO "BridgeProposal";
CREATE UNIQUE INDEX "BridgeProposal_draftProjectId_key" ON "BridgeProposal"("draftProjectId");
CREATE UNIQUE INDEX "BridgeProposal_communityAId_communityBId_needId_key" ON "BridgeProposal"("communityAId", "communityBId", "needId");
CREATE TABLE "new_Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporterId" TEXT NOT NULL,
    "activityId" TEXT,
    "needId" TEXT,
    "reportedUserId" TEXT,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "moderatorId" TEXT,
    "moderatorNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Report_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Report_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Report_needId_fkey" FOREIGN KEY ("needId") REFERENCES "CommunityNeed" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Report_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Report" ("activityId", "createdAt", "id", "moderatorId", "moderatorNote", "needId", "reason", "reporterId", "resolvedAt", "status") SELECT "activityId", "createdAt", "id", "moderatorId", "moderatorNote", "needId", "reason", "reporterId", "resolvedAt", "status" FROM "Report";
DROP TABLE "Report";
ALTER TABLE "new_Report" RENAME TO "Report";
CREATE INDEX "Report_status_idx" ON "Report"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Block_blockerId_blockedId_key" ON "Block"("blockerId", "blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectionRequest_fromUserId_toUserId_key" ON "ConnectionRequest"("fromUserId", "toUserId");
