"use client";

import { useActionState, useState } from "react";

interface SupportResetPanelProps {
  action: (
    formData: FormData
  ) => Promise<{ error?: string; success?: string } | undefined>;
}

/**
 * Support-only panel for resetting the admin password.
 */
export function SupportResetPanel({ action }: SupportResetPanelProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    async (_prevState: { error?: string; success?: string } | null, formData: FormData) => {
      const result = await action(formData);
      return result ?? null;
    },
    null
  );

  return (
    <section className="bg-porcelain rounded-xl border border-gold-200/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 p-4 md:p-5 text-left hover:bg-gold-200/10 transition-colors"
        aria-expanded={open}
      >
        <h2 className="text-base md:text-lg font-semibold text-jet">
          Soporte: Restablecer contraseña admin
        </h2>
        <span
          className={`shrink-0 text-jet/70 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▼
        </span>
      </button>

      {open && (
        <div className="px-4 md:px-5 pb-4 md:pb-5 pt-0 border-t border-gold-200/50">
          <p className="text-jet/60 text-sm mb-4">
            Usa esta opción solo si el administrador no puede acceder.
          </p>

          {state?.success && (
            <div className="bg-success/10 border border-success/30 text-success px-4 py-3 rounded-lg text-sm mb-3">
              {state.success}
            </div>
          )}
          {state?.error && (
            <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-lg text-sm mb-3">
              {state.error}
            </div>
          )}

          <form action={formAction} className="grid md:grid-cols-2 gap-3">
            <div className="md:col-span-1">
              <label
                htmlFor="supportNewPassword"
                className="block text-sm font-medium text-jet/80 mb-2"
              >
                Nueva contraseña
              </label>
              <input
                type="password"
                id="supportNewPassword"
                name="newPassword"
                required
                minLength={8}
                className="w-full bg-pearl border border-gold-200/50 rounded-lg px-4 py-2.5 text-jet placeholder-jet/40 focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-transparent transition-all"
                placeholder="Crea una contraseña segura"
              />
            </div>

            <div className="md:col-span-1">
              <label
                htmlFor="supportConfirmPassword"
                className="block text-sm font-medium text-jet/80 mb-2"
              >
                Confirmar contraseña
              </label>
              <input
                type="password"
                id="supportConfirmPassword"
                name="confirmPassword"
                required
                minLength={8}
                className="w-full bg-pearl border border-gold-200/50 rounded-lg px-4 py-2.5 text-jet placeholder-jet/40 focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-transparent transition-all"
                placeholder="Repite la contraseña"
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="btn-primary px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Guardando..." : "Restablecer"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
