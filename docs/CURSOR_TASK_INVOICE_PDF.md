# Cursor Task — Implement “Guloyas Tours” PDF Invoice Generator (Tech-Agnostic)

## Objective
Add a new feature to the existing system to generate a **clean, print-ready PDF invoice** that matches the structure of the provided Guloyas Tours invoice PDF:
- Letter size (8.5x11)
- Header with logo + company info + invoice number
- Customer/reservation info block
- Date/payment block
- Items table
- Totals block
- Terms list spanning 2 pages (forced page break after term 4)
- Footer notes on page 2

Do NOT change the existing tech stack. Integrate with what we already have.

---

## Inputs / Outputs

### Input
A structured `Invoice` object (JSON or internal DTO) provided by our system.

### Output
A generated PDF file:
- Returned as a byte stream (HTTP response) OR
- Stored in our storage (filesystem/S3/etc.) and referenced by URL
Depending on how our current system handles PDFs.

---

## Implementation Requirements (No Guessing)
Cursor: inspect the existing repo and follow established conventions for:
- Where documents/PDF generators live
- How templates are stored
- How files are streamed/saved
- How currency/date formatting is done
- How branding assets (logo) are accessed
- How API routes/services are organized

If the repo already generates any PDFs, copy that pattern and adapt it.

---

## Invoice Layout Specification (What to replicate)

### Page setup
- Paper: **US Letter (8.5x11)**
- Margins: **0.5 inch** on all sides
- Print background enabled (if renderer supports it)
- Typography should be modern and readable (no default serif)

### Block 1 — Header (top of page 1)
Layout:
- Left: company logo (badge)
- Center: company name + address + phones + email + RNC
- Right: **Factura No. {invoiceNo}**
Under header: centered title **“Factura”**

Content fields:
- Company Name: `company.name`
- Address: `company.address`
- Phones: `company.phones[]`
- Email: `company.email`
- RNC: `company.rnc`
- Invoice #: `invoiceNo`

### Block 2 — Customer / Reservation table (boxed)
A 2-column table:
- Left column = label, with shaded background (light gray-blue)
- Right column = values, right-aligned (as in sample)

Rows:
1. Cliente → `customer.name`
2. Pasaporte → `customer.passport`
3. Teléfono → `customer.phone`
4. Estatus → multi-line:
   - Line 1 (bold): `statusBlock.title`
   - Line 2: `statusBlock.dateRangeText`

### Block 3 — Dates / Payment terms (2-column text list)
Labels on left, values aligned right:
- Fecha de Emisión → `dates.issueDate`
- Fecha Límite de Pago → `dates.paymentDueDate`
- Fecha de Vencimiento → `dates.expirationDate`
- Condiciones de Pago → `paymentTerms`

### Block 4 — Items table
Table columns:
- Cant.
- Descripción (wraps)
- Unidad
- Precio (two lines: “US$ 620.00” and “PP”)
- Importe

Row mapping:
- Cant. → `item.qty`
- Descripción → `item.description`
- Unidad → `item.unit`
- Precio → `currency(item.unitPrice)` + optional `item.priceNote` on next line
- Importe → `currency(item.qty * item.unitPrice)`

### Block 5 — Totals block (right-aligned)
Render as a small table aligned to the right:

Lines:
- SUB-TOTAL → `subTotal`
- ABONO 1 → payment line if exists with label “ABONO 1”
- ABONO 2 → payment line if exists with label “ABONO 2”
- PENDIENTE → `pending`
- TOTAL PAGADO → `totalPaid`

Computed rules:
- `subTotal = Σ(qty * unitPrice)`
- `totalPaid = Σ(payments.amount)`
- `pending = subTotal - totalPaid`

#### IMPORTANT: “TOTAL NETO”
The provided invoice PDF includes “TOTAL NETO” on page 2 that does not match the visible subtotal.
In our implementation:
- Only render “TOTAL NETO” if we can compute it explicitly:
  - `totalNeto = subTotal + Σ(fees) + Σ(taxes)`
- Otherwise omit it (do not invent numbers).

### Block 6 — Terms (legal text)
- Intro sentence on page 1, then numbered list.
- Terms 1–4 appear on page 1.
- Force a page break after term 4.
- Continue terms 5–16 on page 2.

Also include on page 2:
- Seller line: `sellerName` (right aligned or centered, consistent)
- Footer notes:
  - “NO DEVOLVEMOS DINERO... NOTA DE CREDITO.” (or from `footerNotes[]`)

---

## Formatting Rules

### Currency formatting
- Must render as: `US$ 1,240.00`
- Always 2 decimals
- Thousands separators
- Right-aligned in totals and “Importe” column

### Date formatting
- Match Spanish style in the PDF:
  - Example: `2026-01-30` becomes `30/01/2026` OR the format used elsewhere in our system.
Cursor: use the system’s existing date formatting utilities if they exist.

### Typography & spacing
- Use the system’s standard font stack for PDFs (whatever is already used).
- Titles bold and larger.
- Tables have crisp borders (1px) and consistent padding.
- Long text wraps, never overflows page width.

### Pagination
- Terms must not overlap footer.
- Use explicit page break after term 4 (hard break).

---

## Integration Tasks (Do These in Our Codebase)
1. **Locate existing PDF generation module** (search for “pdf”, “invoice”, “render”, “template”, “document”, “report”).
2. Create a new generator named something like:
   - `generateInvoicePdf(invoice: Invoice): PdfResult`
3. Add a template + styles consistent with how our system does it:
   - If we use HTML templates → create `invoice.html` + `invoice.css`
   - If we use a document builder → create the invoice layout in that builder
4. Add a public-facing hook:
   - API route, service method, or command that produces the invoice PDF for a given invoice id.
5. Add a sample invoice fixture/test so we can verify the output.

---

## Acceptance Criteria
- Generated PDF prints cleanly on **Letter** with 0.5" margins.
- Visual structure matches the reference invoice (same block order and table layout).
- Totals math is correct for any payload.
- Long descriptions and names wrap correctly.
- Terms render across 2 pages with a forced break after term 4.
- No “TOTAL NETO” unless computed from explicit fees/taxes.
- Output is stable (no random spacing differences between runs).

---

## What Cursor Should Return
- A PR-ready implementation with:
  - New invoice PDF generator
  - Template/styles (if applicable)
  - Integration endpoint/service method
  - Example payload/fixture
  - Any minimal docs needed for devs to use it
