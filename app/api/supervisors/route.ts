import { NextResponse } from "next/server";
import { requireSupervisorOrAbove } from "@/lib/apiAuth";
import { getSupervisorList } from "@/lib/supervisors";

/**
 * GET /api/supervisors
 * Returns the supervisor list (User + Sale + base).
 * Used by SaleForm and InvoiceHistoryPanel.
 */
export async function GET() {
  const authError = await requireSupervisorOrAbove();
  if (authError) return authError;

  try {
    const list = await getSupervisorList();
    return NextResponse.json(list);
  } catch (error) {
    console.error("Error fetching supervisors:", error);
    return NextResponse.json(
      { error: "Error al cargar supervisores" },
      { status: 500 }
    );
  }
}
