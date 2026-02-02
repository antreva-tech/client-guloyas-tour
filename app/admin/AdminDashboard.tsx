"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { brandConfig } from "@/lib/brandConfig";
import type { Product } from "@prisma/client";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { InvoiceHistoryPanel } from "@/components/InvoiceHistoryPanel";
import { ProvinciaPieChart } from "@/components/ProvinciaPieChart";
import { getProvincias } from "@/lib/locationData";
import { IMPORT_ONLY_PRODUCT_NAME, isImportOnlyProduct } from "@/lib/products";
import { UNLIMITED_STOCK } from "@/lib/validation";
import { formatDateTime } from "@/lib/formatDate";
import { canSeeResumen, canSeeProducts, canDeleteVoidedInvoices, showSupervisorFilter } from "@/lib/permissions";
import type { SessionRole } from "@/lib/permissions";

interface AdminDashboardProps {
  initialProducts: Product[];
  lowStockThreshold?: number;
  role?: SessionRole | null;
  supervisorName?: string | null;
}

/**
 * Admin dashboard client component.
 * Manages product listing, editing, and inventory.
 * Responsive design with mobile, iPad (portrait/landscape), and desktop support.
 * - Mobile portrait: Single column, card views
 * - Mobile landscape: 2-column grids where applicable
 * - iPad portrait: 2-column layouts, card views for products
 * - iPad landscape / Desktop: Full table views, 3+ column grids
 */
/**
 * Sale item for invoice.
 * Includes abono (partial payment) and pendiente (pending) amounts.
 */
interface SaleItem {
  productId: string;
  productName: string;
  productLine: string;
  quantity: number;
  unitPrice: number;
  total: number;
  abono?: number;
  pendiente?: number;
}

/**
 * Completed sale with invoice data.
 * Includes all customer and sale information fields.
 */
interface CompletedSale {
  id: string;
  items: SaleItem[];
  subtotal: number;
  customerName: string;
  customerPhone: string;
  cedula: string;
  provincia: string;
  municipio: string;
  customerAddress?: string;
  lugarTrabajo: string;
  notes?: string;
  fechaEntrega: string;
  fechaVisita: string;
  supervisor: string;
  nombreVendedor: string;
  isPaid: boolean;
  date: string;
}

type AdminView = "overview" | "products" | "sales";

