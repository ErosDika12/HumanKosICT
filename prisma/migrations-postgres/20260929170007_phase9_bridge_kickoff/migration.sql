-- AlterTable
ALTER TABLE "BridgeProposal" ADD COLUMN     "kickoffActivityId" TEXT;

-- AddForeignKey
ALTER TABLE "BridgeProposal" ADD CONSTRAINT "BridgeProposal_kickoffActivityId_fkey" FOREIGN KEY ("kickoffActivityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

