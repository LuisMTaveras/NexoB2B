-- AlterTable
ALTER TABLE "IntegrationMapping" ADD COLUMN     "isScheduled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastScheduledAt" TIMESTAMP(3),
ADD COLUMN     "nextRunAt" TIMESTAMP(3),
ADD COLUMN     "syncCron" TEXT,
ADD COLUMN     "syncInterval" TEXT;

-- CreateIndex
CREATE INDEX "IntegrationMapping_isScheduled_nextRunAt_idx" ON "IntegrationMapping"("isScheduled", "nextRunAt");
