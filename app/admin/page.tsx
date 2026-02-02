import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { destroySession, getSessionContext, resetAdminPassword } from "@/lib/auth";
import { brandConfig } from "@/lib/brandConfig";
import { validatePassword } from "@/lib/passwordPolicy";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rateLimit";
import { getAllProducts } from "@/lib/products";
import { getAdminSettings } from "@/lib/settings";
import { AdminDashboard } from "./AdminDashboard";
import { SupportResetPanel } from "@/components/SupportResetPanel";
import type { Product } from "@prisma/client";

/** Force dynamic rendering to ensure fresh cookie reads. */
export const dynamic = "force-dynamic";

/**
 * Admin dashboard page.
 * Displays product management interface.
 */
export default async function AdminPage() {
  const session = await getSessionContext();
  if (!session.isValid) redirect("/admin/login");

  if (session.role === "supervisor" && session.mustChangePassword) {
    redirect("/admin/change-password");
  }

  const canSupportReset = session.role === "support";

  // Fetch all products and settings for admin (graceful fallback if DB unavailable)
  let products: Product[] = [];
  let lowStockThreshold = 5;
  let dbError = false;
  try {
    const [fetchedProducts, settings] = await Promise.all([
      getAllProducts(),
      getAdminSettings(),
    ]);
    products = fetchedProducts;
    lowStockThreshold = settings.lowStockThreshold;
  } catch {
    dbError = true;
  }

  /**
   * Server action to handle logout.
   */
  async function handleLogout() {
    "use server";
    await destroySession();
    redirect("/admin/login");
  }

  /**
   * Server action to reset admin password from support access.
   * Support role can reset password to help recover locked-out admin accounts.
   */
  async function handleSupportReset(formData: FormData) {
    "use server";

    const currentSession = await getSessionContext();
    if (!currentSession.isValid || currentSession.role !== "support") {
      return { error: "No autorizado" };
    }

    const headersList = await headers();
    const clientIp = getClientIp(headersList);
    const rateLimitId = `password:support-reset:${clientIp}`;
    const rateLimit = await checkRateLimit(rateLimitId, RATE_LIMITS.passwordChange);
    if (!rateLimit.allowed) {
      const waitSeconds = Math.ceil(rateLimit.resetIn / 1000);
      return { error: `Demasiados intentos. Espera ${waitSeconds} segundos.` };
    }

    const newPassword = (formData.get("newPassword") as string) || "";
    const confirmPassword = (formData.get("confirmPassword") as string) || "";

    if (!newPassword || !confirmPassword) {
      return { error: "Completa todos los campos" };
    }

    const pwdValidation = validatePassword(newPassword);
    if (!pwdValidation.valid) {
      return { error: pwdValidation.error ?? "Contraseña inválida" };
    }

    if (newPassword !== confirmPassword) {
      return { error: "Las contraseñas no coinciden" };
    }

    await resetAdminPassword(newPassword);
    return { success: "Contraseña actualizada exitosamente" };
  }

  return (
    <main className="min-h-screen bg-pearl">
      {/* Admin header - mobile optimized, light theme */}
      <header className="bg-porcelain border-b border-gold-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between gap-3">
            {/* Logo */}
            <div className="min-w-0">
              <img
                src={brandConfig.logoPath}
                alt={brandConfig.brandName}
                className="h-10 md:h-12 w-auto"
              />
            </div>
            {/* Actions */}
            <div className="flex items-center gap-2 md:gap-4 shrink-0">
              {(session.role === "admin" || session.role === "support") && (
                <Link
                  href="/admin/settings"
                  className="text-jet/60 hover:text-jet text-xs md:text-sm transition-colors"
                >
                  Ajustes
                </Link>
              )}
              <form action={handleLogout}>
                <button
                  type="submit"
                  className="bg-danger hover:bg-danger/90 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm min-h-[40px] transition-colors"
                >
                  Salir
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
        {dbError ? (
          <div className="bg-danger/10 border border-danger/30 rounded-xl p-6 text-center">
            <h2 className="text-xl font-semibold text-danger mb-2">
              Base de datos no disponible
            </h2>
            <p className="text-jet/70 text-sm mb-4">
              Configura las variables DATABASE_URL y DIRECT_URL en tu archivo .env
              con las credenciales de tu base de datos Neon.
            </p>
            <a
              href="https://neon.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="text-aqua-700 hover:underline text-sm"
            >
              Crear base de datos gratis en Neon →
            </a>
          </div>
        ) : (
          <>
            {canSupportReset && (
              <div className="mb-6">
                <SupportResetPanel action={handleSupportReset} />
              </div>
            )}
            <AdminDashboard
              initialProducts={products}
              lowStockThreshold={lowStockThreshold}
              role={session.role ?? "admin"}
              supervisorName={session.supervisorName ?? null}
            />
          </>
        )}
      </div>
    </main>
  );
}
