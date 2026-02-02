# Guloyas Tours — Database Semantics

**Purpose:** Align schema with the tours/bookings domain. See [documento_web_design.md](./documento_web_design.md), [guloyas-tours-brand-doc.md](./guloyas-tours-brand-doc.md), and the Tours + WhatsApp Business plan.

---

## Domain mapping (schema ↔ business)

| Schema / table        | Business meaning |
|-----------------------|------------------|
| **Product**           | Tour or excursion. Table name `products` kept for compatibility. |
| `Product.stock`       | Seats / capacity (not “inventory”). |
| `Product.sold`        | Booked count (not “units sold”). |
| `Product.lowSeatsThreshold` | Per-tour “low seats” badge threshold; `null` = use default or hide. |
| **Sale**              | Booking / reservation line. `batchId` groups lines into one invoice. |
| **AdminSettings.lowStockThreshold** | Default low-seats threshold when `Product.lowSeatsThreshold` is null. UI label: “Umbral de plazas bajas (por defecto)”. |
| **Seller**            | Seller/guide name options for the booking form (Ajustes). |
| **User.supervisorName** | Matches `Sale.supervisor` (e.g. tour/sales supervisor). |
| **MonthlySummary**    | Monthly revenue/bookings snapshot. |
| **WhatsAppMessageLog** | WhatsApp send/receive log for dashboard interactions (plan Option B). |

---

## Naming conventions

- **No column renames** for `stock`/`sold`/`lowStockThreshold` — semantics are “seats”, “booked”, “default low-seats” in code and UI only.
- Catalog uses **one list** of active tours (`getActiveProducts()`).
- Import placeholder product name: **“Importación de Reservas”** (excluded from catalog and direct sales).

---

## References

- Plan: Tours + WhatsApp Business (schema section 1; Phase 1–5).
- Invoice data: [CURSOR_TASK_INVOICE_PDF.md](./CURSOR_TASK_INVOICE_PDF.md) — customer = reservation customer; items = line items from sales in batch (tour name as description).
- Company/brand: [client-info.md](./client-info.md), [guloyas-tours-brand-doc.md](./guloyas-tours-brand-doc.md).
