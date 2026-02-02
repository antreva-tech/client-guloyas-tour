"use client";

import { useActionState, useState, useRef } from "react";
import type { AdminSettingsDTO } from "@/lib/settings";
import { SellerManagementSection } from "@/components/SellerManagementSection";
import { UserManagementSection } from "@/components/UserManagementSection";

interface SettingsFormProps {
  initialSettings: AdminSettingsDTO;
  onChangePassword: (formData: FormData) => Promise<{ error?: string; success?: string }>;
  onUpdateSettings: (formData: FormData) => Promise<{ error?: string; success?: string }>;
  role?: "admin" | "support";
}

/**
 * Client component for admin settings forms.
 * Handles password change, users, dashboard configuration, export and import.
 */
export function SettingsForm({
  initialSettings,
  onChangePassword,
  onUpdateSettings,
  role = "admin",
}: SettingsFormProps) {
  return (
    <div className="space-y-8">
      <PasswordChangeForm action={onChangePassword} role={role} />
      <SellerManagementSection />
      <UserManagementSection />
      <DashboardSettingsForm
        initialSettings={initialSettings}
        action={onUpdateSettings}
      />
      <ExportImportSection />
    </div>
  );
}

/**
 * Password change form component.
 * For support: resets admin password (enter support password as current).
 */
