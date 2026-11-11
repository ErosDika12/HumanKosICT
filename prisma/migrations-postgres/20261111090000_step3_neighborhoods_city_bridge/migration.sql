-- CreateEnum
CREATE TYPE "CityContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('RECEIVED', 'UNDER_REVIEW', 'DUPLICATE', 'DECLINED', 'MUNICIPALITY_ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('OPEN', 'CLOSED', 'HIDDEN');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "completionEvidence" TEXT,
ADD COLUMN     "completionNote" TEXT,
ADD COLUMN     "materialsNeeded" TEXT,
ADD COLUMN     "responsibleOrganizerId" TEXT,
ADD COLUMN     "scheduledFor" TIMESTAMP(3),
ADD COLUMN     "skillsNeeded" TEXT,
ADD COLUMN     "startedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "NeighborhoodFollow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NeighborhoodFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CityService" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameSq" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "descriptionSq" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "officialUrl" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL,
    "status" "CityContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CityService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CityNotice" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleSq" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "bodySq" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "status" "CityContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CityNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "areaSlug" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" "IssueStatus" NOT NULL DEFAULT 'RECEIVED',
    "duplicateOfId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IssueReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueEvent" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "status" "IssueStatus" NOT NULL,
    "note" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CityProposal" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "areaSlug" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CityProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CityProposalSupport" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CityProposalSupport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectUpdate" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NeighborhoodFollow_userId_slug_key" ON "NeighborhoodFollow"("userId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "CityService_slug_key" ON "CityService"("slug");

-- CreateIndex
CREATE INDEX "CityService_status_idx" ON "CityService"("status");

-- CreateIndex
CREATE INDEX "CityNotice_status_idx" ON "CityNotice"("status");

-- CreateIndex
CREATE INDEX "IssueReport_status_idx" ON "IssueReport"("status");

-- CreateIndex
CREATE INDEX "IssueReport_areaSlug_idx" ON "IssueReport"("areaSlug");

-- CreateIndex
CREATE INDEX "IssueEvent_issueId_idx" ON "IssueEvent"("issueId");

-- CreateIndex
CREATE INDEX "CityProposal_status_idx" ON "CityProposal"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CityProposalSupport_proposalId_userId_key" ON "CityProposalSupport"("proposalId", "userId");

-- CreateIndex
CREATE INDEX "ProjectUpdate_projectId_idx" ON "ProjectUpdate"("projectId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_responsibleOrganizerId_fkey" FOREIGN KEY ("responsibleOrganizerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeighborhoodFollow" ADD CONSTRAINT "NeighborhoodFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CityService" ADD CONSTRAINT "CityService_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CityNotice" ADD CONSTRAINT "CityNotice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueReport" ADD CONSTRAINT "IssueReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueReport" ADD CONSTRAINT "IssueReport_duplicateOfId_fkey" FOREIGN KEY ("duplicateOfId") REFERENCES "IssueReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueEvent" ADD CONSTRAINT "IssueEvent_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "IssueReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CityProposal" ADD CONSTRAINT "CityProposal_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CityProposalSupport" ADD CONSTRAINT "CityProposalSupport_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "CityProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CityProposalSupport" ADD CONSTRAINT "CityProposalSupport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUpdate" ADD CONSTRAINT "ProjectUpdate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUpdate" ADD CONSTRAINT "ProjectUpdate_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

