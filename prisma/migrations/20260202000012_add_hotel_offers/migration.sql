-- CreateTable
CREATE TABLE "hotel_offers" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "linkUrl" TEXT NOT NULL,
    "imageUrl" TEXT,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotel_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hotel_offers_isActive_sequence_idx" ON "hotel_offers"("isActive", "sequence");
