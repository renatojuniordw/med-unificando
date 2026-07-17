-- AlterTable
ALTER TABLE "medicines" ADD COLUMN     "anvisaFileDate" TIMESTAMP(3),
ADD COLUMN     "atcCode" TEXT,
ADD COLUMN     "authorization" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "lastImportAt" TIMESTAMP(3),
ADD COLUMN     "prescriptionType" TEXT,
ADD COLUMN     "presentationCount" INTEGER,
ADD COLUMN     "referenceMedicine" TEXT,
ADD COLUMN     "status" TEXT;

-- CreateIndex
CREATE INDEX "medicines_category_idx" ON "medicines"("category");

-- CreateIndex
CREATE INDEX "medicines_status_idx" ON "medicines"("status");
