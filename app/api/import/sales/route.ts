import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminOrSupport } from "@/lib/apiAuth";
import { getSupervisorList } from "@/lib/supervisors";

/**
 * Creates a deterministic hash from row content for idempotent imports.
 * Re-uploading the same row produces the same hash; duplicate rows are skipped.
 * @param fingerprint - Concatenated row fields for hashing.
 * @returns Short hex hash (16 chars).
 */
function rowFingerprintHash(fingerprint: string): string {
  return createHash("sha256").update(fingerprint, "utf8").digest("hex").slice(0, 16);
}

/**
 * Parses a single CSV line respecting quoted fields.
 * @param line - One line of CSV.
 * @returns Array of cell values.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (inQuotes) {
      current += c;
    } else if (c === ",") {
      result.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Normalizes a string for product-name matching: lowercase and strip accents.
 * So "Línea" and "linea" match the same product.
 * @param s - Raw string (e.g. product name).
 * @returns Normalized key for lookup.
 */
function normalizeProductKey(s: string): string {
  const trimmed = (s || "").trim();
  return trimmed
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

/**
 * Known sheet spelling -> DB spelling so import matches system product names.
 * Sheet may have "Macadamia", DB has "Macademia"; both resolve to same product.
 */
const PRODUCT_NAME_ALIASES: [string, string][] = [["macadamia", "macademia"]];

/**
 * Returns candidate keys to try for product lookup (exact normalized, then alias-adjusted).
 * So "Linea de Miel & Leche con Macadamia" can match DB product "Línea de Miel & Leche con Macademia".
 * @param normalizedKey - Already normalized (lowercase, no accents) product name from sheet.
 * @returns Keys to try in order; first match wins.
 */
function getProductLookupCandidates(normalizedKey: string): string[] {
  const candidates = [normalizedKey];
  let key = normalizedKey;
  for (const [from, to] of PRODUCT_NAME_ALIASES) {
    if (key.includes(from)) {
      candidates.push(key.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), to));
    }
  }
  return candidates;
}

/**
 * Normalizes header key for flexible column matching (Google Sheets).
 * Maps common Spanish/English names to Sale table field names.
 * @param raw - Raw header cell.
 * @returns Normalized key.
 */
function normalizeHeader(raw: string): string {
  const lower = raw.toLowerCase().replace(/\s+/g, "").replace(/[áéíóú]/g, (m) => ({ á: "a", é: "e", í: "i", ó: "o", ú: "u" }[m] ?? m));
  const map: Record<string, string> = {
    producto: "product",
    product: "product",
    productos: "product",
    nombreproducto: "product",
    articulo: "product",
    item: "product",
    cantidad: "quantity",
    quantity: "quantity",
    cant: "quantity",
    qty: "quantity",
    total: "total",
    monto: "total",
    precio: "total",
    amount: "total",
    abono: "abono",
    pendiente: "pendiente",
    fecha: "date",
    date: "date",
    fechaventa: "date",
    fechacompra: "date",
    fechaentrega: "fechaEntrega",
    fechadeentrega: "fechaEntrega",
    deliverydate: "fechaEntrega",
    fechavisita: "fechaVisita",
    fechadevisita: "fechaVisita",
    visitdate: "fechaVisita",
    nombre: "customerName",
    cliente: "customerName",
    customer: "customerName",
    nombrecliente: "customerName",
    customername: "customerName",
    telefono: "customerPhone",
    phone: "customerPhone",
    tel: "customerPhone",
    customerphone: "customerPhone",
    cedula: "cedula",
    provincia: "provincia",
    province: "provincia",
    municipio: "municipio",
    municipality: "municipio",
    direccion: "customerAddress",
    address: "customerAddress",
    customeraddress: "customerAddress",
    supervisor: "supervisor",
    vendedor: "nombreVendedor",
    nombrevendedor: "nombreVendedor",
    sellername: "nombreVendedor",
    creadopor: "nombreVendedor",
    vendidopor: "nombreVendedor",
    pagado: "isPaid",
    paid: "isPaid",
    ispaid: "isPaid",
    nota: "notes",
    notes: "notes",
    notas: "notes",
    referencia: "notes",
    estado: "isPaid",
    status: "isPaid",
  };
  return map[lower] ?? lower;
}

