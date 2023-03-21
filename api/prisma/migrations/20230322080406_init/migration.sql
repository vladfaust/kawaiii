-- CreateEnum
CREATE TYPE "CollectibleContentType" AS ENUM ('Image');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "handle" TEXT,
    "name" TEXT,
    "bio" TEXT,
    "address" BYTEA NOT NULL,
    "bgpVersion" INTEGER NOT NULL DEFAULT 0,
    "pfpVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "followerId" TEXT NOT NULL,
    "followeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("followerId","followeeId")
);

-- CreateTable
CREATE TABLE "Collectible" (
    "id" BYTEA NOT NULL,
    "creatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "mintPrice" BYTEA NOT NULL,
    "editions" INTEGER NOT NULL,
    "royalty" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collectible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectibleContent" (
    "id" SERIAL NOT NULL,
    "collectibleId" BYTEA NOT NULL,
    "type" "CollectibleContentType" NOT NULL,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "gated" BOOLEAN NOT NULL,

    CONSTRAINT "CollectibleContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectibleBalance" (
    "userId" TEXT NOT NULL,
    "collectibleId" BYTEA NOT NULL,
    "balance" BIGINT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectibleBalance_pkey" PRIMARY KEY ("userId","collectibleId")
);

-- CreateTable
CREATE TABLE "Like" (
    "userId" TEXT NOT NULL,
    "collectibleId" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("userId","collectibleId")
);

-- CreateTable
CREATE TABLE "CollectibleCreateEvent" (
    "creatorId" TEXT NOT NULL,
    "collectibleId" BYTEA NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "txHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectibleCreateEvent_pkey" PRIMARY KEY ("blockNumber","logIndex")
);

-- CreateTable
CREATE TABLE "CollectibleMintEvent" (
    "toId" TEXT NOT NULL,
    "collectibleId" BYTEA NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "txHash" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "income" BIGINT NOT NULL,
    "ownerFee" BIGINT NOT NULL,
    "profit" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectibleMintEvent_pkey" PRIMARY KEY ("blockNumber","logIndex")
);

-- CreateTable
CREATE TABLE "CollectibleTransferEvent" (
    "fromId" TEXT,
    "toId" TEXT,
    "collectibleId" BYTEA NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "subIndex" INTEGER NOT NULL,
    "txHash" TEXT NOT NULL,
    "value" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectibleTransferEvent_pkey" PRIMARY KEY ("blockNumber","logIndex","subIndex")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "User_address_key" ON "User"("address");

-- CreateIndex
CREATE UNIQUE INDEX "CollectibleContent_collectibleId_name_key" ON "CollectibleContent"("collectibleId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CollectibleCreateEvent_collectibleId_key" ON "CollectibleCreateEvent"("collectibleId");

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followeeId_fkey" FOREIGN KEY ("followeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collectible" ADD CONSTRAINT "Collectible_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectibleContent" ADD CONSTRAINT "CollectibleContent_collectibleId_fkey" FOREIGN KEY ("collectibleId") REFERENCES "Collectible"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectibleBalance" ADD CONSTRAINT "CollectibleBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectibleBalance" ADD CONSTRAINT "CollectibleBalance_collectibleId_fkey" FOREIGN KEY ("collectibleId") REFERENCES "Collectible"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_collectibleId_fkey" FOREIGN KEY ("collectibleId") REFERENCES "Collectible"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectibleCreateEvent" ADD CONSTRAINT "CollectibleCreateEvent_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectibleCreateEvent" ADD CONSTRAINT "CollectibleCreateEvent_collectibleId_fkey" FOREIGN KEY ("collectibleId") REFERENCES "Collectible"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectibleMintEvent" ADD CONSTRAINT "CollectibleMintEvent_toId_fkey" FOREIGN KEY ("toId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectibleMintEvent" ADD CONSTRAINT "CollectibleMintEvent_collectibleId_fkey" FOREIGN KEY ("collectibleId") REFERENCES "Collectible"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectibleTransferEvent" ADD CONSTRAINT "CollectibleTransferEvent_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectibleTransferEvent" ADD CONSTRAINT "CollectibleTransferEvent_toId_fkey" FOREIGN KEY ("toId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectibleTransferEvent" ADD CONSTRAINT "CollectibleTransferEvent_collectibleId_fkey" FOREIGN KEY ("collectibleId") REFERENCES "Collectible"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
