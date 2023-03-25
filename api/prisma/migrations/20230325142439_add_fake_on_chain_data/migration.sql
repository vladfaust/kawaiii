-- AlterTable
ALTER TABLE "Collectible" ADD COLUMN     "fakeEditions" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "fakeCollectors" INTEGER NOT NULL DEFAULT 0;
