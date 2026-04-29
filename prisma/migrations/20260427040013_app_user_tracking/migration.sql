-- CreateTable
CREATE TABLE "AppUser" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "imageUrl" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_clerkUserId_key" ON "AppUser"("clerkUserId");

-- CreateIndex
CREATE INDEX "AppUser_email_idx" ON "AppUser"("email");

-- CreateIndex
CREATE INDEX "AppUser_lastSeenAt_idx" ON "AppUser"("lastSeenAt");
