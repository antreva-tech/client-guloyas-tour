import { z } from "zod";

/**
 * Validates a URL string that can be either a relative path or full URL.
 * Accepts: /uploads/image.jpg, https://example.com/image.jpg
 * Rejects: empty strings, malformed URLs
 */
const imageUrlSchema = z
  .string()
  .refine(
    (val) => {
      // Allow relative paths starting with /
      if (val.startsWith("/")) return true;
      // Allow full URLs
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Must be a valid URL or relative path" }
  )
  .nullable()
  .optional();

/**
 * Sentinel for "always available" stock: never decremented, sales only tracked.
 * User enters "-" in stock input to set this.
 */
export const UNLIMITED_STOCK = -1;

/**
 * Schema for creating a new product.
 * Validates all required fields with appropriate constraints.
 * Stock may be UNLIMITED_STOCK (-1) for "always available".
 */
export const CreateProductSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be 200 characters or less"),
  line: z
    .string()
    .min(1, "Line is required")
    .max(100, "Line must be 100 characters or less"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(2000, "Description must be 2000 characters or less"),
  price: z
    .number()
    .int("Price must be a whole number")
    .min(0, "Price cannot be negative")
    .max(10_000_000, "Price exceeds maximum"),
  specialOfferPrice: z
    .number()
    .int("Special offer price must be a whole number")
    .min(0, "Special offer price cannot be negative")
    .max(10_000_000, "Special offer price exceeds maximum")
    .nullable()
    .optional(),
  currency: z.string().max(10).optional(),
  imageUrl: imageUrlSchema,
  stock: z
    .number()
    .int("Stock must be a whole number")
    .min(UNLIMITED_STOCK, "Stock must be -1 (always available) or 0 or more")
    .max(100_000, "Stock exceeds maximum")
    .optional(),
  sold: z
    .number()
    .int("Sold must be a whole number")
    .min(0, "Sold cannot be negative")
    .optional(),
  isActive: z.boolean().optional(),
  isKit: z.boolean().optional(),
  isIndividual: z.boolean().optional(),
  sequence: z
    .number()
    .int("Sequence must be a whole number")
    .min(0, "Sequence cannot be negative")
    .optional(),
});

/**
 * Schema for updating an existing product.
 * All fields are optional since PATCH supports partial updates.
 */
export const UpdateProductSchema = z.object({
  name: z
    .string()
    .min(1, "Name cannot be empty")
    .max(200, "Name must be 200 characters or less")
    .optional(),
  line: z
    .string()
    .min(1, "Line cannot be empty")
    .max(100, "Line must be 100 characters or less")
    .optional(),
  description: z
    .string()
    .min(1, "Description cannot be empty")
    .max(2000, "Description must be 2000 characters or less")
    .optional(),
  price: z
    .number()
    .int("Price must be a whole number")
    .min(0, "Price cannot be negative")
    .max(10_000_000, "Price exceeds maximum")
    .optional(),
  specialOfferPrice: z
    .number()
    .int("Special offer price must be a whole number")
    .min(0, "Special offer price cannot be negative")
    .max(10_000_000, "Special offer price exceeds maximum")
    .nullable()
    .optional(),
  currency: z.string().max(10).optional(),
  imageUrl: imageUrlSchema,
  stock: z
    .number()
    .int("Stock must be a whole number")
    .min(UNLIMITED_STOCK, "Stock must be -1 (always available) or 0 or more")
    .max(100_000, "Stock exceeds maximum")
    .optional(),
  sold: z
    .number()
    .int("Sold must be a whole number")
    .min(0, "Sold cannot be negative")
    .optional(),
  isActive: z.boolean().optional(),
  isKit: z.boolean().optional(),
  isIndividual: z.boolean().optional(),
  sequence: z
    .number()
    .int("Sequence must be a whole number")
    .min(0, "Sequence cannot be negative")
    .optional(),
});