export function AdminDashboard({
  initialProducts,
  lowStockThreshold = 5,
  role = "admin",
  supervisorName = null,
}: AdminDashboardProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingSale, setIsCreatingSale] = useState(false);
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<{
    batchId: string;
    items: Array<{
      id: string;
      productId: string;
      quantity: number;
      total: number;
      abono?: number | null;
      pendiente?: number | null;
      product?: { name?: string; line?: string };
    }>;
  } | null>(null);
  const defaultView: AdminView = canSeeResumen(role) ? "overview" : "sales";
  const [activeView, setActiveView] = useState<AdminView>(defaultView);
  const [paidStats, setPaidStats] = useState<{
    paidRevenue: number;
    paidUnits: number;
    topSellers: Array<{ nombreVendedor: string; totalRevenue: number; invoiceCount: number }>;
    provinciaStats: Array<{ provincia: string; total: number }>;
  }>({ paidRevenue: 0, paidUnits: 0, topSellers: [], provinciaStats: [] });
  const [invoiceListRefreshKey, setInvoiceListRefreshKey] = useState(0);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    variant: "danger" | "default";
    onConfirm: () => void;
  } | null>(null);

  /**
   * Refreshes paid-invoice stats (revenue from fully paid invoices only).
   */
  async function refreshPaidStats() {
    const res = await fetch("/api/sales/stats");
    if (res.ok) {
      const data = await res.json();
      setPaidStats({
        paidRevenue: data.paidRevenue ?? 0,
        paidUnits: data.paidUnits ?? 0,
        topSellers: data.topSellers ?? [],
        provinciaStats: data.provinciaStats ?? [],
      });
    }
  }

  /**
   * Refreshes product list from API.
   * Supervisor uses public endpoint (no ?all=true) since they cannot access products management.
   */
  async function refreshProducts() {
    const url = canSeeProducts(role) ? "/api/products?all=true" : "/api/products";
    const res = await fetch(url);
    if (res.ok) {
      setProducts(await res.json());
    }
  }

  /**
   * Toggles product active status. Opens confirmation modal before changing.
   */
  function handleToggleActive(id: string, isActive: boolean) {
    const product = products.find((p) => p.id === id);
    const name = product?.name ?? "este producto";
    const willActivate = !isActive;
    setConfirmModal({
      title: willActivate ? "Reactivar producto" : "Desactivar producto",
      message: willActivate
        ? `¿Reactivar "${name}"?\n\nVolverá a aparecer en el catálogo y ventas.`
        : `¿Desactivar "${name}"?\n\nYa no aparecerá en el catálogo ni en ventas.`,
      confirmLabel: willActivate ? "Reactivar" : "Desactivar",
      variant: "default",
      onConfirm: async () => {
        const res = await fetch(`/api/products/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: willActivate }),
        });
        if (res.ok) await refreshProducts();
      },
    });
  }

  /**
   * Permanently deletes a product. Opens confirmation modal. API blocks if product has sales.
   */
  function handleDeleteProduct(product: Product) {
    setConfirmModal({
      title: "Eliminar producto",
      message: `¿Eliminar "${product.name}" permanentemente?\n\nEsta acción no se puede deshacer. El producto se borrará de la base de datos.`,
      confirmLabel: "Eliminar",
      variant: "danger",
      onConfirm: async () => {
        const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          await refreshProducts();
        } else {
          alert(data.error || "Error al eliminar");
        }
      },
    });
  }

  /**
   * Opens the edit form for a product.
   */
  function handleEditProduct(product: Product) {
    setEditingProduct(product);
    setIsCreating(false);
  }

  // Calculate summary stats (exclude UNLIMITED_STOCK from total)
  const totalStock = products.reduce((sum, p) => sum + (p.stock >= 0 ? p.stock : 0), 0);
  const totalSold = products.reduce((sum, p) => sum + p.sold, 0);
  const activeProducts = products.filter((p) => p.isActive).length;
  const totalRevenue = products.reduce((sum, p) => sum + (p.price * p.sold), 0);
  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= lowStockThreshold);
  const outOfStockProducts = products.filter((p) => p.stock === 0 && p.isActive);
  const usesInventory = products.some((p) => p.stock >= 0);
  
  // Best selling product
  const bestSeller = products.length > 0 
    ? products.reduce((best, p) => p.sold > best.sold ? p : best, products[0])
    : null;

  /**
   * Saves current month snapshot to database.
   */
  async function handleSaveSnapshot() {
    const res = await fetch("/api/export", { method: "POST" });
    if (res.ok) {
      alert("Resumen mensual guardado exitosamente");
    } else {
      alert("Error al guardar el resumen");
    }
  }

  /**
   * Closes forms and panels when switching views.
   */
  function closeOverlays() {
    setIsCreating(false);
    setIsCreatingSale(false);
    setEditingProduct(null);
    setCompletedSale(null);
  }

  /**
   * Applies styling for the admin view tabs.
   * @param view - The view that the button represents.
   */
  function getViewButtonClass(view: AdminView) {
    const isActive = activeView === view;
    return [
      "px-3 py-2 rounded-lg text-xs font-medium transition-colors",
      isActive
        ? "bg-aqua-700 text-white"
        : "bg-aqua-700/10 text-aqua-700 hover:bg-aqua-700/20",
    ].join(" ");
  }

  useEffect(() => {
    closeOverlays();
  }, [activeView]);

  useEffect(() => {
    if (activeView === "overview") refreshPaidStats();
  }, [activeView]);

  return (
    <>
    <div className="space-y-4 sm:space-y-6 tablet-lg:space-y-8">
      {/* Header with view tabs - responsive for all orientations */}
      <div className="flex flex-col gap-3 landscape:flex-row landscape:items-center landscape:justify-between tablet:flex-row tablet:items-center tablet:justify-between">
        <div>
          <h2 className="text-lg tablet:text-xl font-semibold text-jet">
            Panel Administrativo
          </h2>
          <p className="text-jet/50 text-xs mt-0.5">
            Cambia entre vistas para organizar el trabajo
          </p>
        </div>
        {/* View tabs - supervisor sees only Ventas */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 tablet:overflow-visible tablet:flex-wrap">
          {canSeeResumen(role) && (
            <button
              type="button"
              onClick={() => setActiveView("overview")}
              className={`${getViewButtonClass("overview")} whitespace-nowrap flex-shrink-0`}
            >
              Resumen
            </button>
          )}
          {canSeeProducts(role) && (
            <button
              type="button"
              onClick={() => setActiveView("products")}
              className={`${getViewButtonClass("products")} whitespace-nowrap flex-shrink-0`}
            >
              Productos
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveView("sales")}
            className={`${getViewButtonClass("sales")} whitespace-nowrap flex-shrink-0`}
          >
            Ventas
          </button>
        </div>
      </div>

      {/* KPI Section */}
      {activeView === "overview" && (
        <div className="space-y-4">
        {usesInventory ? (
          <>
            {/* Stock shown: Ingresos full-width above, then stats grid */}
            <div className="bg-gradient-to-r from-aqua-700 to-aqua-500 rounded-xl p-4 tablet:p-5 tablet-lg:p-6 text-white">
              <div className="flex flex-col landscape:flex-row landscape:items-center landscape:justify-between tablet:flex-row tablet:items-center tablet:justify-between gap-4">
                <div>
                  <p className="text-white/80 text-sm font-medium">Ingresos cobrados (facturas pagadas)</p>
                  <p className="text-2xl mobile-landscape:text-3xl tablet:text-3xl tablet-lg:text-4xl font-bold mt-1">
                    RD$ {paidStats.paidRevenue.toLocaleString()}
                  </p>
                  <p className="text-white/70 text-sm mt-2">
                    {paidStats.paidUnits} unidades en facturas pagadas
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-3 tablet:gap-4 grid-cols-2 mobile-landscape:grid-cols-4 tablet-portrait:grid-cols-2 tablet-landscape:grid-cols-4">
              <StatCard label="Productos Activos" value={activeProducts} />
              <StatCard label="En Inventario" value={totalStock} />
              <StatCard
                label="Stock Bajo"
                value={lowStockProducts.length}
                warning={lowStockProducts.length > 0}
              />
              <StatCard
                label="Sin Stock"
                value={outOfStockProducts.length}
                danger={outOfStockProducts.length > 0}
              />
            </div>
          </>
        ) : (
          /* Stock hidden: Ingresos next to Productos Activos, Ingresos larger */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 tablet:gap-4">
            <div className="sm:col-span-2 bg-gradient-to-r from-aqua-700 to-aqua-500 rounded-xl p-4 tablet:p-5 text-white">
              <p className="text-white/80 text-sm font-medium">Ingresos cobrados (facturas pagadas)</p>
              <p className="text-2xl mobile-landscape:text-3xl font-bold mt-1">
                RD$ {paidStats.paidRevenue.toLocaleString()}
              </p>
              <p className="text-white/70 text-sm mt-2">
                {paidStats.paidUnits} unidades en facturas pagadas
              </p>
            </div>
            <div className="flex items-stretch">
              <div className="w-full rounded-xl border border-gold-200/50 bg-porcelain p-4 flex flex-col justify-center">
                <p className="text-jet/60 text-xs uppercase tracking-wider">Productos Activos</p>
                <p className="text-2xl font-bold text-jet mt-1">{activeProducts}</p>
              </div>
            </div>
          </div>
        )}

        {/* Best product & Top sellers & alerts */}
        <div className="grid mobile-landscape:grid-cols-2 tablet:grid-cols-3 gap-3 tablet:gap-4">
          {bestSeller && bestSeller.sold > 0 && (
            <div className="bg-porcelain rounded-xl border border-gold-200/50 p-4">
              <p className="text-jet/60 text-xs uppercase tracking-wider mb-2">Producto más vendido</p>
              <p className="text-jet font-semibold">{bestSeller.name}</p>
              <p className="text-aqua-700 text-sm">{bestSeller.line}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gold-200/30">
                <span className="text-gold-500 font-bold">{bestSeller.sold} vendidos</span>
                <span className="text-jet/60 text-sm">
                  RD$ {(bestSeller.price * bestSeller.sold).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="bg-porcelain rounded-xl border border-gold-200/50 p-4 tablet:col-span-2 flex flex-col sm:flex-row gap-4">
              {paidStats.topSellers.length > 0 && (
                <div className="flex-1 min-w-0">
                  <p className="text-jet/60 text-xs uppercase tracking-wider mb-2">Top en Ventas</p>
                  <div className="space-y-2">
                    {paidStats.topSellers.map((s, i) => (
                      <div key={`${s.nombreVendedor}-${i}`} className="flex items-center justify-between text-sm">
                        <span className="text-jet font-medium truncate">
                          {i + 1}. {s.nombreVendedor}
                        </span>
                        <span className="text-gold-500 font-bold shrink-0 ml-2">
                          RD$ {s.totalRevenue.toLocaleString()} ({s.invoiceCount} {s.invoiceCount === 1 ? "factura" : "facturas"})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex-1 min-w-0 border-t border-gold-200/30 pt-4 sm:border-t-0 sm:border-l sm:border-gold-200/30 sm:pt-0 sm:pl-4">
                <p className="text-jet/60 text-xs uppercase tracking-wider mb-2">Ventas por provincia</p>
                <ProvinciaPieChart data={paidStats.provinciaStats} />
              </div>
            </div>
          
          {usesInventory && (lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
            <div className="bg-porcelain rounded-xl border border-gold-200/50 p-4">
              <p className="text-jet/60 text-xs uppercase tracking-wider mb-2">Alertas de Inventario</p>
              <div className="space-y-2">
                {outOfStockProducts.slice(0, 2).map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-jet truncate">{p.name} - {p.line}</span>
                    <span className="text-danger font-medium shrink-0 ml-2">Sin stock</span>
                  </div>
                ))}
                {lowStockProducts.slice(0, 2).map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-jet truncate">{p.name} - {p.line}</span>
                    <span className="text-gold-500 font-medium shrink-0 ml-2">{p.stock} unidades</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <InvoiceHistoryPanel
          limit={5}
          showSearch={false}
          showVoidActions={false}
          showRefresh={false}
          showSupervisorFilter={showSupervisorFilter(role)}
          showDeleteVoidedActions={canDeleteVoidedInvoices(role)}
          onInvoiceDeleted={() => void refreshPaidStats()}
          title="Últimas 5 facturas"
          subtitle="Vista rápida de las ventas recientes"
        />

        </div>
      )}

      {/* Products view - responsive for all screen sizes and orientations */}
      {activeView === "products" && (
        <>
          <div className="flex flex-col landscape:flex-row landscape:justify-between landscape:items-center tablet:flex-row tablet:justify-between tablet:items-center gap-3">
            <h2 className="text-lg tablet:text-xl font-semibold text-jet">
              Gestión de Productos
            </h2>
            <div className="flex gap-2 w-full landscape:w-auto tablet:w-auto">
              <button
                onClick={() => setIsCreating(true)}
                className="btn-primary w-full landscape:w-auto tablet:w-auto px-4 py-3 tablet:py-2 rounded-lg text-sm font-semibold"
              >
                + Nuevo Producto
              </button>
            </div>
          </div>

          {/* Create product form */}
          {isCreating && (
            <ProductForm
              onClose={() => setIsCreating(false)}
              onSave={refreshProducts}
            />
          )}

          {/* Edit product modal */}
          {editingProduct && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-jet/50"
              onClick={() => setEditingProduct(null)}
            >
              <div
                className="bg-porcelain rounded-xl border border-gold-200/50 shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-gold-200/50 flex items-center justify-between flex-shrink-0">
                  <h3 className="text-lg font-semibold text-jet">Editar Producto</h3>
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="text-jet/60 hover:text-jet p-1 text-2xl leading-none"
                    aria-label="Cerrar"
                  >
                    ×
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 min-h-0">
                  <EditProductForm
                    product={editingProduct}
                    onClose={() => setEditingProduct(null)}
                    onSave={refreshProducts}
                    embedInModal
                  />
                </div>
              </div>
            </div>
          )}

          {/* Product cards: responsive grid across all viewports */}
          {/* Mobile portrait: 1 col | Mobile landscape & tablet portrait: 2 cols | Tablet landscape & desktop: 3–5 cols (compact cards) */}
          <div className="space-y-3 mobile-landscape:space-y-0 mobile-landscape:grid mobile-landscape:grid-cols-2 mobile-landscape:gap-3 tablet-portrait:space-y-0 tablet-portrait:grid tablet-portrait:grid-cols-2 tablet-portrait:gap-4 tablet-landscape:space-y-0 tablet-landscape:grid tablet-landscape:grid-cols-3 tablet-landscape:gap-3 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={() => handleEditProduct(product)}
                onToggleActive={handleToggleActive}
                onDelete={() => handleDeleteProduct(product)}
              />
            ))}
            {products.length === 0 && (
              <div className="bg-porcelain rounded-xl border border-gold-200/50 p-6 text-center text-jet/50 col-span-full">
                No hay productos. Crea uno nuevo para comenzar.
              </div>
            )}
          </div>
        </>
      )}

      {activeView === "sales" && (
        <>
          <div className="flex flex-col landscape:flex-row landscape:justify-between landscape:items-center tablet:flex-row tablet:justify-between tablet:items-center gap-3">
            <h2 className="text-lg tablet:text-xl font-semibold text-jet">
              Gestión de Ventas
            </h2>
            <div className="flex gap-2 w-full landscape:w-auto tablet:w-auto">
              <button
                onClick={() => setIsCreatingSale(true)}
                className="bg-success hover:bg-success/90 text-white w-full landscape:w-auto tablet:w-auto px-4 py-3 tablet:py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                💰 Nueva Venta
              </button>
            </div>
          </div>

          {/* Sale form */}
          {isCreatingSale && (
            <SaleForm
              products={products.filter((p) => p.isActive && !isImportOnlyProduct(p) && (p.stock > 0 || p.stock === UNLIMITED_STOCK))}
              onClose={() => setIsCreatingSale(false)}
              onComplete={(sale) => {
                setCompletedSale(sale);
                setIsCreatingSale(false);
                refreshProducts();
              }}
              defaultSupervisor={supervisorName}
            />
          )}

          {/* Invoice display */}
          {completedSale && (
            <Invoice
              sale={completedSale}
              onClose={() => setCompletedSale(null)}
            />
          )}

          <InvoiceHistoryPanel
            refreshTrigger={invoiceListRefreshKey}
            onInvoiceVoided={() => {
              refreshProducts();
              void refreshPaidStats();
            }}
            onInvoiceDeleted={() => {
              void refreshPaidStats();
            }}
            onEditInvoice={async (inv) => {
              try {
                const res = await fetch(`/api/sales/${inv.batchId}`);
                if (!res.ok) return;
                const items = await res.json();
                setEditingInvoice({ batchId: inv.batchId, items });
              } catch {
                /* ignore; user can retry */
              }
            }}
            showMonthFilter
            showSupervisorFilter={showSupervisorFilter(role)}
            showDeleteVoidedActions={canDeleteVoidedInvoices(role)}
            pageSize={10}
          />

          {editingInvoice && (
            <EditInvoiceModal
              invoice={editingInvoice}
              products={products.filter((p) => p.isActive && !isImportOnlyProduct(p) && (p.stock > 0 || p.stock === UNLIMITED_STOCK))}
              onClose={() => setEditingInvoice(null)}
              onSaved={() => {
                refreshProducts();
                setEditingInvoice(null);
                setInvoiceListRefreshKey((k) => k + 1);
              }}
            />
          )}
        </>
      )}
    </div>

    {confirmModal && (
      <ConfirmationModal
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        cancelLabel="Cancelar"
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(null)}
      />
    )}
    </>
  );
}

/**
 * Statistics card component.
 * Responsive padding and font sizes for mobile.
 * Supports warning and danger variants for alerts.
 * Light theme variant.
 */
function StatCard({
  label,
  value,
  secondary = false,
  warning = false,
  danger = false,
}: {
  label: string;
  value: number;
  secondary?: boolean;
  warning?: boolean;
  danger?: boolean;
}) {
  const getBgClass = () => {
    if (danger && value > 0) return "bg-danger/10 border-danger/30";
    if (warning && value > 0) return "bg-gold-500/10 border-gold-500/30";
    if (secondary) return "bg-pearl border-gold-200/50";
    return "bg-porcelain border-gold-200/50";
  };

  const getValueClass = () => {
    if (danger && value > 0) return "text-danger";
    if (warning && value > 0) return "text-gold-500";
    return "text-jet";
  };

  return (
    <div className={`p-3 md:p-4 rounded-xl border shadow-sm ${getBgClass()}`}>
      <p className="text-jet/60 text-xs md:text-sm truncate">{label}</p>
      <p className={`text-xl md:text-2xl font-bold mt-1 ${getValueClass()}`}>
        {value}
      </p>
    </div>
  );
}

/**
 * Product card component (mobile and desktop).
 * Compact styling on tablet-landscape+ for denser PC view.
 * Hides stock box when stock is "-" (unlimited). Shows offer price when set.
 * Light theme variant.
 */
function ProductCard({
  product,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  product: Product;
  onEdit: () => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: () => void;
}) {
  const canDelete = !isImportOnlyProduct(product) && product.sold === 0;
  const showStock = product.stock !== UNLIMITED_STOCK;
  const offerPrice = (product as { specialOfferPrice?: number | null }).specialOfferPrice;
  const hasOffer = offerPrice != null && offerPrice > 0;
  return (
    <div className="bg-porcelain rounded-xl border border-gold-200/50 shadow-sm p-4 tablet-landscape:p-3 overflow-hidden">
      {/* Product image (when available) */}
      {product.imageUrl && (
        <div className="relative w-[240px] h-[240px] tablet-landscape:w-[180px] tablet-landscape:h-[180px] mx-auto mb-3 tablet-landscape:mb-2 rounded-lg overflow-hidden bg-pearl">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 240px, 180px"
            className="object-contain p-1"
          />
        </div>
      )}
      {/* Header: Name + Status */}
      <div className="flex items-start justify-between gap-2 mb-3 tablet-landscape:mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-jet font-medium truncate text-sm tablet-landscape:text-xs">{product.name}</p>
          <p className="text-aqua-700 text-sm tablet-landscape:text-xs">{product.line}</p>
        </div>
        <button
          onClick={() => onToggleActive(product.id, product.isActive)}
          className={`shrink-0 px-2 py-1 rounded text-xs font-medium min-h-[28px] tablet-landscape:min-h-[24px] ${
            product.isActive
              ? "bg-success/20 text-success"
              : "bg-danger/20 text-danger"
          }`}
        >
          {product.isActive ? "Activo" : "Inactivo"}
        </button>
      </div>

      {/* Stats row: Precio, Stock (if tracked), Oferta (if set), Vendido */}
      <div className="grid grid-cols-2 gap-1.5 mb-4 tablet-landscape:mb-2 tablet-landscape:gap-1 tablet-landscape:grid-cols-2">
        <div className="bg-pearl rounded-lg p-2.5 text-center tablet-landscape:p-1.5">
          <p className="text-jet/50 text-xs tablet-landscape:text-[10px]">Precio</p>
          <p className="text-jet font-medium text-sm tablet-landscape:text-xs">
            {product.currency} {product.price.toLocaleString()}
          </p>
        </div>
        {showStock && (
          <div className="bg-pearl rounded-lg p-2.5 text-center tablet-landscape:p-1.5">
            <p className="text-jet/50 text-xs tablet-landscape:text-[10px]">Stock</p>
            <p className={`font-medium text-sm tablet-landscape:text-xs ${product.stock === 0 ? "text-danger" : "text-jet"}`}>
              {product.stock}
            </p>
          </div>
        )}
        {hasOffer && (
          <div className="bg-gold-500/10 rounded-lg p-2.5 text-center tablet-landscape:p-1.5 border border-gold-500/30">
            <p className="text-gold-500 text-xs tablet-landscape:text-[10px]">Oferta</p>
            <p className="text-gold-500 font-medium text-sm tablet-landscape:text-xs">
              {product.currency} {offerPrice!.toLocaleString()}
            </p>
          </div>
        )}
        <div className="bg-pearl rounded-lg p-2.5 text-center tablet-landscape:p-1.5">
          <p className="text-jet/50 text-xs tablet-landscape:text-[10px]">Vendido</p>
          <p className="text-gold-500 font-medium text-sm tablet-landscape:text-xs">{product.sold}</p>
        </div>
      </div>

      {/* Edit + Delete buttons */}
      <div className="flex gap-2 tablet-landscape:gap-1.5">
        <button
          onClick={onEdit}
          className="flex-1 bg-aqua-700/10 text-aqua-700 py-2.5 rounded-lg text-sm font-medium min-h-[44px] tablet-landscape:py-1.5 tablet-landscape:min-h-[36px] tablet-landscape:text-xs"
        >
          Editar
        </button>
        {canDelete && (
          <button
            onClick={onDelete}
            className="bg-danger/10 text-danger py-2.5 px-4 rounded-lg text-sm font-medium min-h-[44px] tablet-landscape:py-1.5 tablet-landscape:px-3 tablet-landscape:min-h-[36px] tablet-landscape:text-xs"
            title="Eliminar permanentemente"
          >
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * New product form component.
 * Mobile-optimized with full-width inputs and larger touch targets.
 * Supports image file upload.
 * Light theme variant.
 */
function ProductForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  /**
   * Handles image file selection and upload.
   */
  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al subir imagen");
      }

      const data = await res.json();
      setImageUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir imagen");
      setImagePreview(null);
    } finally {
      setIsUploading(false);
    }
  }

  /**
   * Removes the selected image.
   */
  function handleRemoveImage() {
    setImageUrl(null);
    setImagePreview(null);
  }

  /**
   * Handles form submission to create new product.
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const stockRaw = (formData.get("stock") as string)?.trim() ?? "";
    const stock = stockRaw === "-" ? UNLIMITED_STOCK : Math.max(UNLIMITED_STOCK, parseInt(stockRaw, 10) || 0);
    const specialOfferRaw = (formData.get("specialOfferPrice") as string)?.trim() ?? "";
    const specialOfferPrice = specialOfferRaw === "" ? null : Math.max(0, parseInt(specialOfferRaw, 10) || 0);
    const sequence = Math.max(0, parseInt((formData.get("sequence") as string) || "0", 10) || 0);
    const data = {
      name: formData.get("name") as string,
      line: formData.get("line") as string,
      description: formData.get("description") as string,
      price: parseInt(formData.get("price") as string) || 0,
      specialOfferPrice,
      stock,
      isKit: formData.get("isKit") === "on",
      isIndividual: formData.get("isIndividual") === "on",
      sequence,
      imageUrl: imageUrl || undefined,
    };

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al crear producto");
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-porcelain rounded-xl border border-gold-200/50 shadow-sm p-4 tablet:p-5 tablet-lg:p-6">
      <h3 className="text-lg font-semibold text-jet mb-4">
        Nuevo Producto
      </h3>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* Responsive grid: 1 col mobile portrait, 2 cols landscape/tablet */}
      <form onSubmit={handleSubmit} className="grid mobile-landscape:grid-cols-2 tablet:grid-cols-2 gap-3 tablet:gap-4">
        <FormField label="Nombre" name="name" required />
        <FormField label="Línea" name="line" required />
        <FormField
          label="Descripción"
          name="description"
          required
          className="mobile-landscape:col-span-2 tablet:col-span-2"
        />
        <FormField label="Precio (RD$)" name="price" type="number" required />
        <div>
          <label htmlFor="create-specialOfferPrice" className="block text-sm font-medium text-jet/80 mb-1">Precio Oferta (RD$)</label>
          <input
            id="create-specialOfferPrice"
            name="specialOfferPrice"
            type="number"
            min={0}
            placeholder="Opcional"
            className="w-full bg-pearl border border-gold-200/50 rounded-lg px-3 py-2 text-jet text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500"
          />
          <p className="text-jet/50 text-xs mt-1">Si se define, aparecerá en la venta con precio normal y oferta.</p>
        </div>
        <div>
          <label htmlFor="create-stock" className="block text-sm font-medium text-jet/80 mb-1">Stock Inicial</label>
          <input
            id="create-stock"
            name="stock"
            type="text"
            placeholder="0 o - (siempre disponible)"
            className="w-full bg-pearl border border-gold-200/50 rounded-lg px-3 py-2 text-jet text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500"
          />
          <p className="text-jet/50 text-xs mt-1">Use &quot;-&quot; para siempre disponible (solo se registran ventas).</p>
        </div>
        
        {/* Sequence - display order in catalog */}
        <div>
          <label htmlFor="create-sequence" className="block text-sm font-medium text-jet/80 mb-1">Orden en catálogo</label>
          <input
            id="create-sequence"
            name="sequence"
            type="number"
            min={0}
            defaultValue={0}
            placeholder="0"
            className="w-full bg-pearl border border-gold-200/50 rounded-lg px-3 py-2 text-jet text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500"
          />
          <p className="text-jet/50 text-xs mt-1">Número menor = aparece primero en Kits o Individuales.</p>
        </div>
        {/* Kit / Individual category checkboxes for main site filtering */}
        <div className="mobile-landscape:col-span-2 tablet:col-span-2 space-y-3">
          <p className="text-sm font-medium text-jet/80">Categoría (para el sitio web)</p>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isKit"
              className="w-5 h-5 rounded border-gold-200/50 text-aqua-700 focus:ring-aqua-500"
            />
            <span className="text-sm font-medium text-jet/80">Kit</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isIndividual"
              className="w-5 h-5 rounded border-gold-200/50 text-aqua-700 focus:ring-aqua-500"
            />
            <span className="text-sm font-medium text-jet/80">Individual</span>
          </label>
          <p className="text-jet/50 text-xs">
            Marque Kit y/o Individual para separar categorías en el catálogo público cuando esté listo.
          </p>
        </div>
        
        {/* Image upload field */}
        <div className="mobile-landscape:col-span-2 tablet:col-span-2">
          <label className="block text-sm font-medium text-jet/80 mb-1.5">
            Imagen del Producto
          </label>
          
          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-lg border border-gold-200/50"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-danger text-white w-6 h-6 rounded-full text-sm flex items-center justify-center hover:bg-danger/80"
                aria-label="Eliminar imagen"
              >
                ×
              </button>
              {isUploading && (
                <div className="absolute inset-0 bg-jet/50 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">Subiendo...</span>
                </div>
              )}
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gold-200 rounded-lg cursor-pointer hover:border-aqua-500 transition-colors bg-pearl">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-8 h-8 mb-2 text-jet/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm text-jet/60">
                  <span className="text-aqua-700 font-medium">Subir imagen</span> o arrastrar
                </p>
                <p className="text-xs text-jet/40 mt-1">PNG, JPG, WebP (máx. 5MB)</p>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Buttons - responsive for all devices */}
        <div className="mobile-landscape:col-span-2 tablet:col-span-2 flex flex-col-reverse landscape:flex-row tablet:flex-row gap-3 landscape:justify-end tablet:justify-end mt-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-jet/5 hover:bg-jet/10 border border-jet/20 text-jet w-full landscape:w-auto tablet:w-auto px-4 py-3 tablet:py-2 rounded-lg text-sm min-h-[44px] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="btn-primary w-full landscape:w-auto tablet:w-auto px-4 py-3 tablet:py-2 rounded-lg text-sm font-semibold disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? "Guardando..." : "Crear Producto"}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Edit product form component.
 * Pre-populated with existing product data.
 * Supports updating name, line, price, description, stock, and image.
 * When embedInModal is true, omits outer card and header (provided by modal).
 */
function EditProductForm({
  product,
  onClose,
  onSave,
  embedInModal = false,
}: {
  product: Product;
  onClose: () => void;
  onSave: () => void;
  embedInModal?: boolean;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(product.imageUrl);
  const [imagePreview, setImagePreview] = useState<string | null>(product.imageUrl);

  /**
   * Handles image file selection and upload.
   */
  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al subir imagen");
      }

      const data = await res.json();
      setImageUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir imagen");
      setImagePreview(product.imageUrl);
    } finally {
      setIsUploading(false);
    }
  }

  /**
   * Removes the selected image.
   */
  function handleRemoveImage() {
    setImageUrl(null);
    setImagePreview(null);
  }

  /**
   * Handles form submission to update product.
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const stockRaw = (formData.get("stock") as string)?.trim() ?? "";
    const stock = stockRaw === "-" ? UNLIMITED_STOCK : Math.max(UNLIMITED_STOCK, parseInt(stockRaw, 10) || 0);
    const specialOfferRaw = (formData.get("specialOfferPrice") as string)?.trim() ?? "";
    const specialOfferPrice = specialOfferRaw === "" ? null : Math.max(0, parseInt(specialOfferRaw, 10) || 0);
    const sequence = Math.max(0, parseInt((formData.get("sequence") as string) || "0", 10) || 0);
    const data = {
      name: formData.get("name") as string,
      line: formData.get("line") as string,
      description: formData.get("description") as string,
      price: parseInt(formData.get("price") as string) || 0,
      specialOfferPrice,
      stock,
      sold: parseInt(formData.get("sold") as string) || 0,
      isKit: formData.get("isKit") === "on",
      isIndividual: formData.get("isIndividual") === "on",
      sequence,
      imageUrl: imageUrl || null,
    };

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al actualizar producto");
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={embedInModal ? "p-4 tablet:p-5 tablet-lg:p-6" : "bg-porcelain rounded-xl border border-gold-200/50 shadow-sm p-4 tablet:p-5 tablet-lg:p-6"}>
      {!embedInModal && (
        <h3 className="text-lg font-semibold text-jet mb-4">
          Editar Producto
        </h3>
      )}

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* Responsive grid: 1 col mobile portrait, 2 cols landscape/tablet */}
      <form onSubmit={handleSubmit} className="grid mobile-landscape:grid-cols-2 tablet:grid-cols-2 gap-3 tablet:gap-4">
        <FormField
          label="Nombre"
          name="name"
          defaultValue={product.name}
          required
        />
        <FormField
          label="Línea"
          name="line"
          defaultValue={product.line}
          required
        />
        <FormField
          label="Descripción"
          name="description"
          defaultValue={product.description}
          required
          className="mobile-landscape:col-span-2 tablet:col-span-2"
        />
        <FormField
          label="Precio (RD$)"
          name="price"
          type="number"
          defaultValue={product.price.toString()}
          required
        />
        <div>
          <label htmlFor="edit-specialOfferPrice" className="block text-sm font-medium text-jet/80 mb-1">Precio Oferta (RD$)</label>
          <input
            id="edit-specialOfferPrice"
            name="specialOfferPrice"
            type="number"
            min={0}
            defaultValue={(product as { specialOfferPrice?: number | null }).specialOfferPrice ?? ""}
            placeholder="Opcional"
            className="w-full bg-pearl border border-gold-200/50 rounded-lg px-3 py-2 text-jet text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500"
          />
          <p className="text-jet/50 text-xs mt-1">Si se define, aparecerá en la venta con precio normal y oferta.</p>
        </div>
        <div>
          <label htmlFor="edit-stock" className="block text-sm font-medium text-jet/80 mb-1">Stock</label>
          <input
            id="edit-stock"
            name="stock"
            type="text"
            defaultValue={product.stock === UNLIMITED_STOCK ? "-" : product.stock.toString()}
            placeholder="0 o - (siempre disponible)"
            className="w-full bg-pearl border border-gold-200/50 rounded-lg px-3 py-2 text-jet text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500"
          />
          <p className="text-jet/50 text-xs mt-1">Use &quot;-&quot; para siempre disponible.</p>
        </div>
        <FormField
          label="Unidades Vendidas"
          name="sold"
          type="number"
          defaultValue={product.sold.toString()}
        />
        <div>
          <label htmlFor="edit-sequence" className="block text-sm font-medium text-jet/80 mb-1">Orden en catálogo</label>
          <input
            id="edit-sequence"
            name="sequence"
            type="number"
            min={0}
            defaultValue={(product as { sequence?: number }).sequence ?? 0}
            placeholder="0"
            className="w-full bg-pearl border border-gold-200/50 rounded-lg px-3 py-2 text-jet text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500"
          />
          <p className="text-jet/50 text-xs mt-1">Número menor = aparece primero en Kits o Individuales.</p>
        </div>
        {/* Kit / Individual category checkboxes */}
        <div className="mobile-landscape:col-span-2 tablet:col-span-2 space-y-3">
          <p className="text-sm font-medium text-jet/80">Categoría (para el sitio web)</p>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isKit"
              defaultChecked={!!(product as { isKit?: boolean }).isKit}
              className="w-5 h-5 rounded border-gold-200/50 text-aqua-700 focus:ring-aqua-500"
            />
            <span className="text-sm font-medium text-jet/80">Kit</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isIndividual"
              defaultChecked={!!(product as { isIndividual?: boolean }).isIndividual}
              className="w-5 h-5 rounded border-gold-200/50 text-aqua-700 focus:ring-aqua-500"
            />
            <span className="text-sm font-medium text-jet/80">Individual</span>
          </label>
          <p className="text-jet/50 text-xs">
            Marque Kit y/o Individual para separar categorías en el catálogo público.
          </p>
        </div>
        
        {/* Image upload field */}
        <div className="mobile-landscape:col-span-2 tablet:col-span-2">
          <label className="block text-sm font-medium text-jet/80 mb-1.5">
            Imagen del Producto
          </label>
          
          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-lg border border-gold-200/50"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-danger text-white w-6 h-6 rounded-full text-sm flex items-center justify-center hover:bg-danger/80"
                aria-label="Eliminar imagen"
              >
                ×
              </button>
              {isUploading && (
                <div className="absolute inset-0 bg-jet/50 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">Subiendo...</span>
                </div>
              )}
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gold-200 rounded-lg cursor-pointer hover:border-aqua-500 transition-colors bg-pearl">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-8 h-8 mb-2 text-jet/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm text-jet/60">
                  <span className="text-aqua-700 font-medium">Subir imagen</span> o arrastrar
                </p>
                <p className="text-xs text-jet/40 mt-1">PNG, JPG, WebP (máx. 5MB)</p>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Buttons - responsive for all devices */}
        <div className="mobile-landscape:col-span-2 tablet:col-span-2 flex flex-col-reverse landscape:flex-row tablet:flex-row gap-3 landscape:justify-end tablet:justify-end mt-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-jet/5 hover:bg-jet/10 border border-jet/20 text-jet w-full landscape:w-auto tablet:w-auto px-4 py-3 tablet:py-2 rounded-lg text-sm min-h-[44px] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="btn-primary w-full landscape:w-auto tablet:w-auto px-4 py-3 tablet:py-2 rounded-lg text-sm font-semibold disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Searchable select component with filtering and scrolling.
 * Allows typing to filter options or scrolling through the list.
 */
function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  disabled = false,
  emptyMessage = "No hay opciones",
  required = false,
  error = false,
  onFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
  required?: boolean;
  error?: boolean;
  onFocus?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const term = searchTerm.toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(term));
  }, [options, searchTerm]);

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

  // Reset search when value changes externally (e.g., parent resets)
  useEffect(() => {
    if (!value) {
      setSearchTerm("");
    }
  }, [value]);

  /**
   * Handles option selection. Trims value so parent state and validation treat it as filled.
   */
  function handleSelect(option: string) {
    const trimmed = option.trim();
    onChange(trimmed);
    setIsOpen(false);
    setSearchTerm("");
  }

  /**
   * Handles input focus - opens dropdown and calls onFocus callback.
   */
  function handleFocus() {
    if (!disabled) {
      setIsOpen(true);
      onFocus?.();
    }
  }

  /**
   * Handles input change for filtering.
   */
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  }

  /**
   * Handles clearing the selection.
   */
  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
    inputRef.current?.focus();
  }

  const hasValue = Boolean(value?.trim());
  const displayValue = isOpen ? searchTerm : value;
  const borderClass = disabled
    ? "border-gold-200/50 opacity-50 cursor-not-allowed"
    : error
    ? "border-danger"
    : hasValue && required
    ? "border-success/50"
    : "border-gold-200/50";

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`w-full bg-pearl border rounded-lg flex items-center ${borderClass} ${
          isOpen ? "ring-2 ring-aqua-500" : ""
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-3 py-2 text-jet text-sm focus:outline-none disabled:cursor-not-allowed"
        />
        {hasValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="px-2 text-jet/40 hover:text-jet/60"
            tabIndex={-1}
          >
            ×
          </button>
        )}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="px-2 text-jet/40"
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

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-porcelain border border-gold-200/50 rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-3 text-jet/50 text-sm text-center">
                {options.length === 0 ? emptyMessage : "No se encontraron resultados"}
              </p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full px-3 py-2.5 text-left text-sm transition-colors border-b border-gold-200/20 last:border-b-0 ${
                    option === value
                      ? "bg-aqua-50 text-aqua-700 font-medium"
                      : "text-jet hover:bg-pearl"
                  }`}
                >
                  {option}
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
 * Form field helper component.
 * Mobile-optimized with 44px min-height for touch targets.
 * Supports defaultValue for edit forms.
 * Light theme variant.
 */
function FormField({
  label,
  name,
  type = "text",
  required = false,
  defaultValue = "",
  className = "",
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-jet/80 mb-1.5"
      >
        {label}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="w-full bg-pearl border border-gold-200/50 rounded-lg px-3 py-2.5 md:py-2 text-jet text-base md:text-sm placeholder-jet/40 focus:outline-none focus:ring-2 focus:ring-aqua-500 min-h-[44px]"
      />
    </div>
  );
}

/**
 * Editable row for edit-invoice form (id optional for new lines).
 */
interface EditInvoiceRow {
  id?: string;
  productId: string;
  productName: string;
  productLine: string;
  quantity: number;
  unitPrice: number;
  total: number;
  abono: number;
  pendiente: number;
}

/**
 * Modal to edit an existing invoice: add/remove products, change quantity/price per line.
 */
function EditInvoiceModal({
  invoice,
  products,
  onClose,
  onSaved,
}: {
  invoice: { batchId: string; items: Array<{ id: string; productId: string; quantity: number; total: number; abono?: number | null; pendiente?: number | null; product?: { name?: string; line?: string } }> };
  products: Product[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [rows, setRows] = useState<EditInvoiceRow[]>(
    invoice.items.map((i) => {
      const abono = i.abono ?? 0;
      const total = i.total;
      const pendiente = Math.max(0, total - abono);
      return {
        id: i.id,
        productId: i.productId,
        productName: i.product?.name ?? "Producto",
        productLine: i.product?.line ?? "",
        quantity: i.quantity,
        unitPrice: i.quantity ? Math.round(total / i.quantity) : 0,
        total,
        abono: Math.min(abono, total),
        pendiente,
      };
    })
  );
  const [dropdownOpen, setDropdownOpen] = useState<"kits" | "individuals" | null>(null);
  const [searchTermKits, setSearchTermKits] = useState("");
  const [searchTermIndividuals, setSearchTermIndividuals] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownKitsRef = useRef<HTMLDivElement>(null);
  const dropdownIndividualsRef = useRef<HTMLDivElement>(null);

  const subtotal = rows.reduce((sum, r) => sum + r.total, 0);
  const productsWithCatalog = products as ProductWithCatalog[];
  const kitsAndLineas = productsWithCatalog.filter((p) => p.isKit === true);
  const individuals = productsWithCatalog.filter(
    (p) => p.isIndividual === true || (!p.isKit && !p.isIndividual)
  );
  const filterBySearch = (list: ProductWithCatalog[], term: string) =>
    term.trim()
      ? list.filter(
          (p) =>
            p.name.toLowerCase().includes(term.toLowerCase()) ||
            p.line.toLowerCase().includes(term.toLowerCase())
        )
      : list;
  const filteredKits = filterBySearch(kitsAndLineas, searchTermKits);
  const filteredIndividuals = filterBySearch(individuals, searchTermIndividuals);
  const kitsOptions = buildProductOptions(filteredKits);
  const individualsOptions = buildProductOptions(filteredIndividuals);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        dropdownKitsRef.current?.contains(target) ||
        dropdownIndividualsRef.current?.contains(target)
      )
        return;
      setDropdownOpen(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /** Adds a product. When unitPrice is provided (e.g. special offer), uses that; else product.price. */
  function addProduct(productId: string, unitPrice?: number) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const price = unitPrice ?? product.price;

    const existing = rows.find((r) => r.productId === productId && r.unitPrice === price);
    if (existing) {
      setRows(
        rows.map((r) => {
          if (r.productId !== productId || r.unitPrice !== price) return r;
          const newQty = r.quantity + 1;
          const total = newQty * r.unitPrice;
          const abono = Math.min(r.abono, total);
          return { ...r, quantity: newQty, total, abono, pendiente: Math.max(0, total - abono) };
        })
      );
    } else {
      setRows([
        ...rows,
        {
          productId: product.id,
          productName: product.name,
          productLine: product.line,
          quantity: 1,
          unitPrice: price,
          total: price,
          abono: 0,
          pendiente: price, // total - abono
        },
      ]);
    }
    setDropdownOpen(null);
    setSearchTermKits("");
    setSearchTermIndividuals("");
  }

  function removeRow(index: number) {
    setRows(rows.filter((_, i) => i !== index));
  }

  /** Moves a product line up (earlier in the invoice order). */
  function moveRowUp(index: number) {
    if (index <= 0) return;
    const next = [...rows];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setRows(next);
  }

  /** Moves a product line down (later in the invoice order). */
  function moveRowDown(index: number) {
    if (index >= rows.length - 1) return;
    const next = [...rows];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setRows(next);
  }

  function updateQuantity(index: number, quantity: number) {
    if (quantity < 1) return;
    setRows(
      rows.map((r, i) => {
        if (i !== index) return r;
        const total = quantity * r.unitPrice;
        const abono = Math.min(r.abono, total);
        return { ...r, quantity, total, abono, pendiente: Math.max(0, total - abono) };
      })
    );
  }

  function updateUnitPrice(index: number, unitPrice: number) {
    const value = Math.max(0, unitPrice);
    setRows(
      rows.map((r, i) => {
        if (i !== index) return r;
        const total = r.quantity * value;
        const abono = Math.min(r.abono, total);
        return { ...r, unitPrice: value, total, abono, pendiente: Math.max(0, total - abono) };
      })
    );
  }

  /** Updates abono; pendiente is auto-calculated as total - abono. */
  function updateAbono(index: number, abono: number) {
    setRows(
      rows.map((r, i) => {
        if (i !== index) return r;
        const capped = Math.min(r.total, Math.max(0, abono));
        return { ...r, abono: capped, pendiente: Math.max(0, r.total - capped) };
      })
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rows.length === 0) {
      setError("Debe haber al menos un producto.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/sales/${invoice.batchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: rows.map((r) => ({
            ...(r.id ? { id: r.id } : {}),
            productId: r.productId,
            quantity: r.quantity,
            total: r.quantity * r.unitPrice,
            abono: r.abono || undefined,
            pendiente: r.pendiente || undefined,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al actualizar factura");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-jet/50" onClick={onClose}>
      <div
        className="bg-porcelain rounded-xl border border-gold-200/50 shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gold-200/50 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-jet">Editar factura</h3>
          <button type="button" onClick={onClose} className="text-jet/60 hover:text-jet p-1">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-4 overflow-y-auto flex-1">
            {error && (
              <div className="mb-4 bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div className="space-y-3 mb-4">
              <label className="block text-sm font-medium text-jet/80">Agregar producto</label>
              <div className="space-y-2">
                <div ref={dropdownKitsRef} className="relative">
                  <label className="block text-xs text-jet/60 mb-1">Kits y Líneas</label>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((o) => (o === "kits" ? null : "kits"))}
                    className="w-full bg-pearl border border-gold-200/50 rounded-lg px-3 py-2 text-left text-jet text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500 min-h-[40px] flex items-center justify-between"
                  >
                    <span className="text-jet/60">-- Agregar kit o línea --</span>
                    <svg
                      className={`w-4 h-4 text-jet/40 transition-transform ${dropdownOpen === "kits" ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {dropdownOpen === "kits" && (
                    <ProductDropdownPanel
                      searchTerm={searchTermKits}
                      onSearchChange={setSearchTermKits}
                      options={kitsOptions}
                      existingItems={rows}
                      onSelect={(id, price) => addProduct(id, price)}
                      UNLIMITED_STOCK={UNLIMITED_STOCK}
                    />
                  )}
                </div>
                <div ref={dropdownIndividualsRef} className="relative">
                  <label className="block text-xs text-jet/60 mb-1">Productos Individuales</label>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((o) => (o === "individuals" ? null : "individuals"))}
                    className="w-full bg-pearl border border-gold-200/50 rounded-lg px-3 py-2 text-left text-jet text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500 min-h-[40px] flex items-center justify-between"
                  >
                    <span className="text-jet/60">-- Agregar producto individual --</span>
                    <svg
                      className={`w-4 h-4 text-jet/40 transition-transform ${dropdownOpen === "individuals" ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {dropdownOpen === "individuals" && (
                    <ProductDropdownPanel
                      searchTerm={searchTermIndividuals}
                      onSearchChange={setSearchTermIndividuals}
                      options={individualsOptions}
                      existingItems={rows}
                      onSelect={(id, price) => addProduct(id, price)}
                      UNLIMITED_STOCK={UNLIMITED_STOCK}
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {rows.map((row, index) => (
                  <div key={row.id ?? `new-${row.productId}-${index}`} className="bg-pearl rounded-lg p-3">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div>
                        <p className="text-jet font-medium text-sm">{row.productName}</p>
                        <p className="text-aqua-700 text-xs">{row.productLine}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveRowUp(index)}
                          disabled={index === 0}
                          title="Subir orden"
                          className="w-8 h-8 rounded bg-pearl border border-gold-200/50 text-jet flex items-center justify-center text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gold-200/30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveRowDown(index)}
                          disabled={index === rows.length - 1}
                          title="Bajar orden"
                          className="w-8 h-8 rounded bg-pearl border border-gold-200/50 text-jet flex items-center justify-center text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gold-200/30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          title="Quitar producto"
                          className="w-8 h-8 rounded bg-danger/10 text-danger flex items-center justify-center text-lg hover:bg-danger/20"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs text-jet/60 mb-0.5">Cant.</label>
                        <input
                          type="number"
                          min={1}
                          value={row.quantity}
                          onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                          className="w-full bg-white border border-gold-200/50 rounded px-2 py-1.5 text-jet text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-jet/60 mb-0.5">Precio unit. (RD$)</label>
                        <input
                          type="number"
                          min={0}
                          value={row.unitPrice}
                          onChange={(e) => updateUnitPrice(index, parseInt(e.target.value) || 0)}
                          className="w-full bg-white border border-gold-200/50 rounded px-2 py-1.5 text-jet text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-jet/60 mb-0.5">Abono</label>
                        <input
                          type="number"
                          min={0}
                          value={row.abono || ""}
                          onChange={(e) => updateAbono(index, parseInt(e.target.value) || 0)}
                          className="w-full bg-white border border-gold-200/50 rounded px-2 py-1.5 text-jet text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-jet/60 mb-0.5">Pendiente</label>
                        <input
                          type="number"
                          value={row.pendiente ?? ""}
                          readOnly
                          className="w-full bg-pearl/70 border border-gold-200/50 rounded px-2 py-1.5 text-jet text-sm cursor-default"
                          title="Calculado: Total − Abono"
                        />
                      </div>
                    </div>
                    <p className="text-jet font-semibold text-sm mt-2">Total línea: RD$ {row.total.toLocaleString()}</p>
                  </div>
              ))}
            </div>
            <p className="mt-4 text-jet font-semibold">Subtotal: RD$ {subtotal.toLocaleString()}</p>
          </div>
          <div className="p-4 border-t border-gold-200/50 flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-jet bg-jet/10 hover:bg-jet/20">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rows.length === 0}
              className="px-4 py-2 rounded-lg bg-aqua-700 text-white font-medium disabled:opacity-50"
            >
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Product type with optional catalog fields for sale form. */
type ProductWithCatalog = Product & { specialOfferPrice?: number | null; sequence?: number; isKit?: boolean; isIndividual?: boolean };

/**
 * Reusable product dropdown panel for sale form and edit-invoice modal.
 * Renders search input and scrollable list of product options.
 */
function ProductDropdownPanel({
  searchTerm,
  onSearchChange,
  options,
  existingItems,
  onSelect,
  UNLIMITED_STOCK,
}: {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  options: Array<{ product: ProductWithCatalog; price: number; isOffer: boolean }>;
  existingItems: Array<{ productId: string; unitPrice: number }>;
  onSelect: (productId: string, price: number) => void;
  UNLIMITED_STOCK: number;
}) {
  return (
    <div className="absolute z-50 w-full mt-1 bg-porcelain border border-gold-200/50 rounded-lg shadow-lg overflow-hidden">
      <div className="p-2 border-b border-gold-200/30">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar producto..."
          className="w-full bg-pearl border border-gold-200/50 rounded-lg px-3 py-2 text-jet text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500"
          autoFocus
        />
      </div>
      <div className="max-h-60 overflow-y-auto">
        {options.length === 0 ? (
          <p className="px-3 py-4 text-jet/50 text-sm text-center">No se encontraron productos</p>
        ) : (
          options.map(({ product: p, price, isOffer }) => {
            const alreadyAdded = existingItems.some((i) => i.productId === p.id && i.unitPrice === price);
            const outOfStock = p.stock === 0;
            return (
              <button
                key={`${p.id}-${isOffer ? "offer" : "normal"}`}
                type="button"
                disabled={outOfStock}
                onClick={() => onSelect(p.id, price)}
                className={`w-full px-3 py-3 text-left transition-colors border-b border-gold-200/20 last:border-b-0 ${
                  outOfStock ? "opacity-40 cursor-not-allowed bg-pearl/50" : alreadyAdded ? "bg-aqua-50/50 hover:bg-aqua-50" : "hover:bg-pearl"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-jet font-medium text-sm truncate">{p.name}</p>
                    <p className="text-aqua-700 text-xs">{p.line}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-semibold text-sm ${isOffer ? "text-gold-500" : "text-jet"}`}>
                      {isOffer ? "Oferta RD$" : "RD$"} {price.toLocaleString()}
                    </p>
                    <p className={`text-xs ${outOfStock ? "text-danger" : "text-jet/50"}`}>
                      {outOfStock ? "Agotado" : p.stock === UNLIMITED_STOCK ? "Siempre disponible" : `Stock: ${p.stock}`}
                    </p>
                  </div>
                  {alreadyAdded && !outOfStock && (
                    <span className="text-aqua-500 text-xs font-medium ml-1">✓</span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * Builds sorted product options for dropdowns. Ofertas (products with specialOfferPrice) first,
 * then by sequence, then by name.
 * @param products - Filtered products to build options from.
 * @returns Array of { product, price, isOffer } sorted for display.
 */
function buildProductOptions(
  products: ProductWithCatalog[]
): Array<{ product: ProductWithCatalog; price: number; isOffer: boolean }> {
  const hasOffer = (p: ProductWithCatalog) =>
    p.specialOfferPrice != null && p.specialOfferPrice > 0;
  const seq = (p: ProductWithCatalog) => p.sequence ?? 0;
  const sortedProducts = [...products].filter(hasOffer).sort(
    (a, b) =>
      seq(a) - seq(b) || a.name.localeCompare(b.name) || a.line.localeCompare(b.line)
  );
  const options: Array<{ product: ProductWithCatalog; price: number; isOffer: boolean }> = [];
  for (const p of sortedProducts) {
    if (hasOffer(p)) options.push({ product: p, price: p.specialOfferPrice!, isOffer: true });
  }
  return options;
}

/**
 * Sale form component for creating new sales.
 * Allows selecting products, quantities, and all customer/sale info.
 * When defaultSupervisor is provided (e.g. logged-in supervisor), pre-selects it.
 */
function SaleForm({
  products,
  onClose,
  onComplete,
  defaultSupervisor,
}: {
  products: Product[];
  onClose: () => void;
  onComplete: (sale: CompletedSale) => void;
  defaultSupervisor?: string | null;
}) {
  // Product selection state
  const [items, setItems] = useState<SaleItem[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState<"kits" | "individuals" | null>(null);
  const [searchTermKits, setSearchTermKits] = useState("");
  const [searchTermIndividuals, setSearchTermIndividuals] = useState("");
  const dropdownKitsRef = useRef<HTMLDivElement>(null);
  const dropdownIndividualsRef = useRef<HTMLDivElement>(null);

  // Customer info state (required)
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [cedula, setCedula] = useState("");
  const [provincia, setProvincia] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [lugarTrabajo, setLugarTrabajo] = useState("");

  // Computed location options based on selections
  const provinciasOptions = useMemo(() => getProvincias(), []);

  /**
   * Handles provincia change and resets dependent fields.
   */
  function handleProvinciaChange(value: string) {
    setProvincia(value);
    setMunicipio("");
  }

  const [fechaEntrega, setFechaEntrega] = useState("");
  const [fechaVisita, setFechaVisita] = useState("");
  const [supervisor, setSupervisor] = useState(defaultSupervisor ?? "");
  const [supervisorOptions, setSupervisorOptions] = useState<string[]>([]);
  const [sellerOptions, setSellerOptions] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/supervisors")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: string[]) => {
        const opts =
          defaultSupervisor && !list.includes(defaultSupervisor)
            ? [...list, defaultSupervisor].sort((a, b) => a.localeCompare(b, "es"))
            : list;
        setSupervisorOptions(opts);
      })
      .catch(() => {});
  }, [defaultSupervisor]);

  useEffect(() => {
    fetch("/api/sellers")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Array<{ id: string; name: string }>) =>
        setSellerOptions(data.map((s) => s.name))
      )
      .catch(() => {});
  }, []);
  const [nombreVendedor, setNombreVendedor] = useState("");

  // Optional fields
  const [customerAddress, setCustomerAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isPaid, setIsPaid] = useState(false);

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Set<string>>(new Set());

  const productsWithCatalog = products as ProductWithCatalog[];
  const kitsAndLineas = productsWithCatalog.filter((p) => p.isKit === true);
  const individuals = productsWithCatalog.filter(
    (p) => p.isIndividual === true || (!p.isKit && !p.isIndividual)
  );
  const filterBySearch = (list: ProductWithCatalog[], term: string) =>
    term.trim()
      ? list.filter(
          (p) =>
            p.name.toLowerCase().includes(term.toLowerCase()) ||
            p.line.toLowerCase().includes(term.toLowerCase())
        )
      : list;
  const filteredKits = filterBySearch(kitsAndLineas, searchTermKits);
  const filteredIndividuals = filterBySearch(individuals, searchTermIndividuals);
  const kitsOptions = buildProductOptions(filteredKits);
  const individualsOptions = buildProductOptions(filteredIndividuals);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        dropdownKitsRef.current?.contains(target) ||
        dropdownIndividualsRef.current?.contains(target)
      )
        return;
      setDropdownOpen(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const totalAbono = items.reduce((sum, item) => sum + (item.abono || 0), 0);
  const totalPendiente = items.reduce((sum, item) => sum + (item.pendiente || 0), 0);

  /**
   * Adds a product to the sale. When unitPrice is provided (e.g. special offer), uses that price;
   * otherwise uses product.price. Same product with different prices creates separate line items.
   */
  function handleAddProduct(productId: string, unitPrice?: number) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const price = unitPrice ?? product.price;

    const existing = items.find((i) => i.productId === productId && i.unitPrice === price);
    if (existing) {
      if (product.stock === UNLIMITED_STOCK || existing.quantity < product.stock) {
        setItems(
          items.map((i) => {
            if (i.productId !== productId || i.unitPrice !== price) return i;
            const newQty = i.quantity + 1;
            const newTotal = newQty * i.unitPrice;
            const abono = Math.min(i.abono ?? 0, newTotal);
            return { ...i, quantity: newQty, total: newTotal, abono, pendiente: Math.max(0, newTotal - abono) };
          })
        );
      }
    } else {
      setItems([
        ...items,
        {
          productId: product.id,
          productName: product.name,
          productLine: product.line,
          quantity: 1,
          unitPrice: price,
          total: price,
          abono: 0,
          pendiente: price, // total - abono
        },
      ]);
    }
  }

  /**
   * Updates quantity for an item.
   */
  function handleUpdateQuantity(productId: string, quantity: number) {
    const product = products.find((p) => p.id === productId);
    if (!product || quantity < 1) return;
    if (product.stock !== UNLIMITED_STOCK && quantity > product.stock) return;

    setItems(
      items.map((i) => {
        if (i.productId !== productId) return i;
        const total = quantity * i.unitPrice;
        const abono = Math.min(i.abono ?? 0, total);
        return { ...i, quantity, total, abono, pendiente: Math.max(0, total - abono) };
      })
    );
  }

  /**
   * Updates abono (partial payment) for an item.
   * Pendiente is auto-calculated as total - abono.
   */
  function handleUpdateAbono(productId: string, abono: number) {
    setItems(
      items.map((i) => {
        if (i.productId !== productId) return i;
        const capped = Math.min(i.total, Math.max(0, abono));
        return { ...i, abono: capped, pendiente: Math.max(0, i.total - capped) };
      })
    );
  }

  /**
   * Updates unit price for an item; recalculates total and pendiente (total - abono).
   */
  function handleUpdateUnitPrice(productId: string, unitPrice: number) {
    const value = Math.max(0, unitPrice);
    setItems(
      items.map((i) => {
        if (i.productId !== productId) return i;
        const total = i.quantity * value;
        const abono = Math.min(i.abono ?? 0, total);
        return { ...i, unitPrice: value, total, abono, pendiente: Math.max(0, total - abono) };
      })
    );
  }

  /**
   * Removes an item from the sale.
   */
  function handleRemoveItem(productId: string, unitPrice: number) {
    setItems(items.filter((i) => !(i.productId === productId && i.unitPrice === unitPrice)));
  }

  /**
   * Validates all required fields and returns invalid field names.
   * @returns Object with error message and set of invalid field names.
   */
  function validateForm(): { error: string | null; invalidFields: Set<string> } {
    const invalid = new Set<string>();
    
    if (items.length === 0) invalid.add("items");
    if (!customerName.trim()) invalid.add("customerName");
    if (!customerPhone.trim()) invalid.add("customerPhone");
    if (!cedula.trim()) invalid.add("cedula");
    if (!provincia.trim()) invalid.add("provincia");
    if (!municipio.trim()) invalid.add("municipio");
    if (!lugarTrabajo.trim()) invalid.add("lugarTrabajo");
    if (!fechaEntrega) invalid.add("fechaEntrega");
    if (!fechaVisita) invalid.add("fechaVisita");
    if (!supervisor.trim()) invalid.add("supervisor");
    if (!nombreVendedor.trim()) invalid.add("nombreVendedor");

    if (invalid.size === 0) {
      return { error: null, invalidFields: invalid };
    }

    // Return first error message for display
    if (invalid.has("items")) return { error: "Agrega al menos un producto", invalidFields: invalid };
    if (invalid.has("customerName")) return { error: "El nombre del cliente es requerido", invalidFields: invalid };
    if (invalid.has("customerPhone")) return { error: "El teléfono es requerido", invalidFields: invalid };
    if (invalid.has("cedula")) return { error: "La cédula es requerida", invalidFields: invalid };
    if (invalid.has("provincia")) return { error: "La provincia es requerida", invalidFields: invalid };
    if (invalid.has("municipio")) return { error: "El municipio es requerido", invalidFields: invalid };
    if (invalid.has("lugarTrabajo")) return { error: "El lugar de trabajo es requerido", invalidFields: invalid };
    if (invalid.has("fechaEntrega")) return { error: "La fecha de entrega es requerida", invalidFields: invalid };
    if (invalid.has("fechaVisita")) return { error: "La fecha de visita es requerida", invalidFields: invalid };
    if (invalid.has("supervisor")) return { error: "El supervisor es requerido", invalidFields: invalid };
    if (invalid.has("nombreVendedor")) return { error: "El nombre del vendedor es requerido", invalidFields: invalid };

    return { error: "Por favor completa los campos requeridos", invalidFields: invalid };
  }

  /**
   * Clears a field error when user interacts with it.
   */
  function clearFieldError(fieldName: string) {
    if (fieldErrors.has(fieldName)) {
      setFieldErrors((prev) => {
        const next = new Set(prev);
        next.delete(fieldName);
        return next;
      });
    }
  }

  /**
   * Clears required-dropdown errors when the field has a non-empty (trimmed) value.
   * Ensures "required" does not persist after the user has selected an option.
   */
  useEffect(() => {
    setFieldErrors((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set(prev);
      if (provincia.trim() && next.has("provincia")) next.delete("provincia");
      if (municipio.trim() && next.has("municipio")) next.delete("municipio");
      if (supervisor.trim() && next.has("supervisor")) next.delete("supervisor");
      return next.size === prev.size ? prev : next;
    });
  }, [provincia, municipio, supervisor]);

  /**
   * Submits the sale to the API.
   */
  async function handleSubmit() {
    const { error: validationError, invalidFields } = validateForm();
    if (validationError) {
      setError(validationError);
      setFieldErrors(invalidFields);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFieldErrors(new Set());

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            total: i.total,
            abono: i.abono || undefined,
            pendiente: i.pendiente || undefined,
          })),
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          cedula: cedula.trim(),
          provincia: provincia.trim(),
          municipio: municipio.trim(),
          customerAddress: customerAddress.trim() || undefined,
          lugarTrabajo: lugarTrabajo.trim(),
          notes: notes.trim() || undefined,
          fechaEntrega,
          fechaVisita,
          supervisor,
          nombreVendedor: nombreVendedor.trim(),
          isPaid,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al procesar la venta");
      }

      const data = await res.json();

      onComplete({
        id: data.id,
        items,
        subtotal,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        cedula: cedula.trim(),
        provincia: provincia.trim(),
        municipio: municipio.trim(),
        customerAddress: customerAddress.trim() || undefined,
        lugarTrabajo: lugarTrabajo.trim(),
        notes: notes.trim() || undefined,
        fechaEntrega,
        fechaVisita,
        supervisor,
        nombreVendedor: nombreVendedor.trim(),
        isPaid,
        date: formatDateTime(new Date()),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Helper to determine border class based on field validity and error state.
   * @param fieldName - The field name for error checking.
   * @param value - The current field value.
   * @param required - Whether the field is required.
   */
  function getBorderClass(fieldName: string, value: string, required = true): string {
    if (fieldErrors.has(fieldName)) return "border-danger";
    if (!required) return "border-gold-200/50";
    return value.trim() ? "border-success/50" : "border-gold-200/50";
  }

  return (
    <div className="bg-porcelain rounded-xl border border-gold-200/50 shadow-sm p-4 tablet:p-5 tablet-lg:p-6 overflow-hidden">
      <h3 className="text-lg font-semibold text-jet mb-4">Nueva Venta</h3>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* Responsive grid: 1 col mobile, 2 cols tablet portrait, 3 cols tablet landscape/desktop */}
      <div className="grid gap-4 tablet:gap-5 tablet-lg:gap-6 mobile-landscape:grid-cols-2 tablet-portrait:grid-cols-2 tablet-landscape:grid-cols-3">
        {/* Column 1: Product selection */}
        <div className="min-w-0 space-y-3">
          <label className="block text-sm font-medium text-jet/80 mb-2">
            Seleccionar Producto
          </label>

          {/* Kits y Líneas dropdown */}
          <div ref={dropdownKitsRef} className="relative">
            <label className="block text-xs text-jet/60 mb-1">Kits y Líneas</label>
            <button
              type="button"
              onClick={() => {
                setDropdownOpen((o) => (o === "kits" ? null : "kits"));
                clearFieldError("items");
              }}
              className={`w-full bg-pearl border rounded-lg px-3 py-2.5 text-left text-jet text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500 min-h-[44px] flex items-center justify-between transition-colors hover:bg-pearl/80 ${fieldErrors.has("items") ? "border-danger" : items.length > 0 ? "border-success/50" : "border-gold-200/50"}`}
            >
              <span className="text-jet/60">-- Agregar kit o línea --</span>
              <svg
                className={`w-5 h-5 text-jet/40 transition-transform ${dropdownOpen === "kits" ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {dropdownOpen === "kits" && (
              <ProductDropdownPanel
                searchTerm={searchTermKits}
                onSearchChange={setSearchTermKits}
                options={kitsOptions}
                existingItems={items}
                onSelect={(id, price) => {
                  handleAddProduct(id, price);
                  setDropdownOpen(null);
                  setSearchTermKits("");
                }}
                UNLIMITED_STOCK={UNLIMITED_STOCK}
              />
            )}
          </div>

          {/* Productos Individuales dropdown */}
          <div ref={dropdownIndividualsRef} className="relative">
            <label className="block text-xs text-jet/60 mb-1">Productos Individuales</label>
            <button
              type="button"
              onClick={() => {
                setDropdownOpen((o) => (o === "individuals" ? null : "individuals"));
                clearFieldError("items");
              }}
              className={`w-full bg-pearl border rounded-lg px-3 py-2.5 text-left text-jet text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500 min-h-[44px] flex items-center justify-between transition-colors hover:bg-pearl/80 ${fieldErrors.has("items") ? "border-danger" : items.length > 0 ? "border-success/50" : "border-gold-200/50"}`}
            >
              <span className="text-jet/60">-- Agregar producto individual --</span>
              <svg
                className={`w-5 h-5 text-jet/40 transition-transform ${dropdownOpen === "individuals" ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {dropdownOpen === "individuals" && (
              <ProductDropdownPanel
                searchTerm={searchTermIndividuals}
                onSearchChange={setSearchTermIndividuals}
                options={individualsOptions}
                existingItems={items}
                onSelect={(id, price) => {
                  handleAddProduct(id, price);
                  setDropdownOpen(null);
                  setSearchTermIndividuals("");
                }}
                UNLIMITED_STOCK={UNLIMITED_STOCK}
              />
            )}
          </div>

          {/* Selected items with Abono/Pendiente */}
          <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-jet/50 text-sm text-center py-4">
                No hay productos seleccionados
              </p>
            ) : (
              items.map((item, idx) => {
                const product = products.find((p) => p.id === item.productId);
                return (
                  <div key={`${item.productId}-${item.unitPrice}-${idx}`} className="bg-pearl rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-jet font-medium text-sm truncate">{item.productName}</p>
                        <p className="text-aqua-700 text-xs">{item.productLine}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.productId, item.unitPrice)}
                        className="w-8 h-8 rounded bg-danger/10 text-danger flex-shrink-0 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                    
                    {/* Quantity, unit price, total */}
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-8 h-8 rounded bg-jet/10 text-jet disabled:opacity-30 flex items-center justify-center text-lg font-medium"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-jet font-medium text-sm">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                          disabled={product?.stock !== UNLIMITED_STOCK && item.quantity >= (product?.stock ?? 0)}
                          className="w-8 h-8 rounded bg-aqua-500 text-jet disabled:opacity-30 flex items-center justify-center text-lg font-medium"
                        >
                          +
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs text-jet/60 mb-0.5">Precio unit. (RD$)</label>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateUnitPrice(item.productId, parseInt(e.target.value) || 0)}
                          className="w-20 bg-white border border-gold-200/50 rounded px-2 py-1.5 text-jet text-sm focus:outline-none focus:ring-1 focus:ring-aqua-500"
                          min="0"
                        />
                      </div>
                      <p className="text-jet font-semibold text-sm self-end pb-1">
                        Total: RD$ {item.total.toLocaleString()}
                      </p>
                    </div>

                    {/* Abono and Pendiente inputs */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-jet/60 mb-1">Abono ($)</label>
                        <input
                          type="number"
                          value={item.abono || ""}
                          onChange={(e) => handleUpdateAbono(item.productId, parseInt(e.target.value) || 0)}
                          className="w-full bg-white border border-gold-200/50 rounded px-2 py-1.5 text-jet text-sm focus:outline-none focus:ring-1 focus:ring-aqua-500"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-jet/60 mb-1">Pendiente ($)</label>
                        <input
                          type="number"
                          value={item.pendiente ?? ""}
                          readOnly
                          className="w-full bg-pearl/70 border border-gold-200/50 rounded px-2 py-1.5 text-jet text-sm cursor-default"
                          placeholder="0"
                          title="Calculado: Total − Abono"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Customer info (required fields) */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-jet/60 uppercase tracking-wider">Datos del Cliente</p>
          
          <div>
            <label className="block text-sm font-medium text-jet/80 mb-1">
              Nombre <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              onFocus={() => clearFieldError("customerName")}
              className={`w-full bg-pearl border rounded-lg px-3 py-2 text-jet text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500 ${getBorderClass("customerName", customerName)}`}
              placeholder="Nombre completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-jet/80 mb-1">
              Teléfono <span className="text-danger">*</span>
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              onFocus={() => clearFieldError("customerPhone")}
              className={`w-full bg-pearl border rounded-lg px-3 py-2 text-jet text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500 ${getBorderClass("customerPhone", customerPhone)}`}
              placeholder="809-000-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-jet/80 mb-1">
              Cédula <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              onFocus={() => clearFieldError("cedula")}
              className={`w-full bg-pearl border rounded-lg px-3 py-2 text-jet text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500 ${getBorderClass("cedula", cedula)}`}
              placeholder="001-0000000-0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-jet/80 mb-1">
              Provincia <span className="text-danger">*</span>
            </label>
            <SearchableSelect
              value={provincia}
              onChange={(v) => { handleProvinciaChange(v); clearFieldError("provincia"); }}
              options={provinciasOptions}
              placeholder="Buscar provincia..."
              required
              error={fieldErrors.has("provincia")}
              onFocus={() => clearFieldError("provincia")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-jet/80 mb-1">
              Municipio <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={municipio}
              onChange={(e) => { setMunicipio(e.target.value); clearFieldError("municipio"); }}
              onFocus={() => clearFieldError("municipio")}
              disabled={!provincia}
              className={`w-full bg-pearl border rounded-lg px-3 py-2 text-jet text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500 disabled:opacity-50 disabled:cursor-not-allowed ${getBorderClass("municipio", municipio)}`}
              placeholder="Escriba el municipio"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-jet/80 mb-1">
              Dirección
            </label>
            <input
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="w-full bg-pearl border border-gold-200/50 rounded-lg px-3 py-2 text-jet text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500"
              placeholder="Calle, sector..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-jet/80 mb-1">
              Lugar de Trabajo <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={lugarTrabajo}
              onChange={(e) => setLugarTrabajo(e.target.value)}
              onFocus={() => clearFieldError("lugarTrabajo")}
              className={`w-full bg-pearl border rounded-lg px-3 py-2 text-jet text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500 ${getBorderClass("lugarTrabajo", lugarTrabajo)}`}
              placeholder="Lugar de trabajo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-jet/80 mb-1">
              Referencia/Nota
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-pearl border border-gold-200/50 rounded-lg px-3 py-2 text-jet text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500 resize-none"
              placeholder="Notas adicionales..."
            />
          </div>
        </div>

        {/* Column 3: Sale info & summary - spans 2 cols on tablet portrait */}
        <div className="space-y-3 mobile-landscape:col-span-2 tablet-portrait:col-span-2 tablet-landscape:col-span-1">
          <p className="text-xs font-semibold text-jet/60 uppercase tracking-wider">Datos de la Venta</p>

          <div>
            <label className="block text-sm font-medium text-jet/80 mb-1">
              Fecha de Entrega <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              value={fechaEntrega}
              onChange={(e) => setFechaEntrega(e.target.value)}
              onFocus={() => clearFieldError("fechaEntrega")}
              className={`w-full bg-pearl border rounded-lg px-3 py-2 text-jet text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500 ${fieldErrors.has("fechaEntrega") ? "border-danger" : fechaEntrega ? "border-success/50" : "border-gold-200/50"}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-jet/80 mb-1">
              Fecha de Visita <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              value={fechaVisita}
              onChange={(e) => setFechaVisita(e.target.value)}
              onFocus={() => clearFieldError("fechaVisita")}
              className={`w-full bg-pearl border rounded-lg px-3 py-2 text-jet text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500 ${fieldErrors.has("fechaVisita") ? "border-danger" : fechaVisita ? "border-success/50" : "border-gold-200/50"}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-jet/80 mb-1">
              Supervisor <span className="text-danger">*</span>
            </label>
            <SearchableSelect
              value={supervisor}
              onChange={(v) => { setSupervisor(v); clearFieldError("supervisor"); }}
              options={supervisorOptions}
              placeholder="Seleccionar supervisor..."
              required
              error={fieldErrors.has("supervisor")}
              onFocus={() => clearFieldError("supervisor")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-jet/80 mb-1">
              Nombre del Vendedor <span className="text-danger">*</span>
            </label>
            <SearchableSelect
              value={nombreVendedor}
              onChange={(v) => { setNombreVendedor(v); clearFieldError("nombreVendedor"); }}
              options={sellerOptions}
              placeholder="Seleccionar vendedor..."
              required
              error={fieldErrors.has("nombreVendedor")}
              onFocus={() => clearFieldError("nombreVendedor")}
            />
          </div>

          <div className="flex items-center gap-3 py-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="w-5 h-5 rounded border-gold-200/50 text-success focus:ring-success"
              />
              <span className="text-sm font-medium text-jet/80">
                {isPaid ? "✓ Pagado" : "No Pagado"}
              </span>
            </label>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-aqua-700 to-aqua-500 rounded-lg p-4 text-white">
            <p className="text-white/80 text-sm">Total</p>
            <p className="text-2xl font-bold">RD$ {subtotal.toLocaleString()}</p>
            <p className="text-white/70 text-xs mt-1">
              {items.reduce((sum, i) => sum + i.quantity, 0)} productos
            </p>
            {totalAbono > 0 && (
              <p className="text-white/80 text-xs mt-2">
                Abono Total: RD$ {totalAbono.toLocaleString()}
              </p>
            )}
            {totalPendiente > 0 && (
              <p className="text-white/80 text-xs">
                Pendiente Total: RD$ {totalPendiente.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Buttons - responsive for all devices */}
      <div className="flex flex-col-reverse landscape:flex-row tablet:flex-row gap-3 landscape:justify-end tablet:justify-end mt-6">
        <button
          type="button"
          onClick={onClose}
          className="bg-jet/5 hover:bg-jet/10 border border-jet/20 text-jet w-full landscape:w-auto tablet:w-auto px-4 py-3 tablet:py-2 rounded-lg text-sm min-h-[44px] transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-success hover:bg-success/90 text-white w-full landscape:w-auto tablet:w-auto px-6 py-3 tablet:py-2 rounded-lg text-sm font-semibold disabled:opacity-50 min-h-[44px] transition-colors"
        >
          {isSubmitting ? "Procesando..." : "Completar Venta"}
        </button>
      </div>
    </div>
  );
}

/**
 * Invoice component for displaying and printing completed sales.
 */
function Invoice({
  sale,
  onClose,
}: {
  sale: CompletedSale;
  onClose: () => void;
}) {
  /**
   * Prints the invoice.
   */
  function handlePrint() {
    window.print();
  }

  return (
    <div className="bg-porcelain rounded-xl border border-gold-200/50 shadow-sm overflow-hidden">
      {/* Print-only styles are in globals.css */}
      <div id="invoice-content" className="p-4 tablet:p-5 tablet-lg:p-6 print-p-8">
        {/* Company Header with Logo - responsive for all orientations */}
        <div className="flex flex-col landscape:flex-row landscape:items-start landscape:justify-between tablet:flex-row tablet:items-start tablet:justify-between gap-4 mb-6 print-mb-8 pb-4 border-b border-gold-200/50">
          <div className="flex items-center gap-3 tablet:gap-4">
            {/* Company Logo */}
            <img
              src={brandConfig.logoPath}
              alt={brandConfig.brandName}
              className="h-12 tablet:h-16 w-auto print-h-20"
            />
            <div>
              <h2 className="text-xl tablet:text-2xl font-bold text-jet">{brandConfig.brandName}</h2>
              <p className="text-jet/60 text-sm no-print">Cuidado Capilar Premium</p>
            </div>
          </div>
          <div className="text-left landscape:text-right tablet:text-right text-sm">
            <p className="text-jet font-semibold">FACTURA</p>
            <p className="text-aqua-700 font-mono">#{sale.id.slice(-8).toUpperCase()}</p>
            <p className="text-jet/60 mt-1">{sale.date}</p>
          </div>
        </div>

        {/* Company & Customer Info Row - side by side on landscape/tablet */}
        <div className="grid mobile-landscape:grid-cols-2 tablet:grid-cols-2 gap-4 mb-6">
          {/* Company Details */}
          <div className="p-4 bg-pearl rounded-lg print-border print-border-jet-20">
            <p className="text-jet/60 text-xs uppercase tracking-wider mb-2">Datos de la Empresa</p>
            <p className="text-jet font-medium">{brandConfig.brandName}</p>
            {brandConfig.addressStreet && <p className="text-jet/70 text-sm">{brandConfig.addressStreet}</p>}
            {brandConfig.addressCity && <p className="text-jet/70 text-sm">{brandConfig.addressCity}</p>}
            {brandConfig.addressCountry && <p className="text-jet/70 text-sm">{brandConfig.addressCountry}</p>}
            {brandConfig.whatsappNumber && <p className="text-jet/70 text-sm mt-2">📞 {brandConfig.whatsappNumber.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}</p>}
            {brandConfig.contactEmail && <p className="text-jet/70 text-sm">📧 {brandConfig.contactEmail}</p>}
          </div>

          {/* Customer Details */}
          <div className="p-4 bg-pearl rounded-lg print-border print-border-jet-20">
            <p className="text-jet/60 text-xs uppercase tracking-wider mb-2">Datos del Cliente</p>
            {sale.customerName ? (
              <>
                <p className="text-jet font-medium">{sale.customerName}</p>
                {sale.customerPhone && (
                  <p className="text-jet/70 text-sm">📞 {sale.customerPhone}</p>
                )}
                {sale.cedula && (
                  <p className="text-jet/70 text-sm">🪪 Cédula: {sale.cedula}</p>
                )}
                {sale.provincia && sale.municipio && (
                  <p className="text-jet/70 text-sm">📍 {sale.municipio}, {sale.provincia}</p>
                )}
                {sale.customerAddress && (
                  <p className="text-jet/70 text-sm">🏠 {sale.customerAddress}</p>
                )}
                {sale.lugarTrabajo && (
                  <p className="text-jet/70 text-sm">💼 Trabajo: {sale.lugarTrabajo}</p>
                )}
              </>
            ) : (
              <p className="text-jet/50 text-sm italic">Cliente no especificado</p>
            )}
          </div>
        </div>

        {/* Items table */}
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b border-gold-200/50">
              <th className="text-left text-jet/60 text-xs uppercase py-2">Producto</th>
              <th className="text-center text-jet/60 text-xs uppercase py-2">Cant.</th>
              <th className="text-right text-jet/60 text-xs uppercase py-2">Precio</th>
              <th className="text-right text-jet/60 text-xs uppercase py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, index) => (
              <tr key={index} className="border-b border-gold-200/30">
                <td className="py-3">
                  <p className="text-jet font-medium">{item.productName}</p>
                  <p className="text-aqua-700 text-xs">{item.productLine}</p>
                </td>
                <td className="py-3 text-center text-jet">{item.quantity}</td>
                <td className="py-3 text-right text-jet/70">
                  RD$ {item.unitPrice.toLocaleString()}
                </td>
                <td className="py-3 text-right text-jet font-medium">
                  RD$ {item.total.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="py-4 text-right text-jet font-semibold text-lg">
                Total:
              </td>
              <td className="py-4 text-right text-jet font-bold text-xl">
                RD$ {sale.subtotal.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Notes */}
        {sale.notes && (
          <div className="mb-6 p-4 bg-pearl rounded-lg no-print">
            <p className="text-jet/60 text-xs uppercase tracking-wider mb-1">Notas</p>
            <p className="text-jet text-sm">{sale.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center border-t border-gold-200/50 pt-4 print-pt-6">
          <p className="text-jet font-medium">¡Gracias por su compra!</p>
          <p className="text-jet/60 text-sm mt-2">
            {brandConfig.brandName} — {brandConfig.tagline}
          </p>
          <p className="text-jet/50 text-xs mt-1">
            {[brandConfig.addressStreet, brandConfig.addressCity].filter(Boolean).join(", ")}{brandConfig.whatsappNumber && ` • WhatsApp: ${brandConfig.whatsappNumber.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}`}
          </p>
          <p className="text-jet/40 text-xs mt-2">
            {brandConfig.instagramUrl && `Síguenos en Instagram: ${brandConfig.instagramHandle || brandConfig.instagramUrl}`}
          </p>
        </div>
      </div>

      {/* Action buttons - hidden when printing, responsive for all devices */}
      <div className="flex flex-col-reverse landscape:flex-row tablet:flex-row gap-3 p-4 border-t border-gold-200/50 no-print landscape:justify-end tablet:justify-end">
        <button
          onClick={onClose}
          className="bg-jet/5 hover:bg-jet/10 border border-jet/20 text-jet w-full landscape:w-auto tablet:w-auto px-4 py-3 tablet:py-2 rounded-lg text-sm min-h-[44px] transition-colors"
        >
          Cerrar
        </button>
        <button
          onClick={handlePrint}
          className="bg-aqua-700 hover:bg-aqua-700/90 text-white w-full landscape:w-auto tablet:w-auto px-6 py-3 tablet:py-2 rounded-lg text-sm font-semibold min-h-[44px] transition-colors"
        >
          🖨️ Imprimir Factura
        </button>
      </div>
    </div>
  );
}
