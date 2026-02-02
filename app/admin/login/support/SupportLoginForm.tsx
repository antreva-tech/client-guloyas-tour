"use client";

import { useActionState } from "react";

interface SupportLoginFormProps {
  action: (formData: FormData) => Promise<{ error: string } | undefined>;
}

/**
 * Client component for support bypass login.
 * Handles form submission with loading and error states.
 */
export function SupportLoginForm({ action }: SupportLoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prevState: { error: string } | null, formData: FormData) => {
      const result = await action(formData);
      return result ?? null;
    },
    null
  );

  return (
    <form action={formAction} className="space-y-6">
      {/* Error message */}
      {state?.error && (
        <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-lg text-sm">
          {state.error}
        </div>
      )}

      {/* Password field */}
      <div>
        <label
          htmlFor="supportPassword"
          className="block text-sm font-medium text-jet/80 mb-2"
        >
          Contraseña de soporte
        </label>
        <input
          type="password"
          id="supportPassword"
          name="password"
          required
          autoFocus
          className="w-full bg-pearl border border-gold-200/50 rounded-lg px-4 py-3 text-jet placeholder-jet/40 focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-transparent transition-all"
          placeholder="Contraseña de bypass"
        />
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-aqua-700 hover:bg-aqua-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? "Verificando..." : "Acceder como Soporte"}
      </button>

      {/* Warning */}
      <p className="text-xs text-jet/50 text-center">
        Este acceso es solo para personal de soporte técnico autorizado.
      </p>
    </form>
  );
}
