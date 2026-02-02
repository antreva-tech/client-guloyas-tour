"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { getProvincias, getMunicipios } from "@/lib/locationData";
import { formatDate, formatDateTime } from "@/lib/formatDate";
import { formatPhoneForDisplay, formatPhoneForWhatsApp } from "@/lib/phone";
import { brandConfig } from "@/lib/brandConfig";

/**
 * Product info included in sale records.
 */
interface ProductInfo {
  id: string;
  name: string;
  line: string;
  price: number;
  currency: string;
  /** Optional children price; used to show Adult/Niño label per line. */
  childPrice?: number | null;
}

/**
 * One additional person in a reservation (kid or adult).
 * Stored in Sale.personasAdditional.
 */
export interface PersonaAdditional {
  type: "kid" | "adult";
  name: string;
  dateOfBirth?: string;
  cedulaPassport?: string;
  phone?: string;
}

/**
 * Sale record returned from the sales API.
 * Includes all customer and sale information fields.
 */
interface SaleRecord {
  id: string;
  batchId: string;
  tourId: string;
  quantity: number;
  total: number;
  abono?: number | null;
  pendiente?: number | null;
  customerName: string;
  customerPhone: string;
  cedula: string;
  provincia: string;
  municipio: string;
  customerAddress?: string | null;
  personasAdditional?: PersonaAdditional[] | null;
  notes?: string | null;
  fechaEntrega: string;
  fechaVisita: string;
  supervisor: string;
  nombreVendedor: string;
  isPaid: boolean;
  createdAt: string;
  voidedAt?: string | null;
  voidReason?: string | null;
  tour?: ProductInfo;
}

/**
 * Grouped invoice summary for display.
 * Includes all customer and sale information fields.
 */
/** Contact tracking stats per invoice batch. */
interface ContactStats {
  whatsappCount: number;
  callCount: number;
}

interface InvoiceSummary {
  batchId: string;
  createdAt: string;
  customerLabel: string;
  customerPhone: string;
  cedula: string;
  provincia: string;
  municipio: string;
  customerAddress: string;
  personasAdditional: PersonaAdditional[];
  notes: string;
  fechaEntrega: string;
  fechaVisita: string;
  supervisor: string;
  nombreVendedor: string;
  isPaid: boolean;
  total: number;
  totalAbono: number;
  totalPendiente: number;
  itemsCount: number;
  isVoided: boolean;
  voidedAt?: string | null;
  voidReason?: string | null;
  items: SaleRecord[];
  whatsappCount: number;
  callCount: number;
}

export interface InvoiceHistoryPanelProps {
  onInvoiceVoided?: () => void;
  onPaymentUpdated?: () => void;
  onInvoiceDeleted?: () => void;
  onEditInvoice?: (invoice: InvoiceSummary) => void;
  /** When this value changes, the invoice list is refetched (e.g. after saving an edit). */
  refreshTrigger?: number;
  limit?: number;
  showSearch?: boolean;
  showVoidActions?: boolean;
  /** Admin/support only: show delete button for voided (anulada) invoices. */
  showDeleteVoidedActions?: boolean;
  showRefresh?: boolean;
  showMonthFilter?: boolean;
  showSupervisorFilter?: boolean;
  /** Paginate the list: show this many invoices per page with prev/next controls. */
  pageSize?: number;
  title?: string;
  subtitle?: string;
}

/**
 * Returns true if the value looks like "creado por" / creator info (e.g. email)
 * rather than a real seller name. Used to hide misleading creadopor data from display.
 * @param val - nombreVendedor value from DB.
 */
function isCreadoporValue(val: string): boolean {
  const s = (val || "").trim();
  if (!s) return true;
  if (s.includes("@")) return true;
  return /^creado\s*por$/i.test(s);
}

/**
 * Parses customer info from notes string (legacy support).
 * @param notes - Optional notes string.
 * @returns Object with customer name, phone, address, and other notes.
 */
function parseCustomerInfoFromNotes(notes?: string | null) {
  if (!notes) {
    return { name: "", phone: "", address: "", notes: "" };
  }
  
  const nameMatch = notes.match(/Cliente:\s*([^|]+)/i);
  const phoneMatch = notes.match(/Tel:\s*([^|]+)/i);
  const addressMatch = notes.match(/Dir:\s*([^|]+)/i);
  
  // Extract remaining notes after customer info
  let otherNotes = notes
    .replace(/Cliente:\s*[^|]+\|?/i, "")
    .replace(/Tel:\s*[^|]+\|?/i, "")
    .replace(/Dir:\s*[^|]+\|?/i, "")
    .replace(/^\s*\|\s*/, "")
    .trim();
  
  return {
    name: nameMatch?.[1]?.trim() || "",
    phone: phoneMatch?.[1]?.trim() || "",
    address: addressMatch?.[1]?.trim() || "",
    notes: otherNotes,
  };
}

/**
 * Groups sale records by batchId into invoice summaries.
 * Uses dedicated fields with fallback to legacy notes parsing.
 * @param sales - Flat list of sales.
 * @param contactStats - Optional contact tracking counts per batchId.
 */
function groupSalesByBatch(
  sales: SaleRecord[],
  contactStats?: Record<string, ContactStats>
) {
  const map = new Map<string, InvoiceSummary>();

  sales.forEach((sale) => {
    const existing = map.get(sale.batchId);
    const createdAt = new Date(sale.createdAt).toISOString();
    const isVoided = Boolean(sale.voidedAt);
    
    // Use dedicated fields, fallback to parsing notes for legacy data
    const legacyInfo = parseCustomerInfoFromNotes(sale.notes);
    const customerName = sale.customerName || legacyInfo.name;
    const customerPhone = sale.customerPhone || legacyInfo.phone;
    const customerAddress = sale.customerAddress || legacyInfo.address;
    const notes = sale.customerName ? (sale.notes || "") : legacyInfo.notes;

    const personasList = (sale as SaleRecord & { personasAdditional?: PersonaAdditional[] | null }).personasAdditional ?? [];
    if (!existing) {
      const stats = contactStats?.[sale.batchId];
      map.set(sale.batchId, {
        batchId: sale.batchId,
        createdAt,
        customerLabel: customerName || "Cliente no especificado",
        customerPhone: customerPhone || "",
        cedula: sale.cedula || "",
        provincia: sale.provincia || "",
        municipio: sale.municipio || "",
        customerAddress: customerAddress || "",
        personasAdditional: Array.isArray(personasList) ? personasList : [],
        notes,
        fechaEntrega: sale.fechaEntrega || "",
        fechaVisita: sale.fechaVisita || "",
        supervisor: sale.supervisor || "",
        nombreVendedor: sale.nombreVendedor || "",
        isPaid: sale.isPaid ?? false,
        total: sale.total,
        totalAbono: sale.abono || 0,
        totalPendiente: sale.pendiente || 0,
        itemsCount: sale.quantity,
        isVoided,
        voidedAt: sale.voidedAt ?? null,
        voidReason: sale.voidReason ?? null,
        items: [sale],
        whatsappCount: stats?.whatsappCount ?? 0,
        callCount: stats?.callCount ?? 0,
      });
      return;
    }

    existing.total += sale.total;
    existing.totalAbono += sale.abono || 0;
    existing.totalPendiente += sale.pendiente || 0;
    existing.itemsCount += sale.quantity;
    existing.isVoided = existing.isVoided || isVoided;
    existing.items.push(sale);
    if (sale.voidedAt) {
      existing.voidedAt = sale.voidedAt;
      existing.voidReason = sale.voidReason ?? null;
    }
  });

  return Array.from(map.values()).sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1
  );
}

/**
 * Filter option type for FilterSelect component.
 */
interface FilterOption {
  value: string;
  label: string;
}

/**
 * Custom dropdown component for filter selections.
 * Provides searchable, styled dropdown consistent with app design.
 */
