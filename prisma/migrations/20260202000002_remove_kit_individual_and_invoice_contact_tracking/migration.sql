-- Drop Product columns isKit, isIndividual (tours project: catalog uses single list).
-- Drop InvoiceContactTracking (redundant with WhatsAppMessageLog for message tracking).

-- Drop indexes on products that reference isKit / isIndividual
DROP INDEX IF EXISTS "products_isActive_isKit_idx";
DROP INDEX IF EXISTS "products_isActive_isIndividual_idx";

-- Drop deprecated columns from products
ALTER TABLE "products" DROP COLUMN IF EXISTS "isKit";
ALTER TABLE "products" DROP COLUMN IF EXISTS "isIndividual";

-- Drop invoice contact tracking table (WhatsAppMessageLog provides message history)
DROP TABLE IF EXISTS "invoice_contact_tracking";
