/**
 * Invoice PDF generator — clean, concise layout per docs/CURSOR_TASK_INVOICE_PDF.md.
 * Uses jsPDF for Letter (8.5×11), 0.5" margins, blocks 1–5, short terms (one page).
 * No TOTAL NETO unless fees/taxes are explicit.
 */

import { jsPDF } from "jspdf";
import { formatDate } from "./formatDate";
import { db } from "./db";
import { brandConfig } from "./brandConfig";

/** Company block for header. */
export interface InvoiceCompany {
  name: string;
  address: string;
  phones: string[];
  email: string;
  rnc: string;
}

/** Customer / reservation block. */
export interface InvoiceCustomer {
  name: string;
  passport: string;
  phone: string;
}

/** Status block (multi-line). */
export interface InvoiceStatusBlock {
  title: string;
  dateRangeText: string;
}

/** Dates and payment terms. */
export interface InvoiceDates {
  issueDate: string;
  paymentDueDate: string;
  expirationDate: string;
}

/** Single line item. */
export interface InvoiceItem {
  qty: number;
  description: string;
  unit: string;
  unitPrice: number;
  priceNote?: string;
}

/** Payment line (e.g. ABONO 1). */
export interface InvoicePaymentLine {
  label: string;
  amount: number;
}

/** Full invoice DTO for PDF generation. */
export interface InvoiceDTO {
  invoiceNo: string;
  company: InvoiceCompany;
  customer: InvoiceCustomer;
  statusBlock: InvoiceStatusBlock;
  dates: InvoiceDates;
  paymentTerms: string;
  items: InvoiceItem[];
  subTotal: number;
  payments: InvoicePaymentLine[];
  pending: number;
  totalPaid: number;
  sellerName?: string;
  footerNotes?: string[];
}

