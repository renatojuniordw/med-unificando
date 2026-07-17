-- CreateTable
CREATE TABLE "sync_logs" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);
