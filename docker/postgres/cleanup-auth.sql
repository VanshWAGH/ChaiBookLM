ALTER TABLE "workspace" DROP CONSTRAINT IF EXISTS "workspace_userId_fkey";
DROP TABLE IF EXISTS "verification" CASCADE;
DROP TABLE IF EXISTS "account" CASCADE;
DROP TABLE IF EXISTS "session" CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;
CREATE INDEX IF NOT EXISTS "workspace_userId_idx" ON "workspace"("userId");
