import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminOrSupport, applyRateLimit } from "@/lib/apiAuth";
import { createPasswordHash } from "@/lib/auth";
import { validatePassword } from "@/lib/passwordPolicy";
import { z } from "zod";

const UpdateUserSchema = z.object({
  role: z.literal("supervisor").optional(),
  supervisorName: z
    .optional(z.union([z.string().max(200).transform((s) => s.trim() || null), z.null()])),
  tempPassword: z
    .string()
    .min(8)
    .optional()
    .superRefine((p, ctx) => {
      if (!p) return;
      const r = validatePassword(p);
      if (!r.valid) ctx.addIssue({ code: "custom", message: r.error ?? "Contraseña inválida" });
    }),
  isActive: z.boolean().optional(),
});

/**
 * PATCH /api/users/[id]
 * Updates user: role, supervisorName, temp password, isActive.
 * Admin or support only.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminOrSupport();
  if (authError) return authError;

  const { error: rateError } = await applyRateLimit("users:update", "apiWrite");
  if (rateError) return rateError;

  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const parsed = UpdateUserSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join("; ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const updateData: {
      role?: string;
      supervisorName?: string | null;
      passwordHash?: string;
      mustChangePassword?: boolean;
      isActive?: boolean;
    } = {};

    if (parsed.data.role !== undefined) updateData.role = parsed.data.role;
    if (parsed.data.supervisorName !== undefined) updateData.supervisorName = parsed.data.supervisorName;
    if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;
    if (parsed.data.tempPassword) {
      updateData.passwordHash = createPasswordHash(parsed.data.tempPassword);
      updateData.mustChangePassword = true;
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        supervisorName: true,
        isActive: true,
        mustChangePassword: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 * Revokes access by setting isActive = false (soft delete).
 * Admin or support only. Support account is not in User table.
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminOrSupport();
  if (authError) return authError;

  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    await db.user.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    console.error("Error revoking user:", error);
    return NextResponse.json(
      { error: "Error al revocar acceso" },
      { status: 500 }
    );
  }
}
