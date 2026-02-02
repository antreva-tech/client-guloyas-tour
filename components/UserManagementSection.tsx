"use client";

import { useState, useEffect } from "react";
import { validatePassword } from "@/lib/passwordPolicy";

interface User {
  id: string;
  username: string;
  role: string;
  supervisorName: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

/**
 * User management UI for Ajustes.
 * Create and edit supervisor users. Admin and support only.
 */
export function UserManagementSection() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Error al cargar usuarios");
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="bg-porcelain rounded-xl border border-gold-200/50 p-6">
      <h2 className="text-lg font-semibold text-jet mb-4">Usuarios</h2>
      <p className="text-jet/60 text-sm mb-6">
        Crea y gestiona usuarios supervisores. Solo supervisores se gestionan aquí (admin y soporte son por entorno).
      </p>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-success/10 border border-success/30 text-success px-4 py-3 rounded-lg text-sm mb-4">
          {success}
        </div>
      )}

      {!creating ? (
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setError(null);
            setSuccess(null);
          }}
          className="bg-aqua-700 hover:bg-aqua-700/90 text-white px-4 py-2 rounded-lg text-sm font-medium mb-6"
        >
          + Crear usuario
        </button>
      ) : (
        <CreateUserForm
          onCreated={() => {
            setCreating(false);
            setSuccess("Usuario creado");
            loadUsers();
          }}
          onCancel={() => setCreating(false)}
          onError={(msg) => setError(msg)}
        />
      )}

      {loading ? (
        <p className="text-jet/50 text-sm">Cargando...</p>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              isEditing={editingId === u.id}
              onEdit={() => setEditingId(u.id)}
              onCancelEdit={() => setEditingId(null)}
              onSaved={() => {
                setEditingId(null);
                setSuccess("Usuario actualizado");
                loadUsers();
              }}
              onError={(msg) => setError(msg)}
              onRevoked={() => {
                setSuccess("Acceso revocado");
                loadUsers();
              }}
            />
          ))}
          {users.length === 0 && !loading && (
            <p className="text-jet/50 text-sm">No hay usuarios.</p>
          )}
        </div>
      )}
    </div>
  );
}

function CreateUserForm({
  onCreated,
  onCancel,
  onError,
}: {
  onCreated: () => void;
  onCancel: () => void;
  onError: (msg: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [supervisorName, setSupervisorName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) {
      onError("Usuario requerido");
      return;
    }
    const pwdValidation = validatePassword(password);
    if (!pwdValidation.valid) {
      onError(pwdValidation.error ?? "Contraseña inválida");
      return;
    }
    if (!supervisorName.trim()) {
      onError("Supervisor (identidad) es requerido");
      return;
    }
    setSubmitting(true);
    onError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password,
          role: "supervisor",
          supervisorName: supervisorName.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al crear");
      onCreated();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-pearl rounded-lg border border-gold-200/30 mb-6">
      <h3 className="text-sm font-medium text-jet">Nuevo usuario</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-jet/70 mb-1">Usuario</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-porcelain border border-gold-200/50 rounded px-3 py-2 text-sm"
            placeholder="nombre.usuario"
          />
        </div>
        <div>
          <label className="block text-xs text-jet/70 mb-1">Contraseña temporal</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            className="w-full bg-porcelain border border-gold-200/50 rounded px-3 py-2 text-sm"
            placeholder="Mín. 8 caracteres, mayúscula, minúscula y número"
          />
        </div>
        <div>
          <label className="block text-xs text-jet/70 mb-1">Supervisor (identidad)</label>
          <input
            type="text"
            value={supervisorName}
            onChange={(e) => setSupervisorName(e.target.value)}
            className="w-full bg-porcelain border border-gold-200/50 rounded px-3 py-2 text-sm"
            placeholder="Ej: Braulio Nolasco"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-aqua-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
        >
          {submitting ? "Creando..." : "Crear"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-jet/10 text-jet px-4 py-2 rounded text-sm"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function UserRow({
  user,
  isEditing,
  onEdit,
  onCancelEdit,
  onSaved,
  onError,
  onRevoked,
}: {
  user: User;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
  onRevoked: () => void;
}) {
  const [supervisorName, setSupervisorName] = useState<string>(
    user.supervisorName ?? ""
  );
  const [tempPassword, setTempPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    if (tempPassword.length >= 8) {
      const pwdValidation = validatePassword(tempPassword);
      if (!pwdValidation.valid) {
        onError(pwdValidation.error ?? "Contraseña inválida");
        return;
      }
    }
    setSubmitting(true);
    onError("");
    try {
      const body: { supervisorName?: string | null; tempPassword?: string; isActive?: boolean } = {
        supervisorName: supervisorName.trim() ? supervisorName.trim() : null,
      };
      if (tempPassword.length >= 8) body.tempPassword = tempPassword;

      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error");
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke() {
    if (!confirm(`¿Revocar acceso de ${user.username}?`)) return;
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error");
      onRevoked();
    } catch {
      onError("Error al revocar");
    }
  }

  async function handleReactivate() {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      if (!res.ok) throw new Error("Error");
      onSaved();
    } catch {
      onError("Error al reactivar");
    }
  }

  if (isEditing) {
    return (
      <div className="p-4 bg-pearl rounded-lg border border-gold-200/30 space-y-3">
        <p className="text-sm font-medium text-jet">{user.username}</p>
        <div>
          <label className="block text-xs text-jet/70 mb-1">Supervisor (identidad)</label>
          <input
            type="text"
            value={supervisorName}
            onChange={(e) => setSupervisorName(e.target.value)}
            className="w-full bg-porcelain border border-gold-200/50 rounded px-3 py-2 text-sm"
            placeholder="Ej: Braulio Nolasco"
          />
        </div>
        <div>
          <label className="block text-xs text-jet/70 mb-1">Nueva contraseña temporal (opcional)</label>
          <input
            type="password"
            value={tempPassword}
            onChange={(e) => setTempPassword(e.target.value)}
            minLength={8}
            className="w-full bg-porcelain border border-gold-200/50 rounded px-3 py-2 text-sm"
            placeholder="Dejar vacío para no cambiar"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={submitting}
            className="bg-aqua-700 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
          >
            {submitting ? "Guardando..." : "Guardar"}
          </button>
          <button type="button" onClick={onCancelEdit} className="text-jet/60 text-sm">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 p-3 bg-pearl rounded-lg border border-gold-200/30">
      <div>
        <p className="text-sm font-medium text-jet">
          {user.username}
          {!user.isActive && <span className="text-danger text-xs ml-2">(revocado)</span>}
        </p>
        <p className="text-xs text-jet/60">
          {user.supervisorName ?? "—"} · {user.mustChangePassword ? "Debe cambiar contraseña" : "Activo"}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        {user.isActive && (
          <>
            <button
              type="button"
              onClick={onEdit}
              className="text-aqua-700 text-sm hover:underline"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={handleRevoke}
              className="text-danger text-sm hover:underline"
            >
              Revocar
            </button>
          </>
        )}
        {!user.isActive && (
          <button
            type="button"
            onClick={handleReactivate}
            className="text-success text-sm hover:underline"
          >
            Reactivar
          </button>
        )}
      </div>
    </div>
  );
}
