import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminOrSupport, applyRateLimit } from "@/lib/apiAuth";
import { createPasswordHash } from "@/lib/auth";
import { validatePassword } from "@/lib/passwordPolicy";
import { z } from "zod";

const CreateUserSchema = z.object({
  username: z.string().min(1).max(100).transform((s) => s.trim().toLowerCase()),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .superRefine((p, ctx) => {
      const r = validatePassword(p);
      if (!r.valid) ctx.addIssue({ code: "custom", message: r.error ?? "Contraseña inválida" });
    }),
  role: z.literal("supervisor"),
  supervisorName: z.string().min(1, "Supervisor es requerido").max(200).transform((s) => s.trim()),
});

/**
 * GET /api/users
 * Lists all users (supervisors). Admin or support only.
 */
export async function GET() {
  const authError = await requireAdminOrSupport();
  if (authError) return authError;

  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        supervisorName: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
      orderBy: { username: "asc" },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Error al listar usuarios" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Creates a new supervisor user with temp password.
 * Sets mustChangePassword = true.
 */
export async function POST(request: NextRequest) {
  const authError = await requireAdminOrSupport();
  if (authError) return authError;

  const { error: rateError } = await applyRateLimit("users:create", "apiWrite");
  if (rateError) return rateError;

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = CreateUserSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join("; ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { username, password, supervisorName } = parsed.data;

    const existing = await db.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "El nombre de usuario ya existe" },
        { status: 400 }
      );
    }

    const user = await db.user.create({
      data: {
        username,
        passwordHash: createPasswordHash(password),
        role: "supervisor",
        supervisorName,
        mustChangePassword: true,
      },
      select: {
        id: true,
        username: true,
        role: true,
        supervisorName: true,
        isActive: true,
        mustChangePassword: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 }
    );
  }
}
