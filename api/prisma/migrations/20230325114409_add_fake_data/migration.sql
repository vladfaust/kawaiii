-- AlterTable
ALTER TABLE "Collectible" ADD COLUMN     "fakeLikes" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "fakeFollowers" INTEGER NOT NULL DEFAULT 0;
