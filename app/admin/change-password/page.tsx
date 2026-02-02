import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionContext, destroySession } from "@/lib/auth";
import { ChangePasswordForm } from "./ChangePasswordForm";

/** Force dynamic rendering. */
export const dynamic = "force-dynamic";

/**
 * First-login password change page for supervisors.
 * Shown when mustChangePassword === true.
 */
export default async function ChangePasswordPage() {
  const session = await getSessionContext();

  if (!session.isValid || session.role !== "supervisor") {
    redirect("/admin/login");
  }

  if (!session.mustChangePassword) {
    redirect("/admin");
  }

  async function handleLogout() {
    "use server";
    await destroySession();
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-pearl flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-porcelain rounded-2xl p-8 border border-gold-200/50 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-jet mb-2">
              Cambiar Contraseña
            </h1>
            <p className="text-jet/60 text-sm">
              Es tu primer inicio de sesión. Define una contraseña nueva.
            </p>
          </div>

          <ChangePasswordForm />
        </div>

        <div className="text-center mt-6 space-y-2">
          <form action={handleLogout}>
            <button
              type="submit"
              className="text-jet/40 hover:text-jet/60 text-xs transition-colors"
            >
              Cerrar sesión
            </button>
          </form>
          <p>
            <Link
              href="/"
              className="text-aqua-700 hover:text-aqua-500 text-sm"
            >
              ← Volver al sitio
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
