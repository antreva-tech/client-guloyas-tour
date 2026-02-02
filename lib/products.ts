import { db } from "./db";
import type { Tour } from "@prisma/client";

/**
 * Tour data transfer object for create/update operations.
 * Matches form: name, description, tourDate, price, childPrice, stock, lowSeatsThreshold, imageUrls.
 */
export interface ProductDTO {
  name: string;
  line?: string;
  description: string;
  price: number;
  childPrice?: number | null;
  currency?: string;
  imageUrls?: string[];
  stock?: number;
  sold?: number;
  isActive?: boolean;
  sequence?: number;
  lowSeatsThreshold?: number | null;
  tourDate?: Date | string | null;
}

/** Re-export Prisma Tour as Product for backward-compatible API/catalog types. */
export type Product = Tour;

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

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** Placeholder tour used only for CSV import; excluded from catalog and sales. */
export const IMPORT_ONLY_PRODUCT_NAME = "Importación de Reservas";

export function isImportOnlyProduct(product: { name: string }): boolean {
  return product.name.trim().toLowerCase() === IMPORT_ONLY_PRODUCT_NAME.toLowerCase();
}

const excludeImportOnly = { name: { not: IMPORT_ONLY_PRODUCT_NAME } };

/** Start of today UTC; tours with tourDate before this are excluded from public catalog. */
function startOfTodayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Where clause so only current/future-dated tours appear in catalog (null = no date = always show). */
function catalogNotExpiredWhere() {
  return {
    OR: [
      { tourDate: null },
      { tourDate: { gte: startOfTodayUTC() } },
    ],
  };
}

/**
 * Retrieves all active tours for public catalog.
 * Excludes import-only placeholder and tours whose tourDate has passed.
 */
export async function getActiveProducts(): Promise<Tour[]> {
  return db.tour.findMany({
    where: {
      isActive: true,
      ...excludeImportOnly,
      ...catalogNotExpiredWhere(),
    },
    orderBy: [{ sequence: "asc" }, { createdAt: "desc" }],
  });
}

/**
 * Retrieves active tours with pagination for public catalog.
 * Excludes tours whose tourDate has passed.
 */
export async function getActiveProductsPaginated(
  options: PaginationOptions = {}
): Promise<PaginatedResponse<Tour>> {
  const page = Math.max(1, options.page ?? DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, options.limit ?? DEFAULT_LIMIT));
  const skip = (page - 1) * limit;
  const where = { isActive: true, ...excludeImportOnly, ...catalogNotExpiredWhere() };

  const [data, total] = await Promise.all([
    db.tour.findMany({
      where,
      orderBy: [{ sequence: "asc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    db.tour.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);
  return {
    data,
    pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
  };
}

/**
 * Retrieves all tours (including inactive) for admin.
 */
export async function getAllProducts(): Promise<Tour[]> {
  return db.tour.findMany({
    orderBy: [{ sequence: "asc" }, { createdAt: "desc" }],
  });
}

/**
 * Retrieves all tours with pagination for admin.
 */
export async function getAllProductsPaginated(
  options: PaginationOptions = {}
): Promise<PaginatedResponse<Tour>> {
  const page = Math.max(1, options.page ?? DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, options.limit ?? DEFAULT_LIMIT));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    db.tour.findMany({
      orderBy: [{ sequence: "asc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    db.tour.count(),
  ]);

  const totalPages = Math.ceil(total / limit);
  return {
    data,
    pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
  };
}

/**
 * Retrieves a single tour by ID.
 */
export async function getProductById(id: string): Promise<Tour | null> {
  return db.tour.findUnique({
    where: { id },
  });
}

/**
 * Creates a new tour.
 */
export async function createProduct(data: ProductDTO): Promise<Tour> {
  return db.tour.create({
    data: {
      name: data.name,
      line: data.line ?? "Tour",
      description: data.description,
      price: data.price,
      childPrice: data.childPrice ?? null,
      currency: data.currency ?? "RD$",
      imageUrls: data.imageUrls ?? [],
      stock: data.stock ?? 0,
      isActive: data.isActive ?? true,
      sequence: data.sequence ?? 0,
      lowSeatsThreshold: data.lowSeatsThreshold ?? undefined,
      tourDate: data.tourDate != null ? (typeof data.tourDate === "string" ? new Date(data.tourDate) : data.tourDate) : undefined,
    },
  });
}

/**
 * Updates an existing tour.
 */
export async function updateProduct(id: string, data: Partial<ProductDTO>): Promise<Tour> {
  const { tourDate, imageUrls, ...rest } = data;
  const payload: Parameters<typeof db.tour.update>[0]["data"] = { ...rest };
  if (tourDate !== undefined) {
    payload.tourDate = tourDate == null ? null : (typeof tourDate === "string" ? new Date(tourDate) : tourDate);
  }
  if (imageUrls !== undefined) payload.imageUrls = imageUrls;
  return db.tour.update({
    where: { id },
    data: payload,
  });
}

/**
 * Soft deletes a tour by setting isActive to false.
 */
export async function deactivateProduct(id: string): Promise<Tour> {
  return db.tour.update({
    where: { id },
    data: { isActive: false },
  });
}

/**
 * Permanently deletes a tour. Fails if it has sales or is the import-only placeholder.
 */
export async function deleteProduct(id: string): Promise<Tour> {
  const tour = await db.tour.findUnique({
    where: { id },
    include: { _count: { select: { sales: true } } },
  });
  if (!tour) throw new Error("Product not found");
  if (isImportOnlyProduct(tour)) throw new Error("No se puede eliminar el producto de importación");
  if (tour._count.sales > 0) throw new Error("No se puede eliminar: tiene ventas registradas");
  return db.tour.delete({ where: { id } });
}

/**
 * Updates tour stock and increments sold count (after a booking).
 */
export async function recordSale(id: string, quantity: number): Promise<Tour> {
  const tour = await db.tour.findUnique({ where: { id } });
  if (!tour) throw new Error("Product not found");
  if (tour.stock < quantity) throw new Error("Insufficient stock");
  return db.tour.update({
    where: { id },
    data: { stock: { decrement: quantity }, sold: { increment: quantity } },
  });
}

/**
 * Updates tour stock (inventory management).
 */
export async function updateStock(id: string, newStock: number): Promise<Tour> {
  return db.tour.update({
    where: { id },
    data: { stock: newStock },
  });
}
