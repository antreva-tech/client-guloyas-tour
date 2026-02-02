/**
 * Role-based access control helpers.
 * Matches permission matrix: supervisor, admin, support.
 */

export type SessionRole = "admin" | "support" | "supervisor";

/**
 * Whether the role can see the Resumen (overview) tab.
 * Supervisor: No; Admin, Support: Yes.
 */
export function canSeeResumen(role: SessionRole | null): boolean {
  return role === "admin" || role === "support";
}

/**
 * Whether the role can see the Productos tab.
 * Supervisor: No; Admin, Support: Yes.
 */
export function canSeeProducts(role: SessionRole | null): boolean {
  return role === "admin" || role === "support";
}

/**
 * Whether the role can see the Ventas tab.
 * All roles: Yes.
 */
export function canSeeSales(role: SessionRole | null): boolean {
  return role === "admin" || role === "support" || role === "supervisor";
}

/**
 * Whether the role can edit unit price and abono on invoices.
 * All ventas roles: Yes.
 */
export function canEditPrice(role: SessionRole | null): boolean {
  return role === "admin" || role === "support" || role === "supervisor";
}

/**
 * Whether the role can access Ajustes (Settings).
 * Admin, Support: Yes; Supervisor: No.
 */
export function canAccessSettings(role: SessionRole | null): boolean {
  return role === "admin" || role === "support";
}

/**
 * Whether the role can manage users (create, edit, revoke).
 * Admin, Support: Yes; Supervisor: No.
 */
export function canManageUsers(role: SessionRole | null): boolean {
  return role === "admin" || role === "support";
}

/**
 * Whether the role can reset admin password.
 * Support only.
 */
export function canResetAdminPassword(role: SessionRole | null): boolean {
  return role === "support";
}

/**
 * Whether the role should see the supervisor filter in invoice history.
 * Supervisor: No (they only see their own); Admin, Support: Yes.
 */
export function showSupervisorFilter(role: SessionRole | null): boolean {
  return role === "admin" || role === "support";
}

/**
 * Whether the role can permanently delete voided (anulada) invoices.
 * Admin, Support: Yes (review/cleanup process); Supervisor: No.
 */
export function canDeleteVoidedInvoices(role: SessionRole | null): boolean {
  return role === "admin" || role === "support";
}
