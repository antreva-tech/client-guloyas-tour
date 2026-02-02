-- CreateTable
CREATE TABLE "flight_requests" (
    "id" TEXT NOT NULL,
    "departureAirport" TEXT NOT NULL,
    "arrivalAirport" TEXT NOT NULL,
    "travelDate" TIMESTAMP(3) NOT NULL,
    "isRoundTrip" BOOLEAN NOT NULL DEFAULT false,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flight_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flight_requests_createdAt_idx" ON "flight_requests"("createdAt");
