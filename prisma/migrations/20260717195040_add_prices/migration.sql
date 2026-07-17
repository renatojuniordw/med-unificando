-- CreateTable
CREATE TABLE "prices" (
    "id" SERIAL NOT NULL,
    "reference" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "presentation" TEXT NOT NULL,
    "substance" TEXT NOT NULL,
    "pf0Price" DOUBLE PRECISION,
    "pf18Price" DOUBLE PRECISION,
    "hospitalOnly" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prices_reference_idx" ON "prices"("reference");

-- CreateIndex
CREATE INDEX "prices_cnpj_idx" ON "prices"("cnpj");
