import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getApiSessionContext,
  applyRateLimit,
} from "@/lib/apiAuth";
import { createPasswordHash, createSession } from "@/lib/auth";
import { validatePassword } from "@/lib/passwordPolicy";
import { z } from "zod";

const ChangePasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .superRefine((p, ctx) => {
        const r = validatePassword(p);
        if (!r.valid) ctx.addIssue({ code: "custom", message: r.error ?? "Contraseña inválida" });
      }),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

/**
 * PATCH /api/users/me/password
 * First-login password change for supervisor.
 * Requires mustChangePassword === true; updates hash and sets mustChangePassword = false.
 */
export async function PATCH(request: NextRequest) {
  const session = await getApiSessionContext();
  if (!session.isValid || !session.role || !session.userId) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  if (session.role !== "supervisor") {
    return NextResponse.json(
      { error: "Solo supervisores pueden usar esta acción" },
      { status: 403 }
    );
  }

  const { error: rateError } = await applyRateLimit(
    "users:me:password",
    "apiWrite"
  );
  if (rateError) return rateError;

  try {
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { id: true, mustChangePassword: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (!user.mustChangePassword) {
      return NextResponse.json(
        { error: "Ya cambiaste tu contraseña. Usa la opción en Ajustes si necesitas cambiarla de nuevo." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = ChangePasswordSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join("; ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    await db.user.update({
      where: { id: session.userId },
      data: {
        passwordHash: createPasswordHash(parsed.data.newPassword),
        mustChangePassword: false,
      },
    });

    // Create fresh session with mustChangePassword = false
    await createSession({
      role: "supervisor",
      userId: session.userId,
      supervisorName: session.supervisorName ?? null,
      mustChangePassword: false,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Error al cambiar contraseña" },
      { status: 500 }
    );
  }
}
