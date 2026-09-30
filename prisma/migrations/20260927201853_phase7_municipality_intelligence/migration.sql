-- CreateTable
CREATE TABLE "MunicipalityScenarioDemand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "areaSq" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "syntheticCount" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MunicipalityRecommendationNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "areaSq" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MunicipalityRecommendationNote_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MunicipalityScenarioDemand_areaSq_category_key" ON "MunicipalityScenarioDemand"("areaSq", "category");

-- CreateIndex
CREATE UNIQUE INDEX "MunicipalityRecommendationNote_areaSq_category_key" ON "MunicipalityRecommendationNote"("areaSq", "category");
