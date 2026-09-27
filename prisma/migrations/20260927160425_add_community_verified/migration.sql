-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Community" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameSq" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "descriptionSq" TEXT NOT NULL,
    "areaSq" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "organizerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Community_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Community" ("areaSq", "category", "createdAt", "description", "descriptionSq", "id", "name", "nameSq", "organizerId", "slug", "updatedAt", "visibility") SELECT "areaSq", "category", "createdAt", "description", "descriptionSq", "id", "name", "nameSq", "organizerId", "slug", "updatedAt", "visibility" FROM "Community";
DROP TABLE "Community";
ALTER TABLE "new_Community" RENAME TO "Community";
CREATE UNIQUE INDEX "Community_slug_key" ON "Community"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
