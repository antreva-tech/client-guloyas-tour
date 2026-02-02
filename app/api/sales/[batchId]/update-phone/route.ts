import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSupervisorOrAbove, getApiSessionContext } from "@/lib/apiAuth";
import { UpdatePhoneSchema, formatZodError } from "@/lib/validation";

/**
 * Updates the customer phone in notes field for all sales in a batch.
 * @param notes - Current notes string.
 * @param newPhone - New phone number to set.
 * @returns Updated notes string.
 */
function updatePhoneInNotes(notes: string | null, newPhone: string): string {
  if (!notes) {
    return newPhone ? `Tel: ${newPhone}` : "";
  }

  // Check if there's an existing phone pattern
  const phonePattern = /Tel:\s*[^|]*/i;
  const hasPhone = phonePattern.test(notes);

  if (hasPhone) {
    // Replace existing phone
    if (newPhone) {
      return notes.replace(phonePattern, `Tel: ${newPhone}`);
    }
    // Remove phone if new phone is empty
    return notes
      .replace(phonePattern, "")
      .replace(/^\s*\|\s*/, "")
      .replace(/\s*\|\s*$/, "")
      .replace(/\|\s*\|/g, "|")
      .trim();
  }

  // No existing phone, add new one
  if (newPhone) {
    // Check if there's a cliente pattern to insert after
    const clienteMatch = notes.match(/Cliente:\s*[^|]+/i);
    if (clienteMatch) {
      return notes.replace(clienteMatch[0], `${clienteMatch[0]} | Tel: ${newPhone}`);
    }
    // Just prepend the phone
    return `Tel: ${newPhone} | ${notes}`;
  }

  return notes;
}

/**
 * PATCH /api/sales/[batchId]/update-phone
 * Updates customer phone number for a sale batch.
 * Requires admin authentication.
 * @param request - Request with new phone number.
 * @param context - Route context containing params promise.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ batchId: string }> }
) {
  const authError = await requireSupervisorOrAbove();
  if (authError) return authError;

  const session = await getApiSessionContext();
  const supervisorFilter =
    session.role === "supervisor" && session.supervisorName
      ? { supervisor: session.supervisorName }
      : {};

  try {
    const { batchId } = await context.params;
    if (!batchId) {
      return NextResponse.json({ error: "Missing batchId" }, { status: 400 });
    }

    const rawBody = await request.json().catch(() => ({}));

    // Validate input with Zod schema
    const parsed = UpdatePhoneSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { phone } = parsed.data;

    const sales = await db.sale.findMany({
      where: { batchId, ...supervisorFilter },
    });

    if (sales.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Update notes for all sales in the batch
    await db.$transaction(async (tx) => {
      for (const sale of sales) {
        const updatedNotes = updatePhoneInNotes(sale.notes, phone.trim());
        await tx.sale.update({
          where: { id: sale.id },
          data: { notes: updatedNotes || null },
        });
      }
    });

    return NextResponse.json({
      message: "Phone number updated successfully",
    });
  } catch (error) {
    console.error("Error updating phone:", error);
    return NextResponse.json(
      { error: "Failed to update phone number" },
      { status: 500 }
    );
  }
}
