-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ArtifactType" ADD VALUE 'SUMMARY';
ALTER TYPE "ArtifactType" ADD VALUE 'CLAUSE_EXTRACTOR';

-- CreateTable
CREATE TABLE "note" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "note_workspaceId_idx" ON "note"("workspaceId");

-- AddForeignKey
ALTER TABLE "note" ADD CONSTRAINT "note_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
