import { db } from "./db";
import type { Product } from "@prisma/client";

/**
 * Product data transfer object for create/update operations.
 */
export interface ProductDTO {
  name: string;
  line: string;
  description: string;
  price: number;
  specialOfferPrice?: number | null;
  currency?: string;
  imageUrl?: string | null;
  stock?: number;
  sold?: number;
  isActive?: boolean;
  sequence?: number;
  /** Per-tour low-seats threshold (null = use default or hide badge). */
  lowSeatsThreshold?: number | null;
}

/**
 * Pagination options for list queries.
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Paginated response wrapper.
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Default pagination values.
 */
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** Placeholder product used only for CSV import; excluded from catalog and sales. */
export const IMPORT_ONLY_PRODUCT_NAME = "Importación de Reservas";

/**
 * Returns true if the product is the import-only placeholder (case-insensitive).
 */
export function isImportOnlyProduct(product: { name: string }): boolean {
  return product.name.trim().toLowerCase() === IMPORT_ONLY_PRODUCT_NAME.toLowerCase();
}

/** Where clause to exclude the import-only placeholder from sellable product lists. */
const excludeImportOnly = { name: { not: IMPORT_ONLY_PRODUCT_NAME } };

/**
 * Retrieves all active tours from the database.
 * Excludes import-only placeholder. Catalog uses this single list.
 * @returns Array of active products (tours) sorted by sequence and creation date.
 */
export async function getActiveProducts(): Promise<Product[]> {
  return db.product.findMany({
    where: { isActive: true, ...excludeImportOnly },
    orderBy: [{ sequence: "asc" }, { createdAt: "desc" }],
  });
}

/**
 * Retrieves active products with pagination for mobile optimization.
 * @param options - Pagination options (page, limit).
 * @returns Paginated response with products and pagination info.
 */
export async function getActiveProductsPaginated(
  options: PaginationOptions = {}
): Promise<PaginatedResponse<Product>> {
  const page = Math.max(1, options.page ?? DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, options.limit ?? DEFAULT_LIMIT));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    db.product.findMany({
      where: { isActive: true, ...excludeImportOnly },
      orderBy: [{ sequence: "asc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    db.product.count({ where: { isActive: true, ...excludeImportOnly } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Retrieves all products (including inactive) for admin.
 * @returns Array of all products sorted by creation date.
 */
export async function getAllProducts(): Promise<Product[]> {
  return db.product.findMany({
    orderBy: [{ sequence: "asc" }, { createdAt: "desc" }],
  });
}

/**
 * Retrieves all products with pagination for admin dashboard.
 * @param options - Pagination options (page, limit).
 * @returns Paginated response with products and pagination info.
 */
export async function getAllProductsPaginated(
  options: PaginationOptions = {}
): Promise<PaginatedResponse<Product>> {
  const page = Math.max(1, options.page ?? DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, options.limit ?? DEFAULT_LIMIT));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    db.product.findMany({
      orderBy: [{ sequence: "asc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    db.product.count(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Retrieves a single product by ID.
 * @param id - The product ID to find.
 * @returns The product or null if not found.
 */
export async function getProductById(id: string): Promise<Product | null> {
  return db.product.findUnique({
    where: { id },
  });
}

/**
 * Creates a new product in the database.
 * @param data - The product data to create.
 * @returns The created product.
 */
export async function createProduct(data: ProductDTO): Promise<Product> {
  return db.product.create({
    data: {
      name: data.name,
      line: data.line,
      description: data.description,
      price: data.price,
      specialOfferPrice: data.specialOfferPrice ?? null,
      currency: data.currency ?? "RD$",
      imageUrl: data.imageUrl,
      stock: data.stock ?? 0,
      isActive: data.isActive ?? true,
      sequence: data.sequence ?? 0,
      lowSeatsThreshold: data.lowSeatsThreshold ?? undefined,
    },
  });
}

/**
 * Updates an existing product.
 * @param id - The product ID to update.
 * @param data - The partial product data to update.
 * @returns The updated product.
 */
export async function updateProduct(
  id: string,
  data: Partial<ProductDTO>
): Promise<Product> {
  return db.product.update({
    where: { id },
    data,
  });
}

/**
 * Soft deletes a product by setting isActive to false.
 * @param id - The product ID to deactivate.
 * @returns The deactivated product.
 */
export async function deactivateProduct(id: string): Promise<Product> {
  return db.product.update({
    where: { id },
    data: { isActive: false },
  });
}

/**
 * Permanently deletes a product from the database.
 * Fails if product has sales (to preserve history) or is the import-only placeholder.
 * @param id - The product ID to delete.
 * @returns The deleted product.
 * @throws Error if product has sales or is import-only.
 */
export async function deleteProduct(id: string): Promise<Product> {
  const product = await db.product.findUnique({
    where: { id },
    include: { _count: { select: { sales: true } } },
  });
  if (!product) {
    throw new Error("Product not found");
  }
  if (isImportOnlyProduct(product)) {
    throw new Error("No se puede eliminar el producto de importación");
  }
  if (product._count.sales > 0) {
    throw new Error("No se puede eliminar: tiene ventas registradas");
  }
  return db.product.delete({
    where: { id },
  });
}

/**
 * Updates product stock and increments sold count.
 * @param id - The product ID.
 * @param quantity - The quantity sold.
 * @returns The updated product.
 */
export async function recordSale(
  id: string,
  quantity: number
): Promise<Product> {
  const product = await db.product.findUnique({ where: { id } });
  if (!product) {
    throw new Error("Product not found");
  }
  if (product.stock < quantity) {
    throw new Error("Insufficient stock");
  }

  return db.product.update({
    where: { id },
    data: {
      stock: { decrement: quantity },
      sold: { increment: quantity },
    },
  });
}

/**
 * Updates product stock (for inventory management).
 * @param id - The product ID.
 * @param newStock - The new stock quantity.
 * @returns The updated product.
 */
export async function updateStock(
  id: string,
  newStock: number
): Promise<Product> {
  return db.product.update({
    where: { id },
    data: { stock: newStock },
  });
}
