-- CreateTable
CREATE TABLE "SocialLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SocialLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PinnedFic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ficId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PinnedFic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PinnedFic_ficId_fkey" FOREIGN KEY ("ficId") REFERENCES "Fic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PinnedFandom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fandom" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PinnedFandom_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PublicPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "ficId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PublicPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PublicPost_ficId_fkey" FOREIGN KEY ("ficId") REFERENCES "Fic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "bio" TEXT,
    "avatarColor" TEXT NOT NULL DEFAULT '#faa55a',
    "avatarUrl" TEXT,
    "bannerUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "defaultShowContentWarnings" BOOLEAN NOT NULL DEFAULT false,
    "defaultShowSpiceTags" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_User" ("avatarColor", "bio", "createdAt", "email", "id", "passwordHash", "username") SELECT "avatarColor", "bio", "createdAt", "email", "id", "passwordHash", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SocialLink_userId_idx" ON "SocialLink"("userId");

-- CreateIndex
CREATE INDEX "PinnedFic_userId_idx" ON "PinnedFic"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PinnedFic_userId_ficId_key" ON "PinnedFic"("userId", "ficId");

-- CreateIndex
CREATE INDEX "PinnedFandom_userId_idx" ON "PinnedFandom"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PinnedFandom_userId_fandom_key" ON "PinnedFandom"("userId", "fandom");

-- CreateIndex
CREATE INDEX "PublicPost_authorId_idx" ON "PublicPost"("authorId");

-- CreateIndex
CREATE INDEX "PublicPost_createdAt_idx" ON "PublicPost"("createdAt");