function PasswordChangeForm({
  action,
  role = "admin",
}: {
  action: (formData: FormData) => Promise<{ error?: string; success?: string }>;
  role?: "admin" | "support";
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prevState: { error?: string; success?: string } | null, formData: FormData) => {
      const result = await action(formData);
      return result;
    },
    null
  );

  const isSupport = role === "support";

  return (
    <div className="bg-porcelain rounded-xl border border-gold-200/50 p-6">
      <h2 className="text-lg font-semibold text-jet mb-4">
        {isSupport ? "Resetear Contraseña de Admin" : "Cambiar Contraseña"}
      </h2>
      <p className="text-jet/60 text-sm mb-6">
        {isSupport
          ? "Ingresa tu contraseña de soporte para autorizar el cambio de contraseña del administrador."
          : "Actualiza tu contraseña de administrador. Deberás ingresar tu contraseña actual para confirmar el cambio."}
      </p>

      <form action={formAction} className="space-y-4">
        {/* Success message */}
        {state?.success && (
          <div className="bg-success/10 border border-success/30 text-success px-4 py-3 rounded-lg text-sm">
            {state.success}
          </div>
        )}

        {/* Error message */}
        {state?.error && (
          <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-lg text-sm">
            {state.error}
          </div>
        )}

        <div>
          <label
            htmlFor="currentPassword"
            className="block text-sm font-medium text-jet/80 mb-1.5"
          >
            {isSupport ? "Tu contraseña de soporte" : "Contraseña Actual"}
          </label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            required
            className="w-full bg-pearl border border-gold-200/50 rounded-lg px-4 py-2.5 text-jet placeholder-jet/40 focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-transparent"
            placeholder="Ingresa tu contraseña actual"
          />
        </div>

        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium text-jet/80 mb-1.5"
          >
            Nueva Contraseña
          </label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            required
            minLength={8}
            className="w-full bg-pearl border border-gold-200/50 rounded-lg px-4 py-2.5 text-jet placeholder-jet/40 focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-transparent"
            placeholder="Mínimo 8 caracteres"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-jet/80 mb-1.5"
          >
            Confirmar Nueva Contraseña
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            required
            minLength={8}
            className="w-full bg-pearl border border-gold-200/50 rounded-lg px-4 py-2.5 text-jet placeholder-jet/40 focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-transparent"
            placeholder="Repite la nueva contraseña"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {isPending ? "Actualizando..." : "Cambiar Contraseña"}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Dashboard settings form component.
 */
function DashboardSettingsForm({
  initialSettings,
  action,
}: {
  initialSettings: AdminSettingsDTO;
  action: (formData: FormData) => Promise<{ error?: string; success?: string }>;
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prevState: { error?: string; success?: string } | null, formData: FormData) => {
      const result = await action(formData);
      return result;
    },
    null
  );

  return (
    <div className="bg-porcelain rounded-xl border border-gold-200/50 p-6">
      <h2 className="text-lg font-semibold text-jet mb-4">Configuración del Panel</h2>
      <p className="text-jet/60 text-sm mb-6">
        Personaliza el comportamiento del panel de administración.
      </p>

      <form action={formAction} className="space-y-4">
        {/* Success message */}
        {state?.success && (
          <div className="bg-success/10 border border-success/30 text-success px-4 py-3 rounded-lg text-sm">
            {state.success}
          </div>
        )}

        {/* Error message */}
        {state?.error && (
          <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-lg text-sm">
            {state.error}
          </div>
        )}

        <div>
          <label
            htmlFor="lowStockThreshold"
            className="block text-sm font-medium text-jet/80 mb-1.5"
          >
            Umbral de Stock Bajo
          </label>
          <p className="text-jet/50 text-xs mb-2">
            Los productos con stock igual o menor a este número aparecerán en las alertas de inventario.
          </p>
          <input
            type="number"
            id="lowStockThreshold"
            name="lowStockThreshold"
            min={0}
            max={1000}
            defaultValue={initialSettings.lowStockThreshold}
            required
            className="w-full max-w-xs bg-pearl border border-gold-200/50 rounded-lg px-4 py-2.5 text-jet placeholder-jet/40 focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-transparent"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="bg-aqua-700 hover:bg-aqua-700/90 text-white px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {isPending ? "Guardando..." : "Guardar Configuración"}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Export data (CSV download) and Import sales (CSV upload) section.
 * Export uses GET /api/export; import uses POST /api/import/sales.
 */
function ExportImportSection() {
  const [importResult, setImportResult] = useState<{
    created?: number;
    skipped?: number;
    totalRows?: number;
    errors?: { row: number; message: string }[];
    error?: string;
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Triggers CSV download for the given export type.
   * Uses same API as dashboard export (sends cookies automatically).
   */
  function handleExport(type: string) {
    const url = `/api/export?type=${type}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Uploads CSV file to import sales. Shows created count and per-row errors.
   */
  async function handleImportSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setImportResult({ error: "Selecciona un archivo CSV." });
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import/sales", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setImportResult({ error: data.error || "Error al importar" });
        return;
      }
      setImportResult({
        created: data.created,
        skipped: data.skipped,
        totalRows: data.totalRows,
        errors: data.errors,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setImportResult({ error: "Error de conexión" });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="bg-porcelain rounded-xl border border-gold-200/50 p-6">
      <h2 className="text-lg font-semibold text-jet mb-4">Exportar e importar datos</h2>
      <p className="text-jet/60 text-sm mb-6">
        Exporta datos en CSV para Excel o Google Sheets. Importa ventas desde un CSV exportado de tu sistema anterior (p. ej. Google Sheets).
      </p>

      {/* Export */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-jet/80 mb-2">Exportar (descargar CSV)</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleExport("products")}
            className="bg-aqua-700/10 hover:bg-aqua-700/20 text-aqua-700 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          >
            Productos
          </button>
          <button
            type="button"
            onClick={() => handleExport("summary")}
            className="bg-gold-500/10 hover:bg-gold-500/20 text-gold-500 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          >
            Resumen
          </button>
          <button
            type="button"
            onClick={() => handleExport("sales")}
            className="bg-success/10 hover:bg-success/20 text-success px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          >
            Ventas
          </button>
          <button
            type="button"
            onClick={() => handleExport("monthly")}
            className="bg-jet/10 hover:bg-jet/20 text-jet px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          >
            Historial mensual
          </button>
        </div>
      </div>

      {/* Import */}
      <div>
        <h3 className="text-sm font-medium text-jet/80 mb-2">Importar ventas desde CSV (Google Sheets, etc.)</h3>
        <p className="text-jet/50 text-xs mb-3">
          El CSV debe tener encabezados. Requeridas: producto, cantidad, total. Opcionales (igual que la venta): abono, pendiente, fecha/fecha entrega/fecha visita, cliente, teléfono, cédula, provincia, municipio, dirección, lugar de trabajo, supervisor, vendedor, pagado, nota.
        </p>
        <form onSubmit={handleImportSubmit} className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="import-csv" className="block text-xs text-jet/60 mb-1">
              Archivo CSV
            </label>
            <input
              ref={fileInputRef}
              id="import-csv"
              type="file"
              accept=".csv,text/csv"
              className="block w-full text-sm text-jet file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-aqua-700/10 file:text-aqua-700 file:font-medium file:cursor-pointer"
            />
          </div>
          <button
            type="submit"
            disabled={importing}
            className="bg-aqua-700 hover:bg-aqua-700/90 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {importing ? "Importando..." : "Importar ventas"}
          </button>
        </form>

        {importResult && (
          <div className={`mt-4 p-4 rounded-lg text-sm ${importResult.error ? "bg-danger/10 border border-danger/30 text-danger" : "bg-success/10 border border-success/30 text-success"}`}>
            {importResult.error ? (
              <p>{importResult.error}</p>
            ) : (
              <>
                <p>
                  Importadas <strong>{importResult.created ?? 0}</strong> de {importResult.totalRows ?? 0} filas.
                  {typeof importResult.skipped === "number" && importResult.skipped > 0 && (
                    <> Omitidas <strong>{importResult.skipped}</strong> (ya existían).</>
                  )}
                </p>
                {importResult.errors && importResult.errors.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-jet/80">Ver errores ({importResult.errors.length})</summary>
                    <ul className="mt-2 list-disc list-inside text-jet/70 text-xs">
                      {importResult.errors.slice(0, 20).map((e, i) => (
                        <li key={i}>
                          {"rows" in e && Array.isArray(e.rows)
                            ? `${e.message} — filas: ${(e as { message: string; rows: number[] }).rows.join(", ")}`
                            : `Fila ${(e as { row: number; message: string }).row}: ${(e as { row: number; message: string }).message}`}
                        </li>
                      ))}
                      {importResult.errors.length > 20 && (
                        <li>… y {importResult.errors.length - 20} más</li>
                      )}
                    </ul>
                  </details>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
