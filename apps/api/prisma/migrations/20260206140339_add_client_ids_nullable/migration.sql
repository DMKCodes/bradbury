/*
  Warnings:

  - A unique constraint covering the columns `[userId,clientId]` on the table `Entry` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,clientId]` on the table `Topic` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[topicId,clientId]` on the table `TopicItem` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Entry" ADD COLUMN     "clientId" TEXT;

-- AlterTable
ALTER TABLE "Topic" ADD COLUMN     "clientId" TEXT;

-- AlterTable
ALTER TABLE "TopicItem" ADD COLUMN     "clientId" TEXT;

-- CreateIndex
CREATE INDEX "Entry_userId_clientId_idx" ON "Entry"("userId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Entry_userId_clientId_key" ON "Entry"("userId", "clientId");

-- CreateIndex
CREATE INDEX "Topic_userId_clientId_idx" ON "Topic"("userId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_userId_clientId_key" ON "Topic"("userId", "clientId");

-- CreateIndex
CREATE INDEX "TopicItem_topicId_clientId_idx" ON "TopicItem"("topicId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "TopicItem_topicId_clientId_key" ON "TopicItem"("topicId", "clientId");
