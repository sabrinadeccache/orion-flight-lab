-- CreateEnum
CREATE TYPE "CourseModality" AS ENUM ('TEORICO', 'PRATICO', 'MISTO');

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "modality" "CourseModality" NOT NULL DEFAULT 'MISTO';

-- AlterTable
ALTER TABLE "qualifications" ADD COLUMN     "certificate_id" UUID;

-- CreateIndex
CREATE INDEX "qualifications_certificate_id_idx" ON "qualifications"("certificate_id");

-- AddForeignKey
ALTER TABLE "qualifications" ADD CONSTRAINT "qualifications_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "certificates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