/** Format currency as US$ 1,240.00 */
export function formatCurrency(amount: number): string {
  return `US$ ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** 0.5 inch in points (Letter). */
const MARGIN = 36;
const PAGE_W = 612;
const PAGE_H = 792;
const CONTENT_W = PAGE_W - MARGIN * 2;
const LOGO_SIZE = 48;

/**
 * Loads logo from public folder (server-side). Returns base64 data URL or null.
 * @param logoPath - Path like /logo.png from brandConfig.
 * @returns "data:image/png;base64,..." or null.
 */
function loadLogoBase64(logoPath: string): string | null {
  try {
    const path = require("path");
    const fs = require("fs");
    const base = process.cwd();
    const rel = (logoPath || "").replace(/^\//, "");
    const fullPath = path.join(base, "public", rel);
    if (!fs.existsSync(fullPath)) return null;
    const buf = fs.readFileSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const mime = ext === ".png" ? "image/png" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * Generates a clean, concise PDF invoice from the given DTO.
 * Letter size, 0.5" margins, blocks 1–5, short terms on one page.
 * @param invoice - Structured invoice data.
 * @param logoPath - Optional path to logo (e.g. brandConfig.logoPath) for server-side load.
 * @returns PDF as Uint8Array.
 */
export function generateInvoicePdf(invoice: InvoiceDTO, logoPath?: string): Uint8Array {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
    hotfixes: ["px_scaling"],
  });
  let y = MARGIN;

  // Block 1 — Header: logo left (if available), company center, Factura No. right
  const logoData = logoPath ? loadLogoBase64(logoPath) : null;
  if (logoData) {
    try {
      doc.addImage(logoData, "PNG", MARGIN, y, LOGO_SIZE, LOGO_SIZE);
    } catch {
      // ignore invalid image
    }
  }
  const centerX = MARGIN + CONTENT_W / 2;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.company.name, centerX - doc.getTextWidth(invoice.company.name) / 2, y + (logoData ? 8 : 0));
  y += 14;
  doc.text(invoice.company.address, centerX - doc.getTextWidth(invoice.company.address) / 2, y);
  y += 12;
  if (invoice.company.phones.length) {
    const ph = invoice.company.phones.join(" / ");
    doc.text(ph, centerX - doc.getTextWidth(ph) / 2, y);
    y += 12;
  }
  doc.text(invoice.company.email, centerX - doc.getTextWidth(invoice.company.email) / 2, y);
  y += 12;
  doc.text(`RNC: ${invoice.company.rnc}`, centerX - doc.getTextWidth(`RNC: ${invoice.company.rnc}`) / 2, y);
  y += 14;
  doc.text(`Factura No. ${invoice.invoiceNo}`, PAGE_W - MARGIN - doc.getTextWidth(`Factura No. ${invoice.invoiceNo}`), MARGIN + (logoData ? 24 : 20));
  if (!logoData) y -= 14;
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Factura", centerX - doc.getTextWidth("Factura") / 2, y);
  y += 24;

  // Block 2 — Customer / Reservation (boxed, 2-col)
  const col1W = 80;
  const col2W = CONTENT_W - col1W;
  const rows: [string, string][] = [
    ["Cliente", invoice.customer.name],
    ["Pasaporte", invoice.customer.passport],
    ["Teléfono", invoice.customer.phone],
    ["Estatus", `${invoice.statusBlock.title}\n${invoice.statusBlock.dateRangeText}`],
  ];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const boxH = rows.length * 18 + 8;
  doc.setFillColor(0.9, 0.92, 0.96);
  doc.rect(MARGIN, y, CONTENT_W, boxH, "F");
  doc.rect(MARGIN, y, CONTENT_W, boxH, "S");
  let rowY = y + 14;
  for (const [label, value] of rows) {
    doc.setFont("helvetica", "bold");
    doc.text(label, MARGIN + 6, rowY);
    doc.setFont("helvetica", "normal");
    const vLines = value.split("\n");
    for (const line of vLines) {
      doc.text(line, MARGIN + col1W + col2W - 6 - doc.getTextWidth(line), rowY);
      rowY += 12;
    }
    if (vLines.length === 1) rowY += 6;
  }
  y += boxH + 16;

  // Block 3 — Dates / Payment terms
  const dateRows: [string, string][] = [
    ["Fecha de Emisión", invoice.dates.issueDate],
    ["Fecha Límite de Pago", invoice.dates.paymentDueDate],
    ["Fecha de Vencimiento", invoice.dates.expirationDate],
    ["Condiciones de Pago", invoice.paymentTerms],
  ];
  for (const [label, value] of dateRows) {
    doc.text(label, MARGIN, y);
    doc.text(value, MARGIN + CONTENT_W - doc.getTextWidth(value), y);
    y += 14;
  }
  y += 10;

  // Block 4 — Items table
  const colCant = 28;
  const colDesc = 180;
  const colUnidad = 40;
  const colPrecio = 90;
  const colImporte = 70;
  doc.setFont("helvetica", "bold");
  doc.text("Cant.", MARGIN, y);
  doc.text("Descripción", MARGIN + colCant, y);
  doc.text("Unidad", MARGIN + colCant + colDesc, y);
  doc.text("Precio", MARGIN + colCant + colDesc + colUnidad, y);
  doc.text("Importe", MARGIN + CONTENT_W - colImporte, y);
  y += 14;
  doc.setDrawColor(0.8, 0.8, 0.8);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 10;
  doc.setFont("helvetica", "normal");
  for (const item of invoice.items) {
    const importe = item.qty * item.unitPrice;
    doc.text(String(item.qty), MARGIN, y);
    doc.text(item.description.slice(0, 35) + (item.description.length > 35 ? "…" : ""), MARGIN + colCant, y);
    doc.text(item.unit, MARGIN + colCant + colDesc, y);
    doc.text(formatCurrency(item.unitPrice), MARGIN + colCant + colDesc + colUnidad, y);
    doc.text(formatCurrency(importe), MARGIN + CONTENT_W - colImporte, y);
    y += 16;
  }
  y += 14;

  // Block 5 — Totals (right-aligned)
  const totX = MARGIN + CONTENT_W - 120;
  doc.text("SUB-TOTAL", totX, y);
  doc.text(formatCurrency(invoice.subTotal), MARGIN + CONTENT_W - doc.getTextWidth(formatCurrency(invoice.subTotal)), y);
  y += 14;
  invoice.payments.forEach((p, i) => {
    doc.text(p.label, totX, y);
    doc.text(formatCurrency(p.amount), MARGIN + CONTENT_W - doc.getTextWidth(formatCurrency(p.amount)), y);
    y += 14;
  });
  doc.text("PENDIENTE", totX, y);
  doc.text(formatCurrency(invoice.pending), MARGIN + CONTENT_W - doc.getTextWidth(formatCurrency(invoice.pending)), y);
  y += 14;
  doc.text("TOTAL PAGADO", totX, y);
  doc.text(formatCurrency(invoice.totalPaid), MARGIN + CONTENT_W - doc.getTextWidth(formatCurrency(invoice.totalPaid)), y);
  y += 24;

  // Block 6 — Short terms (clean & concise: 4–6 clauses on one page)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Términos y condiciones", MARGIN, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  const shortTerms = [
    "1. El pago debe realizarse según las condiciones acordadas.",
    "2. Las cancelaciones están sujetas a la política de la empresa.",
    "3. Los precios están en dólares estadounidenses (US$) salvo indicación.",
    "4. Para reclamaciones, contactar con la empresa en un plazo de 30 días.",
  ];
  for (const line of shortTerms) {
    doc.text(line, MARGIN, y);
    y += 14;
  }
  y += 10;
  if (invoice.sellerName) {
    doc.text(invoice.sellerName, MARGIN + CONTENT_W - doc.getTextWidth(invoice.sellerName), y);
    y += 14;
  }
  const footerNote = invoice.footerNotes?.[0] ?? "NO DEVOLVEMOS DINERO. NOTA DE CRÉDITO SEGÚN POLÍTICA.";
  doc.setFontSize(9);
  doc.text(footerNote, MARGIN, y);

  const buf = doc.output("arraybuffer");
  return new Uint8Array(buf);
}

/** Build company from env / brandConfig (Guloyas Tours). */
function getCompany(): InvoiceCompany {
  const street = process.env.NEXT_PUBLIC_ADDRESS_STREET ?? brandConfig.addressStreet;
  const city = process.env.NEXT_PUBLIC_ADDRESS_CITY ?? brandConfig.addressCity;
  const country = process.env.NEXT_PUBLIC_ADDRESS_COUNTRY ?? brandConfig.addressCountry;
  const address = [street, city, country].filter(Boolean).join(", ");
  const phones: string[] = [];
  if (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || brandConfig.whatsappNumber) {
    phones.push((process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? brandConfig.whatsappNumber).replace(/\D/g, "").replace(/^1/, "1-"));
  }
  return {
    name: process.env.NEXT_PUBLIC_BRAND_NAME ?? brandConfig.brandName,
    address,
    phones,
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? brandConfig.contactEmail,
    rnc: process.env.COMPANY_RNC ?? "132-93225-2",
  };
}

/** Sale row with product (from DB). */
export interface SaleWithProduct {
  id: string;
  batchId: string;
  productId: string;
  quantity: number;
  total: number;
  abono: number | null;
  pendiente: number | null;
  customerName: string | null;
  customerPhone: string | null;
  cedula: string | null;
  fechaEntrega: Date | null;
  fechaVisita: Date | null;
  isPaid: boolean;
  nombreVendedor: string | null;
  createdAt: Date;
  product: { name: string } | null;
}

/**
 * Builds an Invoice DTO from a list of sales (e.g. for a batch).
 * Uses first sale for customer; aggregates items and payments.
 * @param sales - Sales with product (same batch).
 * @param batchId - Batch ID for invoice number.
 * @returns Invoice DTO.
 */
export function buildInvoiceFromSales(sales: SaleWithProduct[], batchId: string): InvoiceDTO {
  const first = sales[0];
  const subTotal = sales.reduce((sum, s) => sum + s.total, 0);
  const totalPaid = sales.reduce((sum, s) => sum + (s.abono ?? 0), 0);
  const pending = sales.reduce((sum, s) => sum + (s.pendiente ?? 0), 0);
  const payments: InvoicePaymentLine[] = [];
  if (totalPaid > 0) payments.push({ label: "ABONO 1", amount: totalPaid });
  const issueDate = formatDate(first.createdAt);
  const de = formatDate(first.fechaEntrega);
  const dv = formatDate(first.fechaVisita);
  const dateRangeText = de && dv ? `${de} - ${dv}` : de || dv || "—";
  return {
    invoiceNo: batchId.slice(0, 10),
    company: getCompany(),
    customer: {
      name: first.customerName ?? "",
      passport: first.cedula ?? "",
      phone: first.customerPhone ?? "",
    },
    statusBlock: {
      title: first.isPaid ? "Pagado" : "Pendiente de pago",
      dateRangeText,
    },
    dates: {
      issueDate,
      paymentDueDate: issueDate,
      expirationDate: formatDate(first.fechaVisita),
    },
    paymentTerms: first.isPaid ? "Pagado" : "Pago parcial / Pendiente",
    items: sales.map((s) => ({
      qty: s.quantity,
      description: s.product?.name ?? "",
      unit: "PP",
      unitPrice: s.total / s.quantity,
    })),
    subTotal,
    payments,
    pending,
    totalPaid,
    sellerName: first.nombreVendedor ?? undefined,
    footerNotes: ["NO DEVOLVEMOS DINERO. NOTA DE CRÉDITO SEGÚN POLÍTICA."],
  };
}

/**
 * Builds an Invoice DTO from a sale batch (batchId).
 * Fetches sales with product; delegates to buildInvoiceFromSales.
 * @param batchId - Invoice batch ID.
 * @returns Invoice DTO or null if batch not found.
 */
export async function buildInvoiceFromBatch(batchId: string): Promise<InvoiceDTO | null> {
  const sales = await db.sale.findMany({
    where: { batchId, voidedAt: null },
    include: { product: true },
    orderBy: { createdAt: "asc" },
  });
  if (sales.length === 0) return null;
  return buildInvoiceFromSales(sales as SaleWithProduct[], batchId);
}
