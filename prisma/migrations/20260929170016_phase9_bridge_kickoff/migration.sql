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
    "kickoffActivityId" TEXT,
    "decidedById" TEXT,
    "decidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BridgeProposal_communityAId_fkey" FOREIGN KEY ("communityAId") REFERENCES "Community" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BridgeProposal_communityBId_fkey" FOREIGN KEY ("communityBId") REFERENCES "Community" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BridgeProposal_needId_fkey" FOREIGN KEY ("needId") REFERENCES "CommunityNeed" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BridgeProposal_draftProjectId_fkey" FOREIGN KEY ("draftProjectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BridgeProposal_kickoffActivityId_fkey" FOREIGN KEY ("kickoffActivityId") REFERENCES "Activity" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BridgeProposal_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BridgeProposal" ("communityAId", "communityBId", "createdAt", "decidedAt", "decidedById", "draftProjectId", "id", "mutualBenefit", "needId", "reason", "requiredResources", "score", "status", "suggestedNextAction", "updatedAt") SELECT "communityAId", "communityBId", "createdAt", "decidedAt", "decidedById", "draftProjectId", "id", "mutualBenefit", "needId", "reason", "requiredResources", "score", "status", "suggestedNextAction", "updatedAt" FROM "BridgeProposal";
DROP TABLE "BridgeProposal";
ALTER TABLE "new_BridgeProposal" RENAME TO "BridgeProposal";
CREATE UNIQUE INDEX "BridgeProposal_draftProjectId_key" ON "BridgeProposal"("draftProjectId");
CREATE UNIQUE INDEX "BridgeProposal_communityAId_communityBId_needId_key" ON "BridgeProposal"("communityAId", "communityBId", "needId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
