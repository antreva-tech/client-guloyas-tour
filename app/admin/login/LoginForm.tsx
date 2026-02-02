"use client";

import { useActionState } from "react";

interface LoginFormProps {
  action: (formData: FormData) => Promise<{ error: string } | undefined>;
}

/**
 * Client component for admin/supervisor login form.
 * Username optional: empty = admin/support; filled = supervisor lookup.
 */
export function LoginForm({ action }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prevState: { error: string } | null, formData: FormData) => {
      const result = await action(formData);
      return result ?? null;
    },
    null
  );

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-lg text-sm">
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-jet/80 mb-2"
        >
          Usuario (opcional)
        </label>
        <input
          type="text"
          id="username"
          name="username"
          autoComplete="username"
          className="w-full bg-pearl border border-gold-200/50 rounded-lg px-4 py-3 text-jet placeholder-jet/40 focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-transparent transition-all"
          placeholder="Dejar vacío para admin/soporte"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-jet/80 mb-2"
        >
          Contraseña
        </label>
        <input
          type="password"
          id="password"
          name="password"
          required
          autoComplete="current-password"
          className="w-full bg-pearl border border-gold-200/50 rounded-lg px-4 py-3 text-jet placeholder-jet/40 focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-transparent transition-all"
          placeholder="Ingresa tu contraseña"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full btn-primary py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Verificando..." : "Iniciar Sesión"}
      </button>
    </form>
  );
}

interface AdminSetupFormProps {
  action: (formData: FormData) => Promise<{ error: string } | undefined>;
  requiresCurrentPassword: boolean;
}

/**
 * Client component for initial admin password setup.
 * Optionally requests current password when bootstrap hash exists.
 */
export function AdminSetupForm({
  action,
  requiresCurrentPassword,
}: AdminSetupFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prevState: { error: string } | null, formData: FormData) => {
      const result = await action(formData);
      return result ?? null;
    },
    null
  );

  return (
    <form action={formAction} className="space-y-5">
      {/* Error message */}
      {state?.error && (
        <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-lg text-sm">
          {state.error}
        </div>
      )}

      {requiresCurrentPassword && (
        <div>
          <label
            htmlFor="currentPassword"
            className="block text-sm font-medium text-jet/80 mb-2"
          >
            Contraseña actual
          </label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            required
            className="w-full bg-pearl border border-gold-200/50 rounded-lg px-4 py-3 text-jet placeholder-jet/40 focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-transparent transition-all"
            placeholder="Ingresa la contraseña actual"
          />
        </div>
      )}

      <div>
        <label
          htmlFor="newPassword"
          className="block text-sm font-medium text-jet/80 mb-2"
        >
          Nueva contraseña
        </label>
        <input
          type="password"
          id="newPassword"
          name="newPassword"
          required
          minLength={8}
          className="w-full bg-pearl border border-gold-200/50 rounded-lg px-4 py-3 text-jet placeholder-jet/40 focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-transparent transition-all"
          placeholder="Crea una contraseña segura"
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-jet/80 mb-2"
        >
          Confirmar contraseña
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          required
          minLength={8}
          className="w-full bg-pearl border border-gold-200/50 rounded-lg px-4 py-3 text-jet placeholder-jet/40 focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-transparent transition-all"
          placeholder="Repite la contraseña"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full btn-primary py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Guardando..." : "Guardar contraseña"}
      </button>
    </form>
  );
}
