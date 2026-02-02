import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createMonthlySnapshot } from "@/lib/monthlySnapshot";
import { requireAdminOrSupport } from "@/lib/apiAuth";

/**
 * Escapes a value for CSV to prevent formula injection.
 * Prefixes potentially dangerous characters with a single quote.
 * @param value - The raw value.
 * @returns Escaped value safe for CSV.
 */
function escapeFormulaInjection(value: string): string {
  const dangerousChars = ["=", "+", "-", "@", "\t", "\r"];
  if (dangerousChars.some((char) => value.startsWith(char))) {
    return `'${value}`;
  }
  return value;
}

/**
 * Converts data to CSV format.
 * @param headers - Column headers.
 * @param rows - Data rows.
 * @returns CSV string.
 */
function toCSV(headers: string[], rows: string[][]): string {
  const escapeCsvValue = (value: string) => {
    // First escape formula injection
    const safeValue = escapeFormulaInjection(value);
    if (safeValue.includes(",") || safeValue.includes('"') || safeValue.includes("\n")) {
      return `"${safeValue.replace(/"/g, '""')}"`;
    }
    return safeValue;
  };

  const headerLine = headers.map(escapeCsvValue).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsvValue).join(","));

  return [headerLine, ...dataLines].join("\n");
}

/**
 * GET /api/export
 * Exports data as CSV for Excel/Google Sheets.
 * Requires admin authentication.
 * Query params:
 *   - type: "products" | "sales" | "monthly"
 *   - month: MM (optional, for filtering)
 *   - year: YYYY (optional, for filtering)
 * @returns CSV file download.
 */
export async function GET(request: NextRequest) {
  // Require admin authentication
  const authError = await requireAdminOrSupport();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "products";
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    let csv = "";
    let filename = "";

    if (type === "products") {
      // Export all products
      const products = await db.product.findMany({
        orderBy: { createdAt: "desc" },
      });

      const headers = [
        "ID",
        "Nombre",
        "Línea",
        "Descripción",
        "Precio (RD$)",
        "Stock",
        "Vendido",
        "Ingresos (RD$)",
        "Estado",
        "Fecha Creación",
      ];

      const rows = products.map((p) => [
        p.id,
        p.name,
        p.line,
        p.description,
        p.price.toString(),
        p.stock.toString(),
        p.sold.toString(),
        (p.price * p.sold).toString(),
        p.isActive ? "Activo" : "Inactivo",
        p.createdAt.toISOString().split("T")[0],
      ]);

      csv = toCSV(headers, rows);
      filename = `productos_${new Date().toISOString().split("T")[0]}.csv`;
    } else if (type === "sales") {
      // Export sales with optional date filtering
      const whereClause: Record<string, unknown> = {};

      if (year && month) {
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        whereClause.createdAt = {
          gte: startDate,
          lte: endDate,
        };
      } else if (year) {
        const startDate = new Date(parseInt(year), 0, 1);
        const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);
        whereClause.createdAt = {
          gte: startDate,
          lte: endDate,
        };
      }

      const sales = await db.sale.findMany({
        where: whereClause,
        include: { product: true },
        orderBy: { createdAt: "desc" },
      });

      const headers = [
        "ID",
        "Producto",
        "Línea",
        "Cantidad",
        "Total (RD$)",
        "Notas",
        "Fecha",
      ];

      const rows = sales.map((s) => [
        s.id,
        s.product.name,
        s.product.line,
        s.quantity.toString(),
        s.total.toString(),
        s.notes || "",
        s.createdAt.toISOString().split("T")[0],
      ]);

      csv = toCSV(headers, rows);
      const dateStr = year && month ? `${year}-${month}` : year || "todos";
      filename = `ventas_${dateStr}.csv`;
    } else if (type === "monthly") {
      // Export monthly summaries
      const summaries = await db.monthlySummary.findMany({
        orderBy: [{ year: "desc" }, { month: "desc" }],
      });

      const headers = [
        "Año",
        "Mes",
        "Ingresos Totales (RD$)",
        "Unidades Vendidas",
        "Productos Activos",
        "Fecha Registro",
      ];

      const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
      ];

      const rows = summaries.map((s) => [
        s.year.toString(),
        monthNames[s.month - 1],
        s.totalRevenue.toString(),
        s.totalSold.toString(),
        s.totalProducts.toString(),
        s.createdAt.toISOString().split("T")[0],
      ]);

      csv = toCSV(headers, rows);
      filename = `resumen_mensual_${new Date().toISOString().split("T")[0]}.csv`;
    } else if (type === "summary") {
      // Export current summary snapshot
      const products = await db.product.findMany();

      const totalRevenue = products.reduce((sum, p) => sum + p.price * p.sold, 0);
      const totalSold = products.reduce((sum, p) => sum + p.sold, 0);
      const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
      const activeProducts = products.filter((p) => p.isActive).length;

      const headers = ["Métrica", "Valor"];
      const rows = [
        ["Ingresos Totales (RD$)", totalRevenue.toString()],
        ["Total Unidades Vendidas", totalSold.toString()],
        ["Total en Inventario", totalStock.toString()],
        ["Productos Activos", activeProducts.toString()],
        ["Productos Totales", products.length.toString()],
        ["Fecha del Reporte", new Date().toISOString().split("T")[0]],
      ];

      csv = toCSV(headers, rows);
      filename = `resumen_${new Date().toISOString().split("T")[0]}.csv`;
    } else {
      return NextResponse.json(
        { error: "Invalid export type" },
        { status: 400 }
      );
    }

    // Return CSV with proper headers for download
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/export/snapshot
 * Creates a monthly snapshot of current data.
 * Requires admin authentication.
 * Should be called at end of each month.
 */
export async function POST() {
  // Require admin authentication
  const authError = await requireAdminOrSupport();
  if (authError) return authError;

  try {
    const summary = await createMonthlySnapshot();
    return NextResponse.json(summary, { status: 201 });
  } catch (error) {
    console.error("Snapshot error:", error);
    return NextResponse.json(
      { error: "Failed to create snapshot" },
      { status: 500 }
    );
  }
}
