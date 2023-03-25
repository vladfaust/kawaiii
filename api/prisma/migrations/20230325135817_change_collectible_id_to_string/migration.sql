/*
  Warnings:

  - The primary key for the `Collectible` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `CollectibleBalance` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Like` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "CollectibleBalance" DROP CONSTRAINT "CollectibleBalance_collectibleId_fkey";

-- DropForeignKey
ALTER TABLE "CollectibleContent" DROP CONSTRAINT "CollectibleContent_collectibleId_fkey";

-- DropForeignKey
ALTER TABLE "CollectibleCreateEvent" DROP CONSTRAINT "CollectibleCreateEvent_collectibleId_fkey";

-- DropForeignKey
ALTER TABLE "CollectibleMintEvent" DROP CONSTRAINT "CollectibleMintEvent_collectibleId_fkey";

-- DropForeignKey
ALTER TABLE "CollectibleTransferEvent" DROP CONSTRAINT "CollectibleTransferEvent_collectibleId_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_collectibleId_fkey";

-- AlterTable
ALTER TABLE "Collectible" DROP CONSTRAINT "Collectible_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Collectible_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "CollectibleBalance" DROP CONSTRAINT "CollectibleBalance_pkey",
ALTER COLUMN "collectibleId" SET DATA TYPE TEXT,
ADD CONSTRAINT "CollectibleBalance_pkey" PRIMARY KEY ("userId", "collectibleId");

-- AlterTable
ALTER TABLE "CollectibleContent" ALTER COLUMN "collectibleId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "CollectibleCreateEvent" ALTER COLUMN "collectibleId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "CollectibleMintEvent" ALTER COLUMN "collectibleId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "CollectibleTransferEvent" ALTER COLUMN "collectibleId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Like" DROP CONSTRAINT "Like_pkey",
ALTER COLUMN "collectibleId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Like_pkey" PRIMARY KEY ("userId", "collectibleId");

-- AddForeignKey
ALTER TABLE "CollectibleContent" ADD CONSTRAINT "CollectibleContent_collectibleId_fkey" FOREIGN KEY ("collectibleId") REFERENCES "Collectible"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectibleBalance" ADD CONSTRAINT "CollectibleBalance_collectibleId_fkey" FOREIGN KEY ("collectibleId") REFERENCES "Collectible"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_collectibleId_fkey" FOREIGN KEY ("collectibleId") REFERENCES "Collectible"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectibleCreateEvent" ADD CONSTRAINT "CollectibleCreateEvent_collectibleId_fkey" FOREIGN KEY ("collectibleId") REFERENCES "Collectible"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectibleMintEvent" ADD CONSTRAINT "CollectibleMintEvent_collectibleId_fkey" FOREIGN KEY ("collectibleId") REFERENCES "Collectible"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectibleTransferEvent" ADD CONSTRAINT "CollectibleTransferEvent_collectibleId_fkey" FOREIGN KEY ("collectibleId") REFERENCES "Collectible"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
