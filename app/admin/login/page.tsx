import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import {
  getSessionContext,
  getPasswordRole,
  createSession,
  verifyUserByUsername,
  hasStoredAdminPassword,
  hasBootstrapPassword,
  verifyBootstrapPassword,
  createAdminPassword,
  getSafeRedirect,
} from "@/lib/auth";
import { brandConfig } from "@/lib/brandConfig";
import { validatePassword } from "@/lib/passwordPolicy";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rateLimit";
import { AdminSetupForm, LoginForm } from "./LoginForm";

/** Force dynamic rendering to ensure fresh cookie reads. */
export const dynamic = "force-dynamic";

/**
 * Admin login page.
 * Redirects to dashboard if already authenticated.
 */
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  // Check if already logged in
  const session = await getSessionContext();
  if (session.isValid) {
    redirect("/admin");
  }

  const params = await searchParams;
  const redirectTo = getSafeRedirect(params.redirect);
  const hasStoredPassword = await hasStoredAdminPassword();
  const requiresCurrentPassword = !hasStoredPassword && hasBootstrapPassword();

  /**
   * Server action to handle login form submission.
   * If username provided: lookup User (supervisor). If empty: admin/support password.
   */
  async function handleLogin(formData: FormData) {
    "use server";

    const headersList = await headers();
    const clientIp = getClientIp(headersList);
    const rateLimitId = `login:${clientIp}`;
    const rateLimit = await checkRateLimit(rateLimitId, RATE_LIMITS.login);
    if (!rateLimit.allowed) {
      const waitSeconds = Math.ceil(rateLimit.resetIn / 1000);
      return { error: `Demasiados intentos. Espera ${waitSeconds} segundos.` };
    }

    const username = (formData.get("username") as string)?.trim();
    const password = formData.get("password") as string;
    if (!password) return { error: "Contraseña requerida" };

    if (username) {
      const user = await verifyUserByUsername(username, password);
      if (!user) return { error: "Usuario o contraseña incorrectos" };
      await createSession({
        role: "supervisor",
        userId: user.id,
        supervisorName: user.supervisorName,
        mustChangePassword: user.mustChangePassword,
      });
      if (user.mustChangePassword) redirect("/admin/change-password");
      redirect(redirectTo);
    }

    const role = await getPasswordRole(password);
    if (!role) return { error: "Contraseña incorrecta" };
    await createSession(role);
    redirect(redirectTo);
  }

  /**
   * Server action to handle initial password setup.
   */
  async function handleSetup(formData: FormData) {
    "use server";

    const headersList = await headers();
    const clientIp = getClientIp(headersList);
    const rateLimitId = `password:setup:${clientIp}`;
    const rateLimit = await checkRateLimit(rateLimitId, RATE_LIMITS.passwordChange);
    if (!rateLimit.allowed) {
      const waitSeconds = Math.ceil(rateLimit.resetIn / 1000);
      return { error: `Demasiados intentos. Espera ${waitSeconds} segundos.` };
    }

    const currentPassword = (formData.get("currentPassword") as string) || "";
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

    if (requiresCurrentPassword) {
      if (!currentPassword) {
        return { error: "La contraseña actual es requerida" };
      }

      const isValidBootstrap = verifyBootstrapPassword(currentPassword);
      if (!isValidBootstrap) {
        return { error: "La contraseña actual es incorrecta" };
      }
    }

    const created = await createAdminPassword(newPassword);
    if (!created) {
      return { error: "La contraseña ya está configurada" };
    }

    await createSession("admin");
    redirect(redirectTo);
  }

  return (
    <main className="min-h-screen bg-pearl flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-porcelain rounded-2xl p-8 border border-gold-200/50 shadow-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-jet mb-2">
              Panel de Administración
            </h1>
            <p className="text-jet/60 text-sm">
              {brandConfig.brandName} — Acceso restringido
            </p>
          </div>

          {/* Login or setup form */}
          {hasStoredPassword ? (
            <LoginForm action={handleLogin} />
          ) : (
            <>
              <p className="text-jet/60 text-sm mb-5 text-center">
                Configura tu contraseña de administrador.
              </p>
              <AdminSetupForm
                action={handleSetup}
                requiresCurrentPassword={requiresCurrentPassword}
              />
            </>
          )}
        </div>

        {/* Back to site */}
        <div className="text-center mt-6 space-y-2">
          <p>
            <Link
              href="/"
              className="text-aqua-700 hover:text-aqua-500 text-sm transition-colors"
            >
              ← Volver al sitio
            </Link>
          </p>
          <p>
            <Link
              href="/admin/login/support"
              className="text-jet/40 hover:text-jet/60 text-xs transition-colors"
            >
              Acceso de soporte
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