/**
 * Gets first non-empty cell value for a normalized key (supports multiple header aliases).
 * @param row - CSV row cells.
 * @param headerMap - Map of normalized key -> column index.
 * @param keys - Normalized keys to try (e.g. ["fechaEntrega", "date"]).
 */
function getCell(row: string[], headerMap: Record<string, number>, keys: string[]): string {
  for (const k of keys) {
    const idx = headerMap[k];
    if (idx !== undefined) {
      const v = (row[idx] ?? "").trim();
      if (v) return v;
    }
  }
  return "";
}

/**
 * Parses optional integer from CSV cell (removes commas).
 */
function parseIntCell(value: string): number | null {
  const v = value.replace(/,/g, "").trim();
  if (!v) return null;
  const n = Math.floor(parseFloat(v));
  return Number.isNaN(n) ? null : n;
}

/**
 * Parses date from string; returns null if invalid.
 */
function parseDateCell(value: string): Date | null {
  if (!value.trim()) return null;
  const d = new Date(value.trim());
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Parses a single "Name: Price" segment (e.g. "Gotero de Ampollas: 700").
 * @param segment - One segment trimmed.
 * @returns { lookupName, priceFromCell } - lookupName for matching; priceFromCell as number or null.
 */
function parseProductSegment(segment: string): { lookupName: string; priceFromCell: number | null } {
  const colonIdx = segment.indexOf(": ");
  if (colonIdx < 0) {
    return { lookupName: segment.trim(), priceFromCell: null };
  }
  const lookupName = segment.slice(0, colonIdx).trim();
  const right = segment.slice(colonIdx + 2).trim().replace(/,/g, "");
  const num = right ? Math.round(parseFloat(right) || 0) : 0;
  const priceFromCell = Number.isNaN(num) ? null : num;
  return { lookupName, priceFromCell };
}

/**
 * Parses product cell: single "Name: Price" or multiple separated by " , " (e.g. individuals).
 * Examples: "Importación de Reservas: 4900" or "Tour A: 700 , Tour B: 700".
 * @param cell - Raw product cell value.
 * @returns Array of { lookupName, priceFromCell } for each product in the cell.
 */
function parseProductCellToItems(cell: string): Array<{ lookupName: string; priceFromCell: number | null }> {
  const trimmed = cell.trim();
  if (!trimmed) return [];
  const segments = trimmed.split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean);
  return segments.map((seg) => parseProductSegment(seg));
}

/**
 * POST /api/import/sales
 * Imports sales from a CSV file (e.g. exported from Google Sheets or another source).
 * Requires admin authentication.
 * Body: multipart/form-data with file field "file" (CSV).
 * CSV must have headers. Required: product (producto/productos) and total (total/precio/monto).
 * Quantity (cantidad) is optional; default 1 per row.
 * Optional: nombre/cliente, telefono, cedula, provincia, municipio, direccion,
 * referencias/notas, fecha de entrega, fecha de visita,
 * supervisor, nombre vendedor/vendedor, estado (pagado/pendiente), abono, pendiente.
 * Example columns: Nombre, Telefono, Cedula, Provincia, Municipio, Direccion,
 * Referencias, Fecha de Entrega, Fecha de Visita, Productos, Precio,
 * Abono, Pendiente, Vendedor, Supervisor, Notas, Estado, Nombre Vendedor.
 * @returns JSON with created count and any errors per row.
 */
