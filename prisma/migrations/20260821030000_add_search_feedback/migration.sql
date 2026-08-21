-- CreateTable
CREATE TABLE "search_feedback" (
    "id" SERIAL NOT NULL,
    "query" TEXT NOT NULL,
    "medicine_id" INTEGER NOT NULL,
    "medicine_name" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_feedback_query_feedback_idx" ON "search_feedback"("query", "feedback");

-- CreateIndex
CREATE INDEX "search_feedback_medicine_id_idx" ON "search_feedback"("medicine_id");

-- CreateIndex
CREATE INDEX "search_feedback_created_at_idx" ON "search_feedback"("created_at");
