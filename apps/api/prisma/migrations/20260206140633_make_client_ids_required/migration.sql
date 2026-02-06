/*
  Warnings:

  - Made the column `clientId` on table `Topic` required. This step will fail if there are existing NULL values in that column.
  - Made the column `clientId` on table `TopicItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Topic" ALTER COLUMN "clientId" SET NOT NULL;

-- AlterTable
ALTER TABLE "TopicItem" ALTER COLUMN "clientId" SET NOT NULL;
