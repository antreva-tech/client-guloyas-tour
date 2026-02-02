import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminOrSupport } from "@/lib/apiAuth";
import { z } from "zod";

const UpdateHotelOfferSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  linkUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional().nullable(),
  validFrom: z.string().datetime().optional().nullable(),
  validUntil: z.string().datetime().optional().nullable(),
  sequence: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

/**
 * PATCH /api/hotel-offers/[id]
 * Update hotel offer. Admin/support only.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminOrSupport();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateHotelOfferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e) => e.message).join("; ") },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const update: {
      title?: string;
      description?: string;
      linkUrl?: string;
      imageUrl?: string | null;
      validFrom?: Date | null;
      validUntil?: Date | null;
      sequence?: number;
      isActive?: boolean;
    } = {};
    if (data.title !== undefined) update.title = data.title;
    if (data.description !== undefined) update.description = data.description;
    if (data.linkUrl !== undefined) update.linkUrl = data.linkUrl;
    if (data.imageUrl !== undefined) update.imageUrl = data.imageUrl;
    if (data.validFrom !== undefined) update.validFrom = data.validFrom ? new Date(data.validFrom) : null;
    if (data.validUntil !== undefined) update.validUntil = data.validUntil ? new Date(data.validUntil) : null;
    if (data.sequence !== undefined) update.sequence = data.sequence;
    if (data.isActive !== undefined) update.isActive = data.isActive;

    const offer = await db.hotelOffer.update({
      where: { id },
      data: update,
    });

    return NextResponse.json(offer);
  } catch (error) {
    console.error("Hotel offer update error:", error);
    return NextResponse.json(
      { error: "Failed to update hotel offer" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/hotel-offers/[id]
 * Admin/support only.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminOrSupport();
  if (authError) return authError;

  try {
    const { id } = await params;
    await db.hotelOffer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Hotel offer delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete hotel offer" },
      { status: 500 }
    );
  }
}
