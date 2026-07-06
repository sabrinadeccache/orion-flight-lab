-- AlterTable
ALTER TABLE "risks" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'identificado';

-- AlterTable
ALTER TABLE "safety_occurrences" ADD COLUMN     "hazard_id" UUID;

-- AddForeignKey
ALTER TABLE "safety_occurrences" ADD CONSTRAINT "safety_occurrences_hazard_id_fkey" FOREIGN KEY ("hazard_id") REFERENCES "hazards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
