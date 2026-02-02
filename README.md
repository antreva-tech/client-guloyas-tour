# Guloyas Tours

Admin dashboard and public catalog for **Guloyas Tours SRL** — tourism agency (Dominican Republic and international tours). Manage tours, bookings, sellers, invoices, and WhatsApp messaging.

## Client

| Field | Value |
|-------|--------|
| **Legal name** | Guloyas Tours SRL |
| **RNC** | 132-93225-2 |
| **Address** | C/ Casimira Hereaux 4, Enriquillo, San Pedro de Macorís DR 21000 |
| **Email** | guloyastours@gmail.com |
| **Phone** | +1 (829) 718-8926 / +1 (809) 399-4401 |

See [docs/client-info.md](docs/client-info.md) for environment variable mapping and [docs/guloyas-tours-brand-doc.md](docs/guloyas-tours-brand-doc.md) for brand and UI guidelines.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Neon PostgreSQL with Prisma ORM
- **Hosting:** Vercel (serverless)
- **Styling:** Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- Neon PostgreSQL database

### Environment Variables

Copy `.env.example` to `.env` and fill in values. Key variables:

```env
# Brand (Guloyas Tours — see docs/client-info.md for mapping)
NEXT_PUBLIC_BRAND_NAME="Guloyas Tours"
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
NEXT_PUBLIC_CONTACT_EMAIL="guloyastours@gmail.com"
NEXT_PUBLIC_WHATSAPP_NUMBER="18297188926"

# Database (required)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Session (required — generate with: openssl rand -hex 32)
SESSION_SECRET="your-random-secret"

# Admin credentials (required)
ADMIN_PASSWORD_HASH="scrypt::salt::hash"
SUPPORT_PASSWORD_HASH="scrypt::salt::hash"

# Cron jobs (required for Vercel cron)
CRON_SECRET="your-cron-secret"

# Rate limiting (optional — recommended for production)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

### Development

```bash
npm install
npx prisma db push
npm run dev
```

Open http://localhost:3000

## Security Features

### Authentication

- **Password hashing:** scrypt with 16-byte random salt, 64-byte key
- **Session cookies:** HMAC-SHA256 signed, httpOnly, secure, sameSite: strict
- **Session expiry:** 8 hours
- **Timing-safe comparison:** Prevents timing attacks on password/session verification

### SQL Injection Prevention

- All database queries use Prisma ORM with parameterized queries
- No raw SQL (`$queryRaw`, `$executeRaw`) in codebase

### Rate Limiting

- Login attempts: 5 per minute per IP
- Password changes: 5 per minute per IP
- API writes: 30 per minute per IP
- Supports Upstash Redis for serverless (falls back to in-memory)

### Password Policy

Passwords must have:

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Not be a common password (e.g., "password", "admin123")

### Open Redirect Protection

- Login redirect URLs are validated to be same-origin relative paths
- Absolute URLs and protocol-relative URLs are rejected

### Security Headers

Configured in `next.config.ts`:

- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Content-Security-Policy (script-src, frame-ancestors, etc.)

## Rate Limiting Setup (Production)

For reliable rate limiting on Vercel serverless, set up Upstash Redis:

1. Create free Redis database at [console.upstash.com](https://console.upstash.com)
2. Add environment variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

Without these, rate limiting uses in-memory storage (less reliable on serverless).

## Project Structure

```
app/
├── admin/           # Admin dashboard (protected)
│   ├── login/       # Login pages (admin, support)
│   ├── settings/    # Password change, user management
│   └── page.tsx     # Main dashboard
├── api/             # API routes
│   ├── products/    # Tours CRUD (products schema)
│   ├── sales/       # Sales/invoices
│   ├── users/       # User management
│   ├── sellers/     # Seller management
│   ├── whatsapp/    # WhatsApp messaging / webhook
│   └── ...
└── page.tsx         # Public catalog

lib/
├── auth.ts          # Authentication logic
├── apiAuth.ts       # API route auth middleware
├── rateLimit.ts     # Rate limiting (Upstash + fallback)
├── passwordPolicy.ts # Password validation
├── validation.ts    # Zod schemas
├── whatsapp.ts      # WhatsApp integration
└── db.ts            # Prisma client

components/           # React components
prisma/
└── schema.prisma    # Database schema (tours, sales, sellers, etc.)
```

## User Roles

| Role | Access |
|------|--------|
| **admin** | Full access (tours, sales, users, settings) |
| **support** | Admin access + can reset admin password |
| **supervisor** | Sales only (filtered to their invoices) |

## Deployment

Deploy to Vercel:

```bash
vercel
```

Or connect the repository to Vercel for automatic deployments.

## License

Proprietary — Antreva Tech
