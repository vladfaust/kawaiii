/*
  Warnings:

  - You are about to alter the column `balance` on the `CollectibleBalance` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - Changed the type of `amount` on the `CollectibleMintEvent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `income` on the `CollectibleMintEvent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `ownerFee` on the `CollectibleMintEvent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `profit` on the `CollectibleMintEvent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `value` on the `CollectibleTransferEvent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "CollectibleBalance" ALTER COLUMN "balance" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "CollectibleMintEvent" DROP COLUMN "amount",
ADD COLUMN     "amount" BYTEA NOT NULL,
DROP COLUMN "income",
ADD COLUMN     "income" BYTEA NOT NULL,
DROP COLUMN "ownerFee",
ADD COLUMN     "ownerFee" BYTEA NOT NULL,
DROP COLUMN "profit",
ADD COLUMN     "profit" BYTEA NOT NULL;

-- AlterTable
ALTER TABLE "CollectibleTransferEvent" DROP COLUMN "value",
ADD COLUMN     "value" BYTEA NOT NULL;
