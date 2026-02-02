-- CreateTable
CREATE TABLE "whatsapp_message_log" (
    "id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "externalId" TEXT,
    "batchId" TEXT,
    "productId" TEXT,
    "customerPhone" TEXT NOT NULL,
    "body" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_message_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "whatsapp_message_log_batchId_idx" ON "whatsapp_message_log"("batchId");

-- CreateIndex
CREATE INDEX "whatsapp_message_log_productId_idx" ON "whatsapp_message_log"("productId");

-- CreateIndex
CREATE INDEX "whatsapp_message_log_customerPhone_idx" ON "whatsapp_message_log"("customerPhone");

-- CreateIndex
CREATE INDEX "whatsapp_message_log_createdAt_idx" ON "whatsapp_message_log"("createdAt");