function FilterSelect({
  value,
  onChange,
  options,
  allLabel = "Todos",
  placeholder = "Seleccionar...",
}: {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  allLabel?: string;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // All options including the "all" option
  const allOptions: FilterOption[] = useMemo(
    () => [{ value: "all", label: allLabel }, ...options],
    [options, allLabel]
  );

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return allOptions;
    const term = searchTerm.toLowerCase();
    return allOptions.filter((opt) => opt.label.toLowerCase().includes(term));
  }, [allOptions, searchTerm]);

  // Get display label for current value
  const displayLabel = useMemo(() => {
    const found = allOptions.find((opt) => opt.value === value);
    return found?.label || allLabel;
  }, [value, allOptions, allLabel]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * Handles option selection.
   */
  const handleSelect = useCallback((optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  }, [onChange]);

  /**
   * Handles input focus - opens dropdown.
   */
  function handleFocus() {
    setIsOpen(true);
  }

  /**
   * Handles input change for filtering.
   */
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  }

  const hasFilter = value !== "all";

  return (
    <div ref={containerRef} className="relative min-w-0">
      <div
        className={`w-full min-w-0 bg-white border rounded-lg flex items-center overflow-hidden ${
          hasFilter ? "border-aqua-500" : "border-gold-200/50"
        } ${isOpen ? "ring-2 ring-aqua-500" : ""}`}
      >
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : displayLabel}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-black text-sm focus:outline-none placeholder:text-black/50 truncate"
        />
        {hasFilter && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("all");
              setSearchTerm("");
            }}
            className="flex-shrink-0 px-2 py-2 text-jet/40 hover:text-jet/60"
            tabIndex={-1}
          >
            ×
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex-shrink-0 flex items-center justify-center px-2 py-2 text-jet/40"
          tabIndex={-1}
        >
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gold-200/50 rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-3 text-black/60 text-sm text-center">
                No se encontraron resultados
              </p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-3 py-2.5 text-left text-sm transition-colors border-b border-gold-200/20 last:border-b-0 ${
                    option.value === value
                      ? "bg-aqua-50 text-aqua-700 font-medium"
                      : "text-black hover:bg-pearl"
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Displays invoice history with void controls.
 */
export function InvoiceHistoryPanel({
  onInvoiceVoided,
  onPaymentUpdated,
  onInvoiceDeleted,
  refreshTrigger,
  limit,
  showSearch = true,
  showVoidActions = true,
  showDeleteVoidedActions = false,
  showRefresh = true,
  showMonthFilter = false,
  showSupervisorFilter = false,
  pageSize,
  onEditInvoice,
  title = "Facturas",
  subtitle = "Busca facturas y anula para regresar inventario",
}: InvoiceHistoryPanelProps) {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [contactStats, setContactStats] = useState<
    Record<string, ContactStats>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [voidingBatchId, setVoidingBatchId] = useState<string | null>(null);
  const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [dateVisita, setDateVisita] = useState("");
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("all");
  const [supervisorOptions, setSupervisorOptions] = useState<{ value: string; label: string }[]>([]);
  const [nombreVendedorFilter, setNombreVendedorFilter] = useState("all");
  const [apiSellerNames, setApiSellerNames] = useState<string[]>([]);
  const [selectedProvincia, setSelectedProvincia] = useState<string>("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const monthDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSupervisorFilter) return;
    fetch("/api/supervisors")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: string[]) =>
        setSupervisorOptions(list.map((s) => ({ value: s, label: s })))
      )
      .catch(() => {});
  }, [showSupervisorFilter]);

  useEffect(() => {
    fetch("/api/sellers")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Array<{ id: string; name: string }>) =>
        setApiSellerNames(Array.isArray(data) ? data.map((s) => s.name) : [])
      )
      .catch(() => {});
  }, []);

  /**
   * Loads invoices from the API.
   */
  async function loadInvoices() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sales");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.detail || data?.error || "Error al cargar facturas";
        throw new Error(msg);
      }
      // Support both paginated { data: [...] } and legacy raw array responses
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setSales(list as SaleRecord[]);
      setContactStats((data?.contactStats as Record<string, ContactStats>) ?? {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Voids an invoice batch and restores inventory.
   * @param batchId - Invoice batch identifier.
   * @param reason - Optional reason for voiding.
   */
  async function handleVoidInvoice(batchId: string, reason?: string) {
    setVoidingBatchId(batchId);
    setError(null);
    try {
      const res = await fetch(`/api/sales/${batchId}/void`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || "" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al anular factura");
      }

      await loadInvoices();
      onInvoiceVoided?.();
      setSelectedBatchId(null);
      setVoidReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setVoidingBatchId(null);
    }
  }

  /**
   * Permanently deletes a voided (anulada) invoice. Admin/support only.
   * @param batchId - Invoice batch identifier.
   */
  async function handleDeleteVoidedInvoice(batchId: string) {
    if (
      !confirm(
        "¿Eliminar esta factura anulada permanentemente? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }
    setDeletingBatchId(batchId);
    setError(null);
    try {
      const res = await fetch(`/api/sales/${batchId}/delete`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al eliminar factura");
      }

      await loadInvoices();
      onInvoiceDeleted?.();
      setSelectedBatchId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setDeletingBatchId(null);
    }
  }

  /**
   * Opens the invoice detail modal.
   * @param invoice - The invoice to display.
   */
  function handleOpenInvoice(invoice: InvoiceSummary) {
    setSelectedBatchId(invoice.batchId);
    setVoidReason("");
  }

  /**
   * Closes the invoice detail modal.
   */
  function handleCloseModal() {
    setSelectedBatchId(null);
    setVoidReason("");
  }

  useEffect(() => {
    void loadInvoices();
  }, []);

  const isFirstRefreshTrigger = useRef(true);
  useEffect(() => {
    if (refreshTrigger === undefined) return;
    if (isFirstRefreshTrigger.current) {
      isFirstRefreshTrigger.current = false;
      return;
    }
    void loadInvoices();
  }, [refreshTrigger]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        monthDropdownRef.current &&
        !monthDropdownRef.current.contains(event.target as Node)
      ) {
        setMonthDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const invoices = useMemo(
    () => groupSalesByBatch(sales, contactStats),
    [sales, contactStats]
  );

  /**
   * Updates contact stats optimistically when WhatsApp/call is tracked.
   */
  const provinciasOptions = useMemo(
    () => getProvincias().map((p) => ({ value: p, label: p })),
    []
  );

  /**
   * Seller filter options: merge Seller table names with unique names from invoices.
   * Ensures dropdown matches names actually on invoices (including legacy/import data).
   */
  const sellerOptions = useMemo(() => {
    const fromInvoices = new Set<string>();
    invoices.forEach((inv) => {
      const name = (inv.nombreVendedor || "").trim();
      if (name && !isCreadoporValue(name)) fromInvoices.add(name);
    });
    const merged = new Set([...apiSellerNames, ...fromInvoices]);
    return Array.from(merged)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "es"))
      .map((name) => ({ value: name, label: name }));
  }, [invoices, apiSellerNames]);

  /**
   * Province filter options: canonical provinces plus any from invoice data (legacy/import).
   */
  const provinceOptions = useMemo(() => {
    const canonical = getProvincias();
    const fromInvoices = new Set<string>();
    invoices.forEach((inv) => {
      const p = (inv.provincia || "").trim();
      if (p) fromInvoices.add(p);
    });
    const merged = new Set([...canonical, ...fromInvoices]);
    return Array.from(merged)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "es"))
      .map((name) => ({ value: name, label: name }));
  }, [invoices]);

  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((sale) => {
      const date = new Date(sale.createdAt);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      set.add(key);
    });
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
  }, [sales]);

  /**
   * Formats a month key (YYYY-MM) into a human label.
   * @param key - Month key in YYYY-MM format.
   */
  function formatMonthLabel(key: string) {
    const [year, month] = key.split("-").map((value) => parseInt(value, 10));
    if (!year || !month) return key;
    const d = new Date(year, month - 1, 1);
    return `${d.toLocaleDateString("es-DO", { month: "long" })} ${d.getFullYear()}`;
  }

  /**
   * Updates the selected month and closes the dropdown.
   * @param value - Month key or "all".
   */
  function handleMonthSelect(value: string) {
    setSelectedMonth(value);
    setMonthDropdownOpen(false);
  }

  const filteredInvoices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let filtered = invoices;

    // Search filter: ID, name, phone, or notes
    if (term) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.batchId.toLowerCase().includes(term) ||
          invoice.customerLabel.toLowerCase().includes(term) ||
          invoice.customerPhone.toLowerCase().includes(term) ||
          (invoice.nombreVendedor || "").toLowerCase().includes(term) ||
          invoice.notes.toLowerCase().includes(term)
      );
    }

    // Month filter
    if (selectedMonth !== "all") {
      filtered = filtered.filter((invoice) => {
        const date = new Date(invoice.createdAt);
        if (Number.isNaN(date.getTime())) return false;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        return key === selectedMonth;
      });
    }

    // Fecha visita (visit date) filter – exact date match (compare YYYY-MM-DD to avoid timezone offset)
    if (dateVisita) {
      const targetYmd = dateVisita;
      filtered = filtered.filter((invoice) => {
        if (!invoice.fechaVisita) return false;
        const s = String(invoice.fechaVisita);
        const invoiceYmd = s.startsWith("20") && s.length >= 10
          ? s.slice(0, 10)
          : (() => {
              const d = new Date(s);
              if (Number.isNaN(d.getTime())) return null;
              const y = d.getUTCFullYear();
              const m = String(d.getUTCMonth() + 1).padStart(2, "0");
              const day = String(d.getUTCDate()).padStart(2, "0");
              return `${y}-${m}-${day}`;
            })();
        return invoiceYmd && invoiceYmd === targetYmd;
      });
    }

    // Supervisor filter (only when supervisor/seller UI is used)
    if (showSupervisorFilter && selectedSupervisor !== "all") {
      filtered = filtered.filter(
        (invoice) => (invoice.supervisor || "").trim() === selectedSupervisor
      );
    }

    // Nombre vendedor filter (only when supervisor/seller UI is used)
    if (showSupervisorFilter && nombreVendedorFilter && nombreVendedorFilter !== "all") {
      const filterVal = nombreVendedorFilter.trim().toLowerCase();
      filtered = filtered.filter((invoice) => {
        const invVal = (invoice.nombreVendedor || "").trim().toLowerCase();
        if (!invVal) return false;
        return invVal.includes(filterVal) || filterVal.includes(invVal);
      });
    }

    // Province filter
    if (selectedProvincia && selectedProvincia !== "all") {
      filtered = filtered.filter(
        (invoice) => (invoice.provincia || "").trim() === selectedProvincia
      );
    }

    // Payment status filter
    if (selectedPaymentStatus !== "all") {
      filtered = filtered.filter((invoice) => {
        if (selectedPaymentStatus === "voided") return invoice.isVoided;
        if (selectedPaymentStatus === "paid") return !invoice.isVoided && invoice.isPaid;
        if (selectedPaymentStatus === "pending") return !invoice.isVoided && !invoice.isPaid;
        return true;
      });
    }

    return filtered;
  }, [invoices, searchTerm, selectedMonth, dateVisita, selectedSupervisor, nombreVendedorFilter, selectedProvincia, selectedPaymentStatus, showSupervisorFilter]);

  const selectedInvoice = useMemo(
    () => filteredInvoices.find((i) => i.batchId === selectedBatchId) ?? null,
    [filteredInvoices, selectedBatchId]
  );

  /**
   * Clears all active filters.
   */
  function clearFilters() {
    setSearchTerm("");
    setSelectedMonth("all");
    setDateVisita("");
    setSelectedSupervisor("all");
    setNombreVendedorFilter("all");
    setSelectedProvincia("all");
    setSelectedPaymentStatus("all");
  }

  const hasActiveFilters = searchTerm || selectedMonth !== "all" || dateVisita
    || (showSupervisorFilter && (selectedSupervisor !== "all" || (nombreVendedorFilter && nombreVendedorFilter !== "all")))
    || (selectedProvincia && selectedProvincia !== "all") || selectedPaymentStatus !== "all";

  /** Reset to page 1 when filters change. */
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredInvoices.length, searchTerm, selectedMonth, dateVisita, selectedSupervisor, nombreVendedorFilter, selectedProvincia, selectedPaymentStatus]);

  const limitedInvoices = useMemo(() => {
    if (limit && limit > 0) return filteredInvoices.slice(0, limit);
    if (pageSize && pageSize > 0) {
      const start = (currentPage - 1) * pageSize;
      return filteredInvoices.slice(start, start + pageSize);
    }
    return filteredInvoices;
  }, [filteredInvoices, limit, pageSize, currentPage]);

  const totalPages = pageSize && pageSize > 0
    ? Math.max(1, Math.ceil(filteredInvoices.length / pageSize))
    : 1;
  const paginationStart = pageSize && pageSize > 0 && filteredInvoices.length > 0
    ? (currentPage - 1) * pageSize + 1
    : 1;
  const paginationEnd = pageSize && pageSize > 0
    ? Math.min(currentPage * pageSize, filteredInvoices.length)
    : filteredInvoices.length;
  const showPagination = Boolean(pageSize && pageSize > 0 && filteredInvoices.length > pageSize);

  return (
    <div className="bg-porcelain rounded-xl border border-gold-200/50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-jet font-medium">{title}</p>
          <p className="text-jet/60 text-xs mt-0.5">{subtitle}</p>
        </div>
        {(showSearch || showRefresh || showMonthFilter) && (
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            {showSearch && (
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar cliente, vendedor, teléfono..."
                className="w-full sm:w-52 bg-pearl border border-gold-200/50 rounded-lg px-3 py-2 text-jet text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500"
              />
            )}
            {showSearch && (
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  showFilters || hasActiveFilters
                    ? "bg-aqua-700 text-white"
                    : "bg-jet/5 hover:bg-jet/10 text-jet/70"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filtros
                {hasActiveFilters && (
                  <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full">!</span>
                )}
              </button>
            )}
            {showRefresh && (
              <button
                type="button"
                onClick={loadInvoices}
                className="bg-aqua-700/10 hover:bg-aqua-700/20 text-aqua-700 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                disabled={isLoading}
              >
                {isLoading ? "..." : "Actualizar"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expandable Filters Panel */}
      {showFilters && showSearch && (
        <div className="mt-3 bg-pearl/50 border border-gold-200/30 rounded-lg p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Month Filter */}
            {showMonthFilter && (
              <div ref={monthDropdownRef} className="relative min-w-0">
                <label className="block text-xs text-jet/60 mb-1">Mes</label>
                <button
                  type="button"
                  onClick={() => setMonthDropdownOpen((open) => !open)}
                  className="w-full bg-white border border-gold-200/50 rounded-lg px-3 py-2 text-left text-jet text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500 flex items-center justify-between"
                >
                  <span className="truncate">
                    {selectedMonth === "all"
                      ? "Todos los meses"
                      : formatMonthLabel(selectedMonth)}
                  </span>
                  <svg
                    className={`w-4 h-4 text-jet/40 transition-transform ${
                      monthDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {monthDropdownOpen && (
                  <div className="absolute z-20 mt-1 w-full bg-porcelain border border-gold-200/50 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => handleMonthSelect("all")}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                        selectedMonth === "all"
                          ? "bg-aqua-50 text-aqua-700"
                          : "text-jet hover:bg-pearl"
                      }`}
                    >
                      Todos los meses
                    </button>
                    {monthOptions.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleMonthSelect(key)}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                          selectedMonth === key
                            ? "bg-aqua-50 text-aqua-700"
                            : "text-jet hover:bg-pearl"
                        }`}
                      >
                        {formatMonthLabel(key)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fecha visita (visit date) – DD/MM/YYYY calendar */}
            <div className="min-w-0">
              <label className="block text-xs text-jet/60 mb-1">Fecha visita</label>
              <DatePicker
                selected={dateVisita ? new Date(dateVisita + "T12:00:00") : null}
                onChange={(date: Date | null) => {
                  if (!date) {
                    setDateVisita("");
                    return;
                  }
                  const y = date.getFullYear();
                  const m = String(date.getMonth() + 1).padStart(2, "0");
                  const d = String(date.getDate()).padStart(2, "0");
                  setDateVisita(`${y}-${m}-${d}`);
                }}
                dateFormat="dd/MM/yyyy"
                placeholderText="DD/MM/YYYY"
                className="w-full bg-white border border-gold-200/50 rounded-lg px-3 py-2 text-jet text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500"
                isClearable
              />
            </div>

            {/* Supervisor Filter */}
            {showSupervisorFilter && (
              <div className="min-w-0">
                <label className="block text-xs text-jet/60 mb-1">Supervisor</label>
                <FilterSelect
                  value={selectedSupervisor}
                  onChange={setSelectedSupervisor}
                  options={supervisorOptions}
                  allLabel="Todos los supervisores"
                  placeholder="Buscar supervisor..."
                />
              </div>
            )}

            {/* Nombre vendedor filter - hidden when supervisor/seller not used */}
            {showSupervisorFilter && (
              <div className="min-w-0">
                <label className="block text-xs text-jet/60 mb-1">Nombre vendedor</label>
                <FilterSelect
                  value={nombreVendedorFilter}
                  onChange={setNombreVendedorFilter}
                  options={sellerOptions}
                  allLabel="Todos los vendedores"
                  placeholder="Buscar vendedor..."
                />
              </div>
            )}

            {/* Province filter */}
            <div className="min-w-0">
              <label className="block text-xs text-jet/60 mb-1">Provincia</label>
              <FilterSelect
                value={selectedProvincia}
                onChange={setSelectedProvincia}
                options={provinceOptions}
                allLabel="Todas las provincias"
                placeholder="Buscar provincia..."
              />
            </div>

            {/* Payment Status Filter */}
            <div className="min-w-0">
              <label className="block text-xs text-jet/60 mb-1">Estado de Pago</label>
              <FilterSelect
                value={selectedPaymentStatus}
                onChange={setSelectedPaymentStatus}
                options={[
                  { value: "pending", label: "Pendiente" },
                  { value: "paid", label: "Pagado" },
                  { value: "voided", label: "Anulada" },
                ]}
                allLabel="Todos los estados"
                placeholder="Buscar estado..."
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-full bg-danger/10 hover:bg-danger/20 text-danger px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>

          {/* Results count */}
          <div className="mt-3 pt-2 border-t border-gold-200/30 flex items-center justify-between">
            <p className="text-xs text-jet/50">
              {filteredInvoices.length} {filteredInvoices.length === 1 ? "factura encontrada" : "facturas encontradas"}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 bg-danger/10 border border-danger/30 text-danger px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {limitedInvoices.length === 0 && !isLoading && (
          <p className="text-jet/50 text-sm text-center py-6">
            No hay facturas para mostrar
          </p>
        )}

        {limitedInvoices.map((invoice) => (
            <button
              key={invoice.batchId}
              type="button"
              onClick={() => handleOpenInvoice(invoice)}
              className={`w-full text-left border rounded-lg p-3 transition-colors ${
                invoice.isVoided
                  ? "border-danger/30 bg-danger/5 hover:bg-danger/10"
                  : "border-gold-200/40 bg-white hover:bg-pearl"
              }`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {invoice.isVoided && (
                      <span className="bg-danger/20 text-danger text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        ANULADA
                      </span>
                    )}
                    {!invoice.isVoided && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        invoice.isPaid
                          ? "bg-success/20 text-success"
                          : "bg-gold-500/20 text-gold-500"
                      }`}>
                        {invoice.isPaid ? "PAGADO" : "PENDIENTE"}
                      </span>
                    )}
                  </div>
                  <p className="text-jet font-semibold text-sm mt-0.5">
                    {invoice.customerLabel}
                  </p>
                  {invoice.provincia && (
                    <p className="text-jet/60 text-xs mt-0.5">{invoice.provincia}</p>
                  )}
                  {invoice.customerPhone && (
                    <p className="text-jet/60 text-xs mt-0.5">
                      Tel: {invoice.customerPhone}
                    </p>
                  )}
                  {showSupervisorFilter && invoice.supervisor && (
                    <p className="text-aqua-700 text-xs mt-0.5">
                      Sup: {invoice.supervisor}
                    </p>
                  )}
                  {showSupervisorFilter && invoice.nombreVendedor && !isCreadoporValue(invoice.nombreVendedor) && (
                    <p className="text-jet/60 text-xs mt-0.5">
                      Vendedor: {invoice.nombreVendedor}
                    </p>
                  )}
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className={`font-semibold text-sm ${invoice.isVoided ? "text-jet/50 line-through" : "text-jet"}`}>
                    RD$ {invoice.total.toLocaleString()}
                  </p>
                  <p className="text-gold-500 text-xs mt-0.5">
                    Lo que debe: RD$ {invoice.totalPendiente.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-end">
                <span className="text-aqua-700 text-xs font-medium">
                  Ver detalles →
                </span>
              </div>
            </button>
          ))}

        {/* Pagination controls */}
        {showPagination && (
          <div className="mt-4 pt-4 border-t border-gold-200/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-jet/60 order-2 sm:order-1">
              Mostrando {paginationStart}–{paginationEnd} de {filteredInvoices.length}
            </p>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-jet/5 hover:bg-jet/10 text-jet disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <span className="text-sm text-jet/70 px-2">
                Página {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-jet/5 hover:bg-jet/10 text-jet disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={handleCloseModal}
          onEdit={onEditInvoice ? () => { onEditInvoice(selectedInvoice); handleCloseModal(); } : undefined}
          onVoid={(reason) => handleVoidInvoice(selectedInvoice.batchId, reason)}
          onDeleteVoided={() => handleDeleteVoidedInvoice(selectedInvoice.batchId)}
          isVoiding={voidingBatchId === selectedInvoice.batchId}
          isDeleting={deletingBatchId === selectedInvoice.batchId}
          voidReason={voidReason}
          onVoidReasonChange={setVoidReason}
          showVoidActions={showVoidActions}
          showDeleteVoidedActions={showDeleteVoidedActions}
          showSupervisorFilter={showSupervisorFilter}
          supervisorOptions={supervisorOptions}
          sellerOptions={sellerOptions}
          provinciasOptions={provinciasOptions}
          onPhoneUpdated={() => void loadInvoices()}
          onPaymentUpdated={() => {
            void loadInvoices();
            onPaymentUpdated?.();
          }}
          onInvoiceUpdated={() => void loadInvoices()}
        />
      )}
    </div>
  );
}

/**
 * Modal component for displaying invoice details.
 */
function InvoiceDetailModal({
  invoice,
  onClose,
  onEdit,
  onVoid,
  onDeleteVoided,
  isVoiding,
  isDeleting,
  voidReason,
  onVoidReasonChange,
  showVoidActions,
  showDeleteVoidedActions,
  showSupervisorFilter = true,
  supervisorOptions,
  sellerOptions,
  provinciasOptions,
  onPhoneUpdated,
  onPaymentUpdated,
  onInvoiceUpdated,
  onContactTracked,
}: {
  invoice: InvoiceSummary;
  onClose: () => void;
  onEdit?: () => void;
  onVoid: (reason: string) => void;
  onDeleteVoided?: () => void;
  isVoiding: boolean;
  isDeleting: boolean;
  voidReason: string;
  onVoidReasonChange: (value: string) => void;
  showVoidActions: boolean;
  showDeleteVoidedActions: boolean;
  showSupervisorFilter?: boolean;
  supervisorOptions: { value: string; label: string }[];
  sellerOptions: { value: string; label: string }[];
  provinciasOptions: { value: string; label: string }[];
  onPhoneUpdated?: () => void;
  onPaymentUpdated?: () => void;
  onInvoiceUpdated?: () => void;
  onContactTracked?: (batchId: string, type: "whatsapp" | "call") => void;
}) {
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState(invoice.customerPhone || "");
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isDownloadingServerPdf, setIsDownloadingServerPdf] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [currentIsPaid, setCurrentIsPaid] = useState(invoice.isPaid);
  const [whatsappCount, setWhatsappCount] = useState(invoice.whatsappCount ?? 0);
  const [callCount, setCallCount] = useState(invoice.callCount ?? 0);
  const [isEditingCliente, setIsEditingCliente] = useState(false);
  const [isEditingSale, setIsEditingSale] = useState(false);
  const [isUpdatingInvoice, setIsUpdatingInvoice] = useState(false);
  const [invoiceEditError, setInvoiceEditError] = useState<string | null>(null);
  const [editCliente, setEditCliente] = useState({
    customerLabel: invoice.customerLabel,
    customerPhone: invoice.customerPhone || "",
    cedula: invoice.cedula || "",
    provincia: invoice.provincia || "",
    municipio: invoice.municipio || "",
    customerAddress: invoice.customerAddress || "",
    notes: invoice.notes || "",
  });
  const [editPersonasAdditional, setEditPersonasAdditional] = useState<PersonaAdditional[]>(
    invoice.personasAdditional?.length ? [...invoice.personasAdditional] : []
  );
  const [editSale, setEditSale] = useState({
    fechaEntrega: invoice.fechaEntrega ? invoice.fechaEntrega.slice(0, 10) : "",
    fechaVisita: invoice.fechaVisita ? invoice.fechaVisita.slice(0, 10) : "",
    supervisor: invoice.supervisor || "",
    nombreVendedor: invoice.nombreVendedor || "",
  });
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWhatsappCount(invoice.whatsappCount ?? 0);
    setCallCount(invoice.callCount ?? 0);
    setEditCliente({
      customerLabel: invoice.customerLabel,
      customerPhone: invoice.customerPhone || "",
      cedula: invoice.cedula || "",
      provincia: invoice.provincia || "",
      municipio: invoice.municipio || "",
      customerAddress: invoice.customerAddress || "",
      notes: invoice.notes || "",
    });
    setEditPersonasAdditional(invoice.personasAdditional?.length ? [...invoice.personasAdditional] : []);
    setEditSale({
      fechaEntrega: invoice.fechaEntrega ? invoice.fechaEntrega.slice(0, 10) : "",
      fechaVisita: invoice.fechaVisita ? invoice.fechaVisita.slice(0, 10) : "",
      supervisor: invoice.supervisor || "",
      nombreVendedor: invoice.nombreVendedor || "",
    });
  }, [invoice.batchId, invoice.customerLabel, invoice.customerPhone, invoice.cedula, invoice.provincia, invoice.municipio, invoice.customerAddress, invoice.notes, invoice.fechaEntrega, invoice.fechaVisita, invoice.supervisor, invoice.nombreVendedor, invoice.whatsappCount, invoice.callCount, invoice.personasAdditional]);

  const dateLabel = formatDateTime(invoice.createdAt);
  const voidedDateLabel = invoice.voidedAt ? formatDateTime(invoice.voidedAt) : null;

  /**
   * Generates WhatsApp message with invoice breakdown, payment due, and bank details.
   * @returns Plain message string (not encoded).
   */
  function generateWhatsAppMessage(): string {
    const invoiceId = invoice.batchId.slice(-8).toUpperCase();
    const itemsList = invoice.items
      .map((item) => {
        const name = item.tour?.name || "Producto";
        const qty = item.quantity;
        const total = item.total;
        return `• ${name} x${qty} — RD$ ${total.toLocaleString()}`;
      })
      .join("\n");

    const lines = [
      "Hola, te hablamos de empresas Kairú, los productos del cabello, aquí está el resumen de tu factura:",
      "",
      "\uD83D\uDCCB *Factura #" + invoiceId + "*",
      "",
      "*Desglose:*",
      itemsList,
      "",
      "Total factura: RD$ " + invoice.total.toLocaleString(),
    ];

    if (!invoice.isVoided && invoice.totalPendiente > 0) {
      lines.push("");
      lines.push("*\uD83D\uDCB0 Lo que debe (saldo pendiente): RD$ " + invoice.totalPendiente.toLocaleString() + "*");
    }

    lines.push("");
    if (invoice.fechaVisita) {
      lines.push("Fecha límite de pago: " + formatDate(invoice.fechaVisita));
      lines.push("");
    }

    lines.push("*A: Santos B. Nolasco Calderón*");
    lines.push("*Cuentas de ahorros.* ");
    lines.push("");
    lines.push("Cédula: 023-00160773");
    lines.push("");
    lines.push("Banco Popular ");
    lines.push(" 775675960");
    lines.push("");
    lines.push("Banco Reservas ");
    lines.push("7300060176");
    lines.push("");
    lines.push("Gracias por tu compra! \u2728");
    lines.push(`— ${brandConfig.brandName}`);
    if (brandConfig.instagramUrl) {
      lines.push("¡Síguenos en Instagram!");
      lines.push("");
      lines.push(brandConfig.instagramUrl);
    }
    return lines.join("\n");
  }

  /**
   * Tracks contact action and opens WhatsApp with order information.
   */
  function handleWhatsAppClick() {
    if (!invoice.customerPhone) return;
    const phone = formatPhoneForWhatsApp(invoice.customerPhone);
    if (!phone) return;
    const message = generateWhatsAppMessage();
    const url = new URL("https://wa.me/" + phone);
    url.searchParams.set("text", message);
    window.open(url.toString(), "_blank");
  }

  /** Opens phone dialer. */
  function handleCallClick() {
    if (!invoice.customerPhone) return;
    const phone = invoice.customerPhone.replace(/\D/g, "");
    if (!phone) return;
    window.open(`tel:${phone}`, "_self");
  }

  /**
   * Updates the customer phone number.
   */
  async function handlePhoneUpdate(e: React.FormEvent) {
    e.preventDefault();
    setIsUpdatingPhone(true);
    setPhoneError(null);

    try {
      const res = await fetch(`/api/sales/${invoice.batchId}/update-phone`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: newPhone.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al actualizar teléfono");
      }

      setIsEditingPhone(false);
      onPhoneUpdated?.();
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsUpdatingPhone(false);
    }
  }

  /**
   * Saves customer data edits.
   */
  async function handleSaveCliente(e: React.FormEvent) {
    e.preventDefault();
    if (editPersonasAdditional.length > 0 && editPersonasAdditional.some((p) => !p.name.trim())) {
      setInvoiceEditError("Cada persona adicional debe tener un nombre.");
      return;
    }
    setIsUpdatingInvoice(true);
    setInvoiceEditError(null);
    try {
      const res = await fetch(`/api/sales/${invoice.batchId}/update-invoice`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: editCliente.customerLabel.trim(),
          customerPhone: editCliente.customerPhone.trim(),
          cedula: editCliente.cedula.trim(),
          provincia: editCliente.provincia.trim(),
          municipio: editCliente.municipio.trim(),
          customerAddress: editCliente.customerAddress.trim() || null,
          personasAdditional: (() => {
            const valid = editPersonasAdditional.filter((p) => p.name.trim());
            return valid.length ? valid.map((p) => ({ type: p.type, name: p.name.trim(), dateOfBirth: p.dateOfBirth || undefined, cedulaPassport: p.cedulaPassport || undefined, phone: p.phone || undefined })) : null;
          })(),
          notes: editCliente.notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al actualizar");
      }
      setIsEditingCliente(false);
      onInvoiceUpdated?.();
    } catch (err) {
      setInvoiceEditError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsUpdatingInvoice(false);
    }
  }

  /**
   * Saves sale data edits.
   */
  async function handleSaveSale(e: React.FormEvent) {
    e.preventDefault();
    setIsUpdatingInvoice(true);
    setInvoiceEditError(null);
    try {
      const res = await fetch(`/api/sales/${invoice.batchId}/update-invoice`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fechaEntrega: editSale.fechaEntrega || null,
          fechaVisita: editSale.fechaVisita || null,
          ...(showSupervisorFilter
            ? { supervisor: editSale.supervisor.trim(), nombreVendedor: editSale.nombreVendedor.trim() }
            : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al actualizar");
      }
      setIsEditingSale(false);
      onInvoiceUpdated?.();
    } catch (err) {
      setInvoiceEditError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsUpdatingInvoice(false);
    }
  }

  /**
   * Toggles the payment status for the invoice.
   */
  async function handleTogglePayment() {
    if (invoice.isVoided) return;
    
    setIsUpdatingPayment(true);
    const newStatus = !currentIsPaid;

    try {
      const res = await fetch(`/api/sales/${invoice.batchId}/update-payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaid: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al actualizar estado de pago");
      }

      setCurrentIsPaid(newStatus);
      onPaymentUpdated?.();
    } catch (err) {
      console.error("Error updating payment:", err);
    } finally {
      setIsUpdatingPayment(false);
    }
  }

  /**
   * Handles form submission for voiding.
   * Shows confirmation before changing status to anulada.
   */
  function handleVoidSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !confirm(
        "¿Está seguro de anular esta factura? El inventario será restaurado automáticamente."
      )
    ) {
      return;
    }
    onVoid(voidReason);
  }

  /**
   * Downloads the server-generated PDF invoice (Letter, clean layout per CURSOR_TASK_INVOICE_PDF).
   */
  async function handleDownloadServerPdf() {
    setIsDownloadingServerPdf(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.batchId}/pdf`, { credentials: "include" });
      if (!res.ok) throw new Error(res.status === 401 ? "No autorizado" : "Error al generar PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Factura-${invoice.batchId.slice(-8).toUpperCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error downloading server PDF:", e);
    } finally {
      setIsDownloadingServerPdf(false);
    }
  }

  /**
   * Generates a PDF invoice and triggers download.
   * Uses html2canvas to capture the invoice HTML and jsPDF to create the PDF.
   */
  async function handleGeneratePdf() {
    if (!pdfContainerRef.current) return;
    
    setIsGeneratingPdf(true);
    
    try {
      const invoiceId = invoice.batchId.slice(-8).toUpperCase();
      
      // Capture the hidden PDF template
      const canvas = await html2canvas(pdfContainerRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });
      
      // Create PDF (A4 size)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const margin = 8;
      const ratio = Math.min((pdfWidth - margin * 2) / imgWidth, (pdfHeight - margin * 2) / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = margin;
      
      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Download the PDF
      pdf.save(`Factura-${invoiceId}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-jet/50 backdrop-blur-sm no-print"
      onClick={onClose}
    >
      <div
        id="invoice-content"
        className="bg-porcelain rounded-xl border border-gold-200/50 shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 border-b print-p-8 ${invoice.isVoided ? "border-danger/30 bg-danger/10" : "border-gold-200/50"}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-jet">
                  Factura #{invoice.batchId.slice(-8).toUpperCase()}
                </h3>
                {invoice.isVoided && (
                  <span className="bg-danger text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                    ANULADA
                  </span>
                )}
              </div>
              <p className="text-jet/60 text-sm mt-0.5">{dateLabel}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-jet/5 hover:bg-jet/10 text-jet/60 hover:text-jet transition-colors no-print"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Voided banner */}
          {invoice.isVoided && (
            <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 mb-4">
              <p className="text-danger font-semibold text-sm">Factura Anulada</p>
              {voidedDateLabel && (
                <p className="text-danger/80 text-xs mt-0.5">
                  Anulada el {voidedDateLabel}
                </p>
              )}
              {invoice.voidReason && (
                <p className="text-danger/70 text-xs mt-1">
                  Motivo: {invoice.voidReason}
                </p>
              )}
              <p className="text-danger/70 text-xs mt-2">
                El inventario ha sido restaurado.
              </p>
            </div>
          )}

          {/* Customer info */}
          <div className="bg-pearl rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <p className="text-jet/60 text-xs uppercase tracking-wider">Cliente</p>
                {!invoice.isVoided && !isEditingCliente && (
                  <button
                    type="button"
                    onClick={() => setIsEditingCliente(true)}
                    className="text-aqua-700 text-xs hover:underline"
                  >
                    Editar
                  </button>
                )}
              </div>
              {invoice.isVoided ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-danger/20 text-danger">
                  ANULADA
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleTogglePayment}
                  disabled={isUpdatingPayment}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                    currentIsPaid
                      ? "bg-success/20 text-success hover:bg-success/30"
                      : "bg-gold-500/20 text-gold-500 hover:bg-gold-500/30"
                  } ${isUpdatingPayment ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
                  title="Click para cambiar estado de pago"
                >
                  {isUpdatingPayment ? "..." : currentIsPaid ? "✓ PAGADO" : "PENDIENTE"}
                </button>
              )}
            </div>
            {isEditingCliente ? (
              <form onSubmit={handleSaveCliente} className="mt-2 space-y-2">
                <input
                  type="text"
                  value={editCliente.customerLabel}
                  onChange={(e) => setEditCliente((c) => ({ ...c, customerLabel: e.target.value }))}
                  placeholder="Nombre"
                  className="w-full bg-white border border-gold-200/50 rounded-lg px-3 py-1.5 text-jet text-sm"
                  required
                />
                <input
                  type="tel"
                  value={editCliente.customerPhone}
                  onChange={(e) => setEditCliente((c) => ({ ...c, customerPhone: e.target.value }))}
                  placeholder="Teléfono"
                  className="w-full bg-white border border-gold-200/50 rounded-lg px-3 py-1.5 text-jet text-sm"
                />
                <input
                  type="text"
                  value={editCliente.cedula}
                  onChange={(e) => setEditCliente((c) => ({ ...c, cedula: e.target.value }))}
                  placeholder="Cédula/Passaporte"
                  className="w-full bg-white border border-gold-200/50 rounded-lg px-3 py-1.5 text-jet text-sm"
                />
                <select
                  value={editCliente.provincia}
                  onChange={(e) => setEditCliente((c) => ({ ...c, provincia: e.target.value }))}
                  className="w-full bg-white border border-gold-200/50 rounded-lg px-3 py-1.5 text-jet text-sm"
                >
                  <option value="">Seleccionar provincia...</option>
                  {provinciasOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={editCliente.municipio}
                  onChange={(e) => setEditCliente((c) => ({ ...c, municipio: e.target.value }))}
                  placeholder="Municipio"
                  className="w-full bg-white border border-gold-200/50 rounded-lg px-3 py-1.5 text-jet text-sm"
                />
                <input
                  type="text"
                  value={editCliente.customerAddress}
                  onChange={(e) => setEditCliente((c) => ({ ...c, customerAddress: e.target.value }))}
                  placeholder="Dirección"
                  className="w-full bg-white border border-gold-200/50 rounded-lg px-3 py-1.5 text-jet text-sm"
                />
                {/* Personas adicionales — premium card UI, name required */}
                <div className="space-y-3">
                  <p className="text-jet/70 text-xs font-semibold uppercase tracking-wider">Personas adicionales</p>
                  {editPersonasAdditional.map((p, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-brand-border bg-porcelain p-3 shadow-sm transition-shadow focus-within:shadow-md"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-lg ${
                            p.type === "kid" ? "bg-brand-sky/15 text-brand-sky" : "bg-night-700/10 text-night-700"
                          }`}
                        >
                          {p.type === "kid" ? "Niño/a" : "Adulto"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditPersonasAdditional((list) => list.filter((_, i) => i !== idx))}
                          className="text-jet/50 hover:text-danger hover:bg-danger/10 rounded p-1 transition-colors"
                          title="Quitar"
                        >
                          <span className="sr-only">Quitar</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label htmlFor={`edit-persona-name-${idx}`} className="block text-xs font-medium text-jet/80 mb-0.5">
                            Nombre <span className="text-danger">*</span>
                          </label>
                          <input
                            id={`edit-persona-name-${idx}`}
                            type="text"
                            value={p.name}
                            onChange={(e) => setEditPersonasAdditional((list) => list.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))}
                            placeholder="Nombre completo"
                            className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-jet placeholder:text-jet/40 focus:outline-none focus:ring-2 focus:ring-brand-sky/50"
                          />
                        </div>
                        <div>
                          <label htmlFor={`edit-persona-dob-${idx}`} className="block text-xs font-medium text-jet/80 mb-0.5">Fecha de nacimiento</label>
                          <input
                            id={`edit-persona-dob-${idx}`}
                            type="text"
                            value={p.dateOfBirth ?? ""}
                            onChange={(e) => setEditPersonasAdditional((list) => list.map((x, i) => (i === idx ? { ...x, dateOfBirth: e.target.value || undefined } : x)))}
                            placeholder="Ej: 15/05/1990"
                            className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-jet placeholder:text-jet/40 focus:outline-none focus:ring-2 focus:ring-brand-sky/50"
                          />
                        </div>
                        <div>
                          <label htmlFor={`edit-persona-cedula-${idx}`} className="block text-xs font-medium text-jet/80 mb-0.5">Cédula/Passaporte</label>
                          <input
                            id={`edit-persona-cedula-${idx}`}
                            type="text"
                            value={p.cedulaPassport ?? ""}
                            onChange={(e) => setEditPersonasAdditional((list) => list.map((x, i) => (i === idx ? { ...x, cedulaPassport: e.target.value || undefined } : x)))}
                            placeholder="Número de documento"
                            className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-jet placeholder:text-jet/40 focus:outline-none focus:ring-2 focus:ring-brand-sky/50"
                          />
                        </div>
                        {p.type === "adult" && (
                          <div>
                            <label htmlFor={`edit-persona-phone-${idx}`} className="block text-xs font-medium text-jet/80 mb-0.5">Teléfono <span className="text-jet/50 font-normal">(opcional)</span></label>
                            <input
                              id={`edit-persona-phone-${idx}`}
                              type="tel"
                              value={p.phone ?? ""}
                              onChange={(e) => setEditPersonasAdditional((list) => list.map((x, i) => (i === idx ? { ...x, phone: e.target.value || undefined } : x)))}
                              placeholder="Ej: 8095551234"
                              className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-jet placeholder:text-jet/40 focus:outline-none focus:ring-2 focus:ring-brand-sky/50"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditPersonasAdditional((list) => [...list, { type: "kid", name: "" }])}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-sky/40 bg-brand-sky/10 px-3 py-2 text-sm font-medium text-brand-sky hover:bg-brand-sky/20 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Niño/a
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPersonasAdditional((list) => [...list, { type: "adult", name: "" }])}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-night-700/40 bg-night-700/10 px-3 py-2 text-sm font-medium text-night-700 hover:bg-night-700/20 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Adulto
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={editCliente.notes}
                  onChange={(e) => setEditCliente((c) => ({ ...c, notes: e.target.value }))}
                  placeholder="Nota"
                  className="w-full bg-white border border-gold-200/50 rounded-lg px-3 py-1.5 text-jet text-sm"
                />
                {invoiceEditError && <p className="text-danger text-xs">{invoiceEditError}</p>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isUpdatingInvoice}
                    className="bg-aqua-700 hover:bg-aqua-700/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                  >
                    {isUpdatingInvoice ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingCliente(false);
                      setInvoiceEditError(null);
                      setEditCliente({
                        customerLabel: invoice.customerLabel,
                        customerPhone: invoice.customerPhone || "",
                        cedula: invoice.cedula || "",
                        provincia: invoice.provincia || "",
                        municipio: invoice.municipio || "",
                        customerAddress: invoice.customerAddress || "",
                        notes: invoice.notes || "",
                      });
                      setEditPersonasAdditional(invoice.personasAdditional?.length ? [...invoice.personasAdditional] : []);
                    }}
                    className="bg-jet/10 hover:bg-jet/20 text-jet px-3 py-1.5 rounded-lg text-xs font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <>
            <p className="text-jet font-medium">
              {invoice.customerLabel}
            </p>
            
            {/* Phone section with edit, WhatsApp, and call options */}
            {isEditingPhone ? (
              <form onSubmit={handlePhoneUpdate} className="mt-2">
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="Ej: 8295551234"
                    className="flex-1 bg-white border border-gold-200/50 rounded-lg px-3 py-1.5 text-jet text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isUpdatingPhone}
                    className="bg-aqua-700 hover:bg-aqua-700/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {isUpdatingPhone ? "..." : "✓"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPhone(false);
                      setNewPhone(invoice.customerPhone || "");
                      setPhoneError(null);
                    }}
                    className="bg-jet/10 hover:bg-jet/20 text-jet px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    ✕
                  </button>
                </div>
                {phoneError && (
                  <p className="text-danger text-xs mt-1">{phoneError}</p>
                )}
              </form>
            ) : (
              <div className="mt-2">
                {invoice.customerPhone ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-jet/70 text-sm">📞 {invoice.customerPhone}</span>
                    <div className="flex gap-1">
                      {/* WhatsApp button with message count */}
                      <button
                        type="button"
                        onClick={() => void handleWhatsAppClick()}
                        className="inline-flex items-center gap-1 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] px-2 py-1 rounded text-xs font-medium transition-colors"
                        title="Enviar por WhatsApp"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WhatsApp
                        {whatsappCount > 0 && (
                          <span className="bg-[#25D366]/30 rounded-full px-1.5 min-w-[1rem] text-center text-[10px] font-semibold">
                            {whatsappCount}
                          </span>
                        )}
                      </button>
                      {/* Call button with call count */}
                      <button
                        type="button"
                        onClick={() => void handleCallClick()}
                        className="inline-flex items-center gap-1 bg-aqua-700/10 hover:bg-aqua-700/20 text-aqua-700 px-2 py-1 rounded text-xs font-medium transition-colors"
                        title="Llamar"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                        </svg>
                        Llamar
                        {callCount > 0 && (
                          <span className="bg-aqua-700/30 rounded-full px-1.5 min-w-[1rem] text-center text-[10px] font-semibold">
                            {callCount}
                          </span>
                        )}
                      </button>
                      {/* Edit button */}
                      <button
                        type="button"
                        onClick={() => setIsEditingPhone(true)}
                        className="inline-flex items-center gap-1 bg-jet/5 hover:bg-jet/10 text-jet/70 px-2 py-1 rounded text-xs font-medium transition-colors"
                        title="Editar teléfono"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(true)}
                    className="text-aqua-700 text-sm hover:underline"
                  >
                    + Agregar teléfono
                  </button>
                )}
              </div>
            )}
            
            {/* Additional customer details grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-sm">
              {invoice.cedula && (
                <p className="text-jet/70">
                  <span className="text-jet/50">Cédula/Passaporte:</span> {invoice.cedula}
                </p>
              )}
              {invoice.provincia && (
                <p className="text-jet/70">
                  <span className="text-jet/50">Provincia:</span> {invoice.provincia}
                </p>
              )}
              {invoice.municipio && (
                <p className="text-jet/70">
                  <span className="text-jet/50">Municipio:</span> {invoice.municipio}
                </p>
              )}
            </div>

            {invoice.customerAddress && (
              <p className="text-jet/70 text-sm mt-2">
                <span className="text-jet/50">Dir:</span> {invoice.customerAddress}
              </p>
            )}

            {invoice.personasAdditional?.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-jet/60 text-xs font-semibold uppercase tracking-wider">Personas adicionales</p>
                <div className="space-y-2">
                  {invoice.personasAdditional.map((p, idx) => (
                    <div key={idx} className="rounded-lg border border-brand-border bg-pearl/50 px-3 py-2 text-sm">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-lg ${p.type === "kid" ? "bg-brand-sky/15 text-brand-sky" : "bg-night-700/10 text-night-700"}`}>
                          {p.type === "kid" ? "Niño/a" : "Adulto"}
                        </span>
                        <span className="text-jet font-medium">{p.name}</span>
                        {p.dateOfBirth && <span className="text-jet/50">· Nac: {p.dateOfBirth}</span>}
                        {p.cedulaPassport && <span className="text-jet/50">· Cédula/Pass: {p.cedulaPassport}</span>}
                        {p.phone && <span className="text-jet/50">· Tel: {p.phone}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {invoice.notes && (
              <p className="text-jet/70 text-sm mt-1">
                <span className="text-jet/50">Nota:</span> {invoice.notes}
              </p>
            )}
              </>
            )}
          </div>

          {/* Sale info */}
          <div className="bg-pearl rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-jet/60 text-xs uppercase tracking-wider">Datos de la Venta</p>
              {!invoice.isVoided && !isEditingSale && (
                <button
                  type="button"
                  onClick={() => setIsEditingSale(true)}
                  className="text-aqua-700 text-xs hover:underline"
                >
                  Editar
                </button>
              )}
            </div>
            {isEditingSale ? (
              <form onSubmit={handleSaveSale} className="space-y-2">
                <div>
                  <label className="block text-jet/60 text-xs mb-0.5">Reserva</label>
                  <input
                    type="date"
                    value={editSale.fechaEntrega}
                    onChange={(e) => setEditSale((s) => ({ ...s, fechaEntrega: e.target.value }))}
                    className="w-full bg-white border border-gold-200/50 rounded-lg px-3 py-1.5 text-jet text-sm"
                  />
                </div>
                <div>
                  <label className="block text-jet/60 text-xs mb-0.5">Tour</label>
                  <input
                    type="date"
                    value={editSale.fechaVisita}
                    onChange={(e) => setEditSale((s) => ({ ...s, fechaVisita: e.target.value }))}
                    className="w-full bg-white border border-gold-200/50 rounded-lg px-3 py-1.5 text-jet text-sm"
                  />
                </div>
                {showSupervisorFilter && (
                  <>
                    <div>
                      <label className="block text-jet/60 text-xs mb-0.5">Supervisor</label>
                      <select
                        value={editSale.supervisor}
                        onChange={(e) => setEditSale((s) => ({ ...s, supervisor: e.target.value }))}
                        className="w-full bg-white border border-gold-200/50 rounded-lg px-3 py-1.5 text-jet text-sm"
                      >
                        <option value="">Seleccionar...</option>
                        {supervisorOptions.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-jet/60 text-xs mb-0.5">Nombre Vendedor</label>
                      <select
                        value={editSale.nombreVendedor}
                        onChange={(e) => setEditSale((s) => ({ ...s, nombreVendedor: e.target.value }))}
                        className="w-full bg-white border border-gold-200/50 rounded-lg px-3 py-1.5 text-jet text-sm"
                      >
                        <option value="">Seleccionar...</option>
                        {sellerOptions.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                {invoiceEditError && <p className="text-danger text-xs">{invoiceEditError}</p>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isUpdatingInvoice}
                    className="bg-aqua-700 hover:bg-aqua-700/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                  >
                    {isUpdatingInvoice ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingSale(false);
                      setInvoiceEditError(null);
                      setEditSale({
                        fechaEntrega: invoice.fechaEntrega ? invoice.fechaEntrega.slice(0, 10) : "",
                        fechaVisita: invoice.fechaVisita ? invoice.fechaVisita.slice(0, 10) : "",
                        supervisor: invoice.supervisor || "",
                        nombreVendedor: invoice.nombreVendedor || "",
                      });
                    }}
                    className="bg-jet/10 hover:bg-jet/20 text-jet px-3 py-1.5 rounded-lg text-xs font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {invoice.fechaEntrega && (
                <p className="text-jet/70">
                  <span className="text-jet/50">Reserva:</span> {formatDate(invoice.fechaEntrega)}
                </p>
              )}
              {invoice.fechaVisita && (
                <p className="text-jet/70">
                  <span className="text-jet/50">Tour:</span> {formatDate(invoice.fechaVisita)}
                </p>
              )}
              {showSupervisorFilter && invoice.supervisor && (
                <p className="text-jet/70">
                  <span className="text-jet/50">Supervisor:</span> {invoice.supervisor}
                </p>
              )}
              {showSupervisorFilter && invoice.nombreVendedor && !isCreadoporValue(invoice.nombreVendedor) && (
                <p className="text-jet/70">
                  <span className="text-jet/50">Nombre Vendedor:</span> {invoice.nombreVendedor}
                </p>
              )}
            </div>
            )}
          </div>

          {/* Items list */}
          <div className="mb-4">
            <p className="text-jet/60 text-xs uppercase tracking-wider mb-2">
              Productos ({invoice.itemsCount} {invoice.itemsCount === 1 ? "item" : "items"})
            </p>
            <div className="space-y-2">
              {invoice.items.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white border rounded-lg p-3 ${
                    invoice.isVoided ? "border-danger/20 opacity-75" : "border-gold-200/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-jet font-medium text-sm ${invoice.isVoided ? "line-through" : ""}`}>
                        {item.tour?.name || "Producto desconocido"}
                      </p>
                      <p className="text-aqua-700 text-xs">
                        {item.tour?.line || "—"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-jet font-semibold text-sm ${invoice.isVoided ? "line-through text-jet/50" : ""}`}>
                        RD$ {item.total.toLocaleString()}
                      </p>
                      {(() => {
                        const unitPrice = item.quantity ? Math.round(item.total / item.quantity) : 0;
                        const isKid = item.tour?.childPrice != null && unitPrice === item.tour.childPrice;
                        return (
                          <p className={`text-xs ${isKid ? "text-amber-600" : "text-jet/50"}`}>
                            {item.quantity} × RD$ {unitPrice.toLocaleString()} ({isKid ? "Niño" : "Adulto"})
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                  {/* Depósito (paid upfront) and Lo que debe (amount still owed) */}
                  {(item.abono || item.pendiente) && (
                    <div className="flex gap-4 mt-2 pt-2 border-t border-gold-200/30 text-xs">
                      {item.abono !== null && item.abono !== undefined && item.abono > 0 && (
                        <span className="text-success">
                          Depósito: RD$ {item.abono.toLocaleString()}
                        </span>
                      )}
                      {item.pendiente !== null && item.pendiente !== undefined && item.pendiente > 0 && (
                        <span className="text-gold-500">
                          Lo que debe: RD$ {item.pendiente.toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Total with depósito (deposit) and lo que debe (amount still owed) */}
          <div className={`rounded-lg p-4 ${invoice.isVoided ? "bg-danger/10" : "bg-gradient-to-r from-aqua-700 to-aqua-500"}`}>
            <div className="flex items-center justify-between">
              <p className={invoice.isVoided ? "text-danger/80 font-medium" : "text-white/80 font-medium"}>
                Total factura
              </p>
              <p className={`text-2xl font-bold ${invoice.isVoided ? "text-danger line-through" : "text-white"}`}>
                RD$ {invoice.total.toLocaleString()}
              </p>
            </div>
            {!invoice.isVoided && (invoice.totalAbono > 0 || invoice.totalPendiente > 0) && (
              <div className="mt-2 pt-2 border-t border-white/20 text-sm space-y-1">
                {invoice.totalAbono > 0 && (
                  <p className="text-white/90">
                    Depósito (pagado al inicio): RD$ {invoice.totalAbono.toLocaleString()}
                  </p>
                )}
                {invoice.totalPendiente > 0 && (
                  <p className="text-gold-500 font-medium">
                    Lo que debe (saldo pendiente): RD$ {invoice.totalPendiente.toLocaleString()}
                  </p>
                )}
                <p className="text-white/70 text-xs mt-1">
                  Total = Depósito + Lo que debe → RD$ {(invoice.totalAbono + invoice.totalPendiente).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Edit invoice - add/update products or prices */}
          {onEdit && !invoice.isVoided && (
            <div className="mt-4 pt-4 border-t border-gold-200/50 no-print">
              <button
                type="button"
                onClick={onEdit}
                className="w-full bg-aqua-700 hover:bg-aqua-700/90 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                Editar factura (agregar productos o cambiar precios)
              </button>
            </div>
          )}

          {/* Void form - only show if not voided and actions enabled */}
          {showVoidActions && !invoice.isVoided && (
            <form onSubmit={handleVoidSubmit} className="mt-4 pt-4 border-t border-gold-200/50 no-print">
              <p className="text-jet/60 text-xs uppercase tracking-wider mb-2">
                Anular Factura
              </p>
              <p className="text-jet/50 text-xs mb-3">
                Al anular la factura, el inventario será restaurado automáticamente.
              </p>
              <div className="space-y-3">
                <div>
                  <label htmlFor="voidReason" className="block text-sm font-medium text-jet/80 mb-1">
                    Motivo (opcional)
                  </label>
                  <input
                    type="text"
                    id="voidReason"
                    value={voidReason}
                    onChange={(e) => onVoidReasonChange(e.target.value)}
                    placeholder="Ej: Cliente canceló el pedido"
                    className="w-full bg-pearl border border-gold-200/50 rounded-lg px-3 py-2 text-jet text-sm focus:outline-none focus:ring-2 focus:ring-danger/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isVoiding}
                  className="w-full bg-danger hover:bg-danger/90 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isVoiding ? "Anulando..." : "Anular Factura y Restaurar Inventario"}
                </button>
              </div>
            </form>
          )}

          {/* Print footer - only shows when printing */}
          <div className="print-only mt-6 pt-4 border-t border-gold-200/50 text-center">
            <p className="text-jet font-medium">¡Gracias por su compra!</p>
            <p className="text-jet/60 text-sm mt-1">{brandConfig.brandName} — {brandConfig.tagline}</p>
            {brandConfig.whatsappNumber && (
              <p className="text-jet/50 text-xs mt-1">WhatsApp: {formatPhoneForDisplay(brandConfig.whatsappNumber)}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gold-200/50 bg-pearl no-print">
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-jet/5 hover:bg-jet/10 border border-jet/20 text-jet py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Cerrar
            </button>
            {invoice.isVoided && showDeleteVoidedActions && onDeleteVoided && (
              <button
                type="button"
                onClick={onDeleteVoided}
                disabled={isDeleting}
                className="flex-1 bg-danger/80 hover:bg-danger text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                title="Eliminar factura anulada permanentemente"
              >
                {isDeleting ? "Eliminando..." : "Eliminar factura"}
              </button>
            )}
            <button
              type="button"
              onClick={handleDownloadServerPdf}
              disabled={isDownloadingServerPdf || invoice.isVoided}
              className="flex-1 bg-aqua-700 hover:bg-aqua-700/90 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              title="Descargar factura PDF (formato oficial Letter)"
            >
              {isDownloadingServerPdf ? "Descargando..." : "📄 Descargar PDF"}
            </button>
            <button
              type="button"
              onClick={handleGeneratePdf}
              disabled={isGeneratingPdf}
              className="flex-1 bg-jet/80 hover:bg-jet text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              title="Generar PDF desde vista previa (HTML)"
            >
              {isGeneratingPdf ? "Generando..." : "Vista previa PDF"}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden PDF Template - positioned off-screen for capture */}
      <div
        ref={pdfContainerRef}
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: "595px",
          backgroundColor: "#ffffff",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
        }}
      >
        <div style={{ padding: "32px 32px 56px 32px", position: "relative" }}>
          {/* Voided watermark */}
          {invoice.isVoided && (
            <div
              style={{
                position: "absolute",
                top: "40%",
                left: "50%",
                transform: "translate(-50%, -50%) rotate(-25deg)",
                fontSize: "48px",
                fontWeight: "bold",
                color: "rgba(180, 35, 24, 0.15)",
                pointerEvents: "none",
                zIndex: 1,
                letterSpacing: "6px",
              }}
            >
              ANULADA
            </div>
          )}

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <img
              src={brandConfig.logoPath}
              alt={brandConfig.brandName}
              style={{ height: "50px", marginBottom: "8px" }}
              crossOrigin="anonymous"
            />
            <h1 style={{ fontSize: "18px", fontWeight: 600, color: "#111", margin: 0 }}>
              {brandConfig.brandName}
            </h1>
          </div>

          {/* Invoice Title */}
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#007C92", margin: 0, letterSpacing: "2px" }}>
              FACTURA
            </h2>
            <p style={{ fontSize: "16px", color: "#007C92", fontWeight: 600, marginTop: "4px" }}>
              #{invoice.batchId.slice(-8).toUpperCase()}
            </p>
            <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "6px" }}>{dateLabel}</p>
          </div>

          {/* Two Column Info */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
            {/* Company Info */}
            <div style={{ flex: 1, background: "#f9fafb", borderRadius: "8px", padding: "14px" }}>
              <h3 style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "#007C92", marginBottom: "8px", fontWeight: 600 }}>
                Datos de la Empresa
              </h3>
              <p style={{ fontWeight: 600, color: "#111", marginBottom: "4px", fontSize: "13px" }}>{brandConfig.brandName}</p>
              <p style={{ fontSize: "11px", color: "#4b5563", lineHeight: 1.5 }}>
                {(() => {
                  const lines = [
                    brandConfig.addressStreet,
                    brandConfig.addressCity,
                    brandConfig.addressCountry,
                    brandConfig.contactEmail,
                    brandConfig.contactEmailSecondary,
                    brandConfig.whatsappNumber ? formatPhoneForDisplay(brandConfig.whatsappNumber) : null,
                    brandConfig.instagramUrl ? `Instagram: ${brandConfig.instagramHandle || brandConfig.instagramUrl}` : null,
                  ].filter(Boolean) as string[];
                  return lines.length > 0 ? lines.map((l, i) => <span key={i}>{l}{i < lines.length - 1 && <br />}</span>) : brandConfig.brandName;
                })()}
              </p>
            </div>
            {/* Client Info */}
            <div style={{ flex: 1, background: "#f9fafb", borderRadius: "8px", padding: "14px" }}>
              <h3 style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "#007C92", marginBottom: "8px", fontWeight: 600 }}>
                Datos del Cliente
              </h3>
              <p style={{ fontWeight: 600, color: "#111", marginBottom: "4px", fontSize: "13px" }}>
                {invoice.customerLabel}
              </p>
              {invoice.customerPhone && (
                <p style={{ fontSize: "11px", color: "#4b5563" }}>Tel: {invoice.customerPhone}</p>
              )}
              {invoice.cedula && (
                <p style={{ fontSize: "11px", color: "#4b5563" }}>Cédula/Passaporte: {invoice.cedula}</p>
              )}
              {invoice.provincia && invoice.municipio && (
                <p style={{ fontSize: "11px", color: "#4b5563" }}>{invoice.municipio}, {invoice.provincia}</p>
              )}
              {invoice.customerAddress && (
                <p style={{ fontSize: "11px", color: "#4b5563" }}>{invoice.customerAddress}</p>
              )}
              {invoice.notes && (
                <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>
                  Nota: {invoice.notes}
                </p>
              )}
            </div>
          </div>

          {/* Sale Info Row */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
            <div style={{ flex: 1, background: "#f9fafb", borderRadius: "8px", padding: "14px" }}>
              <h3 style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "#007C92", marginBottom: "8px", fontWeight: 600 }}>
                Datos de la Venta
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", fontSize: "11px", color: "#4b5563" }}>
                {invoice.fechaEntrega && (
                  <p>Reserva: {formatDate(invoice.fechaEntrega)}</p>
                )}
                {invoice.fechaVisita && (
                  <p>Tour: {formatDate(invoice.fechaVisita)}</p>
                )}
                {showSupervisorFilter && invoice.supervisor && (
                  <p>Supervisor: {invoice.supervisor}</p>
                )}
                {showSupervisorFilter && invoice.nombreVendedor && !isCreadoporValue(invoice.nombreVendedor) && (
                  <p>Nombre Vendedor: {invoice.nombreVendedor}</p>
                )}
              </div>
              <div style={{ marginTop: "8px", display: "flex", gap: "12px", fontSize: "11px" }}>
                <span style={{ 
                  background: invoice.isPaid ? "#dcfce7" : "#fef3c7", 
                  color: currentIsPaid ? "#166534" : "#92400e",
                  padding: "4px 12px",
                  borderRadius: "4px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1
                }}>
                  {currentIsPaid ? "PAGADO" : "PENDIENTE"}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
            <thead>
              <tr style={{ background: "linear-gradient(135deg, #007C92 0%, #00a3b8 100%)" }}>
                <th style={{ padding: "8px 6px", textAlign: "left", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#fff", fontWeight: 600 }}>
                  Producto
                </th>
                <th style={{ padding: "8px 6px", textAlign: "center", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#fff", fontWeight: 600 }}>
                  Cant.
                </th>
                <th style={{ padding: "8px 6px", textAlign: "right", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#fff", fontWeight: 600 }}>
                  Precio
                </th>
                <th style={{ padding: "8px 6px", textAlign: "right", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#fff", fontWeight: 600 }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => {
                const unitPrice = item.quantity ? Math.round(item.total / item.quantity) : 0;
                const isKid = item.tour?.childPrice != null && unitPrice === item.tour.childPrice;
                return (
                  <tr key={index}>
                    <td style={{ padding: "10px 6px", borderBottom: "1px solid #e5e7eb" }}>
                      <div style={{ fontWeight: 500, color: "#111", fontSize: "12px" }}>
                        {item.tour?.name || "Producto"}
                      </div>
                      <div style={{ fontSize: "10px", color: "#007C92" }}>
                        {item.tour?.line || ""}
                      </div>
                    </td>
                    <td style={{ padding: "10px 6px", borderBottom: "1px solid #e5e7eb", textAlign: "center", color: "#111", fontSize: "12px" }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: "10px 6px", borderBottom: "1px solid #e5e7eb", textAlign: "right", color: isKid ? "#b45309" : "#111", fontSize: "12px" }}>
                      RD$ {unitPrice.toLocaleString()} ({isKid ? "Niño" : "Adulto"})
                    </td>
                    <td style={{ padding: "10px 6px", borderBottom: "1px solid #e5e7eb", textAlign: "right", fontWeight: 600, color: "#111", fontSize: "12px" }}>
                      RD$ {item.total.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Total Row */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
            <div
              style={{
                background: "linear-gradient(135deg, #007C92 0%, #00a3b8 100%)",
                color: "white",
                padding: "12px 20px",
                borderRadius: "8px",
                minWidth: "180px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 500 }}>Total factura:</span>
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    textDecoration: invoice.isVoided ? "line-through" : "none",
                  }}
                >
                  RD$ {invoice.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Depósito (deposit) and Lo que debe (amount still owed) */}
          {!invoice.isVoided && (invoice.totalAbono > 0 || invoice.totalPendiente > 0) && (
            <div style={{ marginBottom: "24px", padding: "12px 16px", background: "#f9fafb", borderRadius: "8px", fontSize: "12px", color: "#374151" }}>
              <p style={{ margin: "0 0 4px 0", fontWeight: 600 }}>Resumen de pago</p>
              {invoice.totalAbono > 0 && (
                <p style={{ margin: "0 0 2px 0" }}>Depósito (pagado al inicio): RD$ {invoice.totalAbono.toLocaleString()}</p>
              )}
              {invoice.totalPendiente > 0 && (
                <p style={{ margin: "0 0 2px 0", fontWeight: 600, color: "#C8A96A" }}>Lo que debe (saldo pendiente): RD$ {invoice.totalPendiente.toLocaleString()}</p>
              )}
              <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#6b7280" }}>
                Total = Depósito + Lo que debe → RD$ {(invoice.totalAbono + invoice.totalPendiente).toLocaleString()}
              </p>
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign: "center", paddingTop: "16px", paddingBottom: "8px", borderTop: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: "14px", color: "#111", fontWeight: 500, marginBottom: "4px" }}>
              ¡Gracias por su compra!
            </p>
            <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
              {brandConfig.brandName} — {brandConfig.tagline}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
