import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { getSessionContext, getPasswordRole, createSession, getSafeRedirect } from "@/lib/auth";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rateLimit";
import { SupportLoginForm } from "./SupportLoginForm";

/** Force dynamic rendering to ensure fresh cookie reads. */
export const dynamic = "force-dynamic";

/**
 * Support login page for bypass access.
 * Uses SUPPORT_PASSWORD_HASH from environment.
 */
export default async function SupportLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  // Check if already logged in (any role)
  const session = await getSessionContext();
  if (session.isValid) {
    redirect("/admin");
  }

  const params = await searchParams;
  const redirectTo = getSafeRedirect(params.redirect);

  /**
   * Server action to handle support login.
   */
  async function handleSupportLogin(formData: FormData) {
    "use server";

    const headersList = await headers();
    const clientIp = getClientIp(headersList);
    const rateLimitId = `login:support:${clientIp}`;
    const rateLimit = await checkRateLimit(rateLimitId, RATE_LIMITS.login);
    if (!rateLimit.allowed) {
      const waitSeconds = Math.ceil(rateLimit.resetIn / 1000);
      return { error: `Demasiados intentos. Espera ${waitSeconds} segundos.` };
    }

    const password = formData.get("password") as string;

    if (!password) {
      return { error: "Contraseña requerida" };
    }

    const role = await getPasswordRole(password);
    if (role !== "support") {
      return { error: "Credenciales de soporte inválidas" };
    }

    await createSession("support");
    redirect(redirectTo);
  }

  return (
    <main className="min-h-screen bg-pearl flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-porcelain rounded-2xl p-8 border border-gold-200/50 shadow-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-aqua-100 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-aqua-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-jet mb-2">
              Acceso de Soporte
            </h1>
            <p className="text-jet/60 text-sm">
              Ingresa la contraseña de soporte técnico
            </p>
          </div>

          <SupportLoginForm action={handleSupportLogin} />
        </div>

        {/* Back links */}
        <div className="text-center mt-6 space-y-2">
          <p>
            <Link
              href="/admin/login"
              className="text-aqua-700 hover:text-aqua-500 text-sm transition-colors"
            >
              ← Volver al login
            </Link>
          </p>
          <p>
            <Link
              href="/"
              className="text-jet/50 hover:text-jet/70 text-xs transition-colors"
            >
              Ir al sitio
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
