"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { validatePassword } from "@/lib/passwordPolicy";

/**
 * Client form for first-login password change.
 * Calls PATCH /api/users/me/password.
 */
export function ChangePasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const form = e.currentTarget;
    const newPassword = (form.elements.namedItem("newPassword") as HTMLInputElement)?.value;
    const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement)?.value;

    if (!newPassword || !confirmPassword) {
      setError("Completa todos los campos");
      setIsPending(false);
      return;
    }

    const pwdValidation = validatePassword(newPassword);
    if (!pwdValidation.valid) {
      setError(pwdValidation.error ?? "Contraseña inválida");
      setIsPending(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setIsPending(false);
      return;
    }

    try {
      const res = await fetch("/api/users/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Error al cambiar contraseña");
        setIsPending(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Error de conexión");
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-lg text-sm">
          {error}
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
          className="w-full bg-pearl border border-gold-200/50 rounded-lg px-4 py-3 text-jet placeholder-jet/40 focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-transparent"
          placeholder="Mín. 8 caracteres, mayúscula, minúscula y número"
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
          className="w-full bg-pearl border border-gold-200/50 rounded-lg px-4 py-3 text-jet placeholder-jet/40 focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-transparent"
          placeholder="Repite la contraseña"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full btn-primary py-3 rounded-lg font-semibold disabled:opacity-50"
      >
        {isPending ? "Guardando..." : "Guardar y continuar"}
      </button>
    </form>
  );
}
