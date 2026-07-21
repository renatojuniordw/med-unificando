-- AlterTable
ALTER TABLE "medicines" ADD COLUMN     "farmacia_popular" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "medicines_farmacia_popular_idx" ON "medicines"("farmacia_popular");
