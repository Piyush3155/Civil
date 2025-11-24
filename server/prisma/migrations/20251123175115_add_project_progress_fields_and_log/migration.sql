-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "progressLastUpdated" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ProjectProgressLog" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "progress" DECIMAL(65,30) NOT NULL,
    "milestone" TEXT,
    "notes" TEXT,
    "loggedBy" TEXT NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectProgressLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectProgressLog_projectId_idx" ON "ProjectProgressLog"("projectId");

-- CreateIndex
CREATE INDEX "ProjectProgressLog_loggedBy_idx" ON "ProjectProgressLog"("loggedBy");

-- AddForeignKey
ALTER TABLE "ProjectProgressLog" ADD CONSTRAINT "ProjectProgressLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectProgressLog" ADD CONSTRAINT "ProjectProgressLog_loggedBy_fkey" FOREIGN KEY ("loggedBy") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
