-- Rename products table to tours
ALTER TABLE "products" RENAME TO "tours";

-- Remove unused columns from tours
ALTER TABLE "tours" DROP COLUMN IF EXISTS "specialOfferPrice";
ALTER TABLE "tours" DROP COLUMN IF EXISTS "imageUrl";

-- Default category for line
ALTER TABLE "tours" ALTER COLUMN "line" SET DEFAULT 'Tour';

-- Sales: productId -> tourId (drop FK, rename column, add FK)
ALTER TABLE "sales" DROP CONSTRAINT IF EXISTS "sales_productId_fkey";
ALTER TABLE "sales" RENAME COLUMN "productId" TO "tourId";
ALTER TABLE "sales" ADD CONSTRAINT "sales_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- MonthlySummary: product -> tour column names
ALTER TABLE "monthly_summaries" RENAME COLUMN "totalProducts" TO "totalTours";
ALTER TABLE "monthly_summaries" RENAME COLUMN "topProductId" TO "topTourId";
ALTER TABLE "monthly_summaries" RENAME COLUMN "topProductSold" TO "topTourSold";

-- WhatsAppMessageLog: productId -> tourId
ALTER TABLE "whatsapp_message_log" RENAME COLUMN "productId" TO "tourId";