/**
 * Schema for a single sale item.
 * Includes abono (partial payment) and pendiente (pending amount) fields.
 */
export const SaleItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(1000, "Quantity exceeds maximum"),
  total: z
    .number()
    .int("Total must be a whole number")
    .min(0, "Total cannot be negative"),
  abono: z
    .number()
    .int("Abono must be a whole number")
    .min(0, "Abono cannot be negative")
    .optional(),
  pendiente: z
    .number()
    .int("Pendiente must be a whole number")
    .min(0, "Pendiente cannot be negative")
    .optional(),
});

/**
 * Valid supervisor options.
 */
export const SUPERVISORS = [
  "Braulio Nolasco",
  "Marlenys Nolasco",
  "Felix Santos",
] as const;
export type Supervisor = typeof SUPERVISORS[number];

/**
 * Schema for creating a new sale.
 * Includes all required customer and sale information fields.
 */
export const CreateSaleSchema = z.object({
  items: z
    .array(SaleItemSchema)
    .min(1, "At least one item is required")
    .max(100, "Too many items in sale"),
  customerName: z.string().min(1, "Nombre del cliente es requerido").max(200),
  customerPhone: z.string().min(1, "Teléfono es requerido").max(50),
  cedula: z.string().min(1, "Cédula es requerida").max(20),
  provincia: z.string().min(1, "Provincia es requerida").max(100),
  municipio: z.string().min(1, "Municipio es requerido").max(100),
  customerAddress: z.string().max(300).optional(),
  lugarTrabajo: z.string().min(1, "Lugar de trabajo es requerido").max(200),
  notes: z.string().max(1000).optional(),
  fechaEntrega: z.string().min(1, "Fecha de entrega es requerida"),
  fechaVisita: z.string().min(1, "Fecha de visita es requerida"),
  supervisor: z.string().min(1, "Supervisor es requerido").max(200),
  nombreVendedor: z.string().min(1, "Nombre del vendedor es requerido").max(200),
  isPaid: z.boolean().default(false),
});

/**
 * Schema for voiding a sale.
 */
export const VoidSaleSchema = z.object({
  reason: z.string().max(500).optional(),
});

/**
 * Schema for updating customer phone on a sale batch.
 */
export const UpdatePhoneSchema = z.object({
  phone: z.string().max(50, "Phone must be 50 characters or less"),
});

/**
 * Schema for updating invoice customer and sale data. All fields optional.
 */
export const UpdateInvoiceSchema = z.object({
  customerName: z.string().min(1).max(200).optional(),
  customerPhone: z.string().max(50).optional(),
  cedula: z.string().max(20).optional(),
  provincia: z.string().max(100).optional(),
  municipio: z.string().max(100).optional(),
  customerAddress: z.string().max(300).nullable().optional(),
  lugarTrabajo: z.string().max(200).optional(),
  notes: z.string().max(1000).nullable().optional(),
  fechaEntrega: z.string().nullable().optional(),
  fechaVisita: z.string().nullable().optional(),
  supervisor: z.string().max(200).optional(),
  nombreVendedor: z.string().max(200).optional(),
});

/**
 * Schema for updating batch items (edit invoice: add/update/remove lines).
 */
export const UpdateBatchItemsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().optional(),
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(1000),
        total: z.number().int().min(0),
        abono: z.number().int().min(0).optional(),
        pendiente: z.number().int().min(0).optional(),
      })
    )
    .min(1, "At least one item is required"),
});

/**
 * Formats Zod validation errors into a user-friendly message.
 * @param error - Zod error object.
 * @returns Formatted error message string.
 */
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((e) => `${e.path.join(".")}: ${e.message}`)
    .join("; ");
}

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type CreateSaleInput = z.infer<typeof CreateSaleSchema>;
export type VoidSaleInput = z.infer<typeof VoidSaleSchema>;
export type UpdatePhoneInput = z.infer<typeof UpdatePhoneSchema>;
