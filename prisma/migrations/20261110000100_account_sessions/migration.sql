-- Existing JWTs represent version zero until an owner changes their password.
ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD CONSTRAINT "User_sessionVersion_nonnegative" CHECK ("sessionVersion" >= 0);
