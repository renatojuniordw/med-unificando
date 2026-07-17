-- CreateTable
CREATE TABLE "medicines" (
    "id" SERIAL NOT NULL,
    "reference" TEXT NOT NULL,
    "activeIngredient" TEXT NOT NULL,
    "tradeName" TEXT NOT NULL,
    "holder_of_similar_medicine_registration" TEXT NOT NULL,
    "pharmaceuticalForm" TEXT NOT NULL,
    "concentration" TEXT NOT NULL,
    "inclusionDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medicines_reference_idx" ON "medicines"("reference");

-- CreateIndex
CREATE INDEX "medicines_activeIngredient_idx" ON "medicines"("activeIngredient");

-- CreateIndex
CREATE INDEX "medicines_tradeName_idx" ON "medicines"("tradeName");

-- CreateIndex
CREATE INDEX "medicines_holder_of_similar_medicine_registration_idx" ON "medicines"("holder_of_similar_medicine_registration");
