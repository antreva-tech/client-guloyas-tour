import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import {
  getSessionContext,
  verifyPassword,
  resetAdminPassword,
} from "@/lib/auth";
import { validatePassword } from "@/lib/passwordPolicy";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rateLimit";
import { getAdminSettings, updateAdminSettings } from "@/lib/settings";
import { SettingsForm } from "./SettingsForm";

/** Force dynamic rendering to ensure fresh data. */
export const dynamic = "force-dynamic";

/**
 * Admin settings page.
 * Allows admin to change password and configure dashboard settings.
 */
export default async function AdminSettingsPage() {
  const session = await getSessionContext();

  // Admin and support roles can access settings
  if (!session.isValid || (session.role !== "admin" && session.role !== "support")) {
    redirect("/admin/login");
  }

  // Fetch current settings
  const settings = await getAdminSettings();

  /**
   * Server action to change admin password.
   */
  async function handleChangePassword(formData: FormData) {
    "use server";

    const currentSession = await getSessionContext();
    if (!currentSession.isValid || (currentSession.role !== "admin" && currentSession.role !== "support")) {
      return { error: "No autorizado" };
    }

    const headersList = await headers();
    const clientIp = getClientIp(headersList);
    const rateLimitId = `password:settings:${clientIp}`;
    const rateLimit = await checkRateLimit(rateLimitId, RATE_LIMITS.passwordChange);
    if (!rateLimit.allowed) {
      const waitSeconds = Math.ceil(rateLimit.resetIn / 1000);
      return { error: `Demasiados intentos. Espera ${waitSeconds} segundos.` };
    }

    const currentPassword = (formData.get("currentPassword") as string) || "";
    const newPassword = (formData.get("newPassword") as string) || "";
    const confirmPassword = (formData.get("confirmPassword") as string) || "";

    if (!currentPassword || !newPassword || !confirmPassword) {
      return { error: "Completa todos los campos" };
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword);
    if (!isValidPassword) {
      return { error: "La contraseña actual es incorrecta" };
    }

    const pwdValidation = validatePassword(newPassword);
    if (!pwdValidation.valid) {
      return { error: pwdValidation.error ?? "Contraseña inválida" };
    }

    if (newPassword !== confirmPassword) {
      return { error: "Las contraseñas nuevas no coinciden" };
    }

    await resetAdminPassword(newPassword);
    return { success: "Contraseña actualizada exitosamente" };
  }

  /**
   * Server action to update dashboard settings.
   */
  async function handleUpdateSettings(formData: FormData) {
    "use server";

    const currentSession = await getSessionContext();
    if (!currentSession.isValid || (currentSession.role !== "admin" && currentSession.role !== "support")) {
      return { error: "No autorizado" };
    }

    const lowStockThresholdStr = formData.get("lowStockThreshold") as string;
    const lowStockThreshold = parseInt(lowStockThresholdStr, 10);

    if (Number.isNaN(lowStockThreshold) || lowStockThreshold < 0) {
      return { error: "El umbral de stock bajo debe ser un número positivo" };
    }

    if (lowStockThreshold > 1000) {
      return { error: "El umbral de stock bajo no puede exceder 1000" };
    }

    await updateAdminSettings({ lowStockThreshold });
    return { success: "Configuración actualizada" };
  }

  return (
    <main className="min-h-screen bg-pearl">
      {/* Header */}
      <header className="bg-porcelain border-b border-gold-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-aqua-700 hover:text-aqua-500 text-sm">
                ← Volver al panel
              </Link>
              <h1 className="text-lg font-semibold text-jet">Ajustes</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <SettingsForm
          initialSettings={settings}
          onChangePassword={handleChangePassword}
          onUpdateSettings={handleUpdateSettings}
          role={session.role ?? "admin"}
        />
      </div>
    </main>
  );
}
