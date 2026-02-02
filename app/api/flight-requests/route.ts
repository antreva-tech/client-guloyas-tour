import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminOrSupport } from "@/lib/apiAuth";
import { z } from "zod";

const CreateFlightRequestSchema = z.object({
  departureAirport: z.string().min(1, "Aeropuerto de salida requerido"),
  arrivalAirport: z.string().min(1, "Aeropuerto de llegada requerido"),
  travelDate: z.string().min(1, "Fecha requerida"),
  isRoundTrip: z.boolean().default(false),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

/**
 * POST /api/flight-requests
 * Create a flight request (public). Submissions stored for follow-up.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateFlightRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e) => e.message).join("; ") },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const travelDate = new Date(data.travelDate);
    if (Number.isNaN(travelDate.getTime())) {
      return NextResponse.json(
        { error: "Fecha inválida" },
        { status: 400 }
      );
    }

    const flightRequest = await db.flightRequest.create({
      data: {
        departureAirport: data.departureAirport.trim(),
        arrivalAirport: data.arrivalAirport.trim(),
        travelDate,
        isRoundTrip: data.isRoundTrip,
        customerName: data.customerName?.trim() || null,
        customerPhone: data.customerPhone?.trim() || null,
        customerEmail: data.customerEmail?.trim() || null,
        notes: data.notes?.trim() || null,
      },
    });

    return NextResponse.json(flightRequest);
  } catch (error) {
    console.error("Flight request create error:", error);
    return NextResponse.json(
      { error: "Error al enviar la solicitud" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/flight-requests
 * List flight requests. Admin/support only.
 */
export async function GET() {
  const authError = await requireAdminOrSupport();
  if (authError) return authError;

  try {
    const requests = await db.flightRequest.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(requests);
  } catch (error) {
    console.error("Flight requests list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch flight requests" },
      { status: 500 }
    );
  }
}
