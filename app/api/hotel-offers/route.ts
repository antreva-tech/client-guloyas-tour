import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getApiSessionContext, requireAdminOrSupport } from "@/lib/apiAuth";
import { z } from "zod";

const CreateHotelOfferSchema = z.object({
  title: z.string().min(1, "Título requerido"),
  description: z.string().min(1, "Descripción requerida"),
  linkUrl: z.string().url("URL inválida"),
  imageUrl: z.string().url().optional().nullable(),
  price: z.number().int().min(0).optional().nullable(), // whole units (e.g. 1500 = RD$ 1,500)
  validFrom: z.string().datetime().optional().nullable(),
  validUntil: z.string().datetime().optional().nullable(),
  sequence: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/hotel-offers
 * Public: active offers within validity window. Admin: ?admin=true returns all.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const admin = searchParams.get("admin") === "true";

    const session = await getApiSessionContext();
    const isAdmin = session.isValid && (session.role === "admin" || session.role === "support");

    if (admin && isAdmin) {
      const offers = await db.hotelOffer.findMany({
        orderBy: [{ sequence: "asc" }, { createdAt: "desc" }],
      });
      return NextResponse.json(offers);
    }

    const now = new Date();
    const offers = await db.hotelOffer.findMany({
      where: {
        isActive: true,
        OR: [
          { validFrom: null, validUntil: null },
          { validFrom: null, validUntil: { gte: now } },
          { validFrom: { lte: now }, validUntil: null },
          { validFrom: { lte: now }, validUntil: { gte: now } },
        ],
      },
      orderBy: [{ sequence: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(offers);
  } catch (error) {
    console.error("Hotel offers list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch hotel offers" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hotel-offers
 * Create hotel offer. Admin/support only.
 */
export async function POST(request: NextRequest) {
  const authError = await requireAdminOrSupport();
  if (authError) return authError;

  try {
    const body = await request.json();
    const parsed = CreateHotelOfferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e) => e.message).join("; ") },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const offer = await db.hotelOffer.create({
      data: {
        title: data.title,
        description: data.description,
        linkUrl: data.linkUrl,
        imageUrl: data.imageUrl ?? null,
        price: data.price ?? null,
        validFrom: data.validFrom ? new Date(data.validFrom) : null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        sequence: data.sequence ?? 0,
        isActive: data.isActive ?? true,
      },
    });

    return NextResponse.json(offer);
  } catch (error) {
    console.error("Hotel offer create error:", error);
    return NextResponse.json(
      { error: "Failed to create hotel offer" },
      { status: 500 }
    );
  }
}