export async function POST(request: NextRequest) {
  const authError = await requireAdminOrSupport();
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No se envió ningún archivo. Use el campo 'file' con un CSV." },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      return NextResponse.json(
        { error: "El CSV debe tener fila de encabezados y al menos una fila de datos." },
        { status: 400 }
      );
    }

    const rawHeaders = parseCSVLine(lines[0]);
    const headerMap: Record<string, number> = {};
    rawHeaders.forEach((h, i) => {
      const key = normalizeHeader(h);
      if (key && headerMap[key] === undefined) headerMap[key] = i;
    });

    const productIdx = headerMap["product"] ?? headerMap["producto"];
    const quantityIdx = headerMap["quantity"] ?? headerMap["cantidad"];
    const totalIdx = headerMap["total"] ?? headerMap["monto"] ?? headerMap["precio"];

    if (productIdx === undefined || totalIdx === undefined) {
      return NextResponse.json(
        {
          error:
            "El CSV debe incluir columnas para producto (producto/productos) y total (total/precio/monto). Cantidad es opcional (por defecto 1).",
        },
        { status: 400 }
      );
    }

    const allTours = await db.tour.findMany({ select: { id: true, name: true, line: true } });
    const tourByName = new Map<string, { id: string }>();
    allTours.forEach((p) => {
      const key = normalizeProductKey(p.name ?? "");
      if (key && !tourByName.has(key)) tourByName.set(key, { id: p.id });
    });

    const supervisorList = await getSupervisorList();
    const defaultSupervisor = supervisorList[0] ?? "Importado";
    let created = 0;
    let skipped = 0;
    const errorByMessage = new Map<string, number[]>();

    for (let r = 1; r < lines.length; r++) {
      const row = parseCSVLine(lines[r]);
      if (row.every((c) => !c.trim())) continue;

      const productCell = (row[productIdx] ?? "").trim();
      const items = parseProductCellToItems(productCell);
      const totalStr = (row[totalIdx] ?? "").trim().replace(/,/g, "");
      const totalFromColumn = Math.round(parseFloat(totalStr) || 0);

      if (items.length === 0) {
        const msg = "Producto vacío";
        const rows = errorByMessage.get(msg) ?? [];
        if (!rows.includes(r + 1)) rows.push(r + 1);
        errorByMessage.set(msg, rows);
        continue;
      }

      const qtyStr = quantityIdx !== undefined ? (row[quantityIdx] ?? "").trim().replace(/,/g, "") : "";
      const rowQty = quantityIdx !== undefined ? Math.floor(parseFloat(qtyStr) || 0) : 1;
      const qtyPerItem = items.length > 1 ? 1 : (rowQty < 1 ? 1 : rowQty);

      const resolvedItems: Array<{ tourId: string; quantity: number; total: number }> = [];
      for (let i = 0; i < items.length; i++) {
        const { lookupName, priceFromCell } = items[i];
        const total =
          items.length === 1 && totalFromColumn > 0 ? totalFromColumn : (priceFromCell ?? totalFromColumn ?? 0);
        if (total < 0) {
          const msg = `Total inválido para "${lookupName}"`;
          const rows = errorByMessage.get(msg) ?? [];
          if (!rows.includes(r + 1)) rows.push(r + 1);
          errorByMessage.set(msg, rows);
          break;
        }
        const productKey = normalizeProductKey(lookupName);
        const candidates = getProductLookupCandidates(productKey);
        const tour = candidates.map((c) => tourByName.get(c)).find(Boolean);
        if (!tour) {
          const msg = `Producto no encontrado: "${lookupName}"`;
          const rows = errorByMessage.get(msg) ?? [];
          if (!rows.includes(r + 1)) rows.push(r + 1);
          errorByMessage.set(msg, rows);
          break;
        }
        resolvedItems.push({ tourId: tour.id, quantity: qtyPerItem, total });
      }
      if (resolvedItems.length !== items.length) continue;

      const dateStr = getCell(row, headerMap, ["date", "fecha"]);
      const fechaEntregaStr = getCell(row, headerMap, ["fechaEntrega", "date", "fecha"]);
      const fechaVisitaStr = getCell(row, headerMap, ["fechaVisita", "date", "fecha"]);
      let saleDate = new Date();
      const parsedDate = parseDateCell(dateStr) ?? parseDateCell(fechaEntregaStr) ?? parseDateCell(fechaVisitaStr);
      if (parsedDate) saleDate = parsedDate;
      const fechaEntrega = parseDateCell(fechaEntregaStr) ?? saleDate;
      const fechaVisita = parseDateCell(fechaVisitaStr) ?? saleDate;

      const customerName = getCell(row, headerMap, ["customerName"]) || null;
      const customerPhone = getCell(row, headerMap, ["customerPhone"]) || null;
      const cedula = getCell(row, headerMap, ["cedula"]) || null;
      const provincia = getCell(row, headerMap, ["provincia"]) || null;
      const municipio = getCell(row, headerMap, ["municipio"]) || null;
      const customerAddress = getCell(row, headerMap, ["customerAddress"]) || null;
      const notes = getCell(row, headerMap, ["notes", "referencias", "nota"]) || null;

      const abonoStr = getCell(row, headerMap, ["abono"]);
      const pendienteStr = getCell(row, headerMap, ["pendiente"]);
      const abono = parseIntCell(abonoStr);
      const pendiente = parseIntCell(pendienteStr);

      const supervisorRaw = getCell(row, headerMap, ["supervisor"]).trim();
      const supervisor = supervisorRaw || defaultSupervisor;
      const nombreVendedor = getCell(row, headerMap, ["nombreVendedor"]) || "Importado";
      const isPaidRaw = getCell(row, headerMap, ["isPaid"]).toLowerCase();
      const isPaid = ["1", "true", "si", "sí", "yes", "pagado"].includes(isPaidRaw);

      const fingerprint = [
        customerPhone ?? "",
        fechaEntrega.toISOString(),
        String(totalFromColumn),
        productCell,
        customerName ?? "",
      ].join("|");
      const batchId = `import_${rowFingerprintHash(fingerprint)}`;

      const existingBatch = await db.sale.findFirst({
        where: { batchId },
        select: { id: true },
      });
      if (existingBatch) {
        skipped += resolvedItems.length;
        continue;
      }

      await db.$transaction(async (tx) => {
        for (let i = 0; i < resolvedItems.length; i++) {
          const { tourId, quantity, total } = resolvedItems[i];
          const isFirst = i === 0;
          await tx.sale.create({
            data: {
              batchId,
              tourId,
              quantity,
              total,
              abono: isFirst ? (abono ?? null) : null,
              pendiente: isFirst ? (pendiente ?? null) : null,
              customerName,
              customerPhone,
              cedula,
              provincia,
              municipio,
              customerAddress,
              notes,
              fechaEntrega,
              fechaVisita,
              supervisor,
              nombreVendedor,
              isPaid,
            },
          });
          const t = await tx.tour.findUnique({ where: { id: tourId }, select: { stock: true } });
          if (t?.stock === -1) {
            await tx.tour.update({ where: { id: tourId }, data: { sold: { increment: quantity } } });
          } else {
            await tx.tour.update({
              where: { id: tourId },
              data: { stock: { decrement: quantity }, sold: { increment: quantity } },
            });
          }
        }
      });
      created += resolvedItems.length;
    }

    const errors =
      errorByMessage.size > 0
        ? Array.from(errorByMessage.entries()).map(([message, rows]) => ({ message, rows: rows.sort((a, b) => a - b) }))
        : undefined;

    return NextResponse.json({
      success: true,
      created,
      skipped,
      totalRows: lines.length - 1,
      errors,
    });
  } catch (err) {
    console.error("Import sales error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al importar ventas" },
      { status: 500 }
    );
  }
}
