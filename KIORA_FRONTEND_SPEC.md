# Kiora Frontend — Specification Document v2.0

> **Project:** Kiora POS & Inventory Management System
> **Type:** Full-stack web application (Astro + React + TypeScript)
> **Status:** Production — continuous improvement

---

## Table of Contents
1. [Design System](#1-design-system)
2. [Authentication & Security](#2-authentication--security)
3. [POS Terminal (Punto de Venta)](#3-pos-terminal-punto-de-venta)
4. [Dashboard](#4-dashboard)
5. [Product Management](#5-product-management)
6. [Inventory Management](#6-inventory-management)
7. [Order Management](#7-order-management)
8. [User & Role Management](#8-user--role-management)
9. [Reports & Analytics](#9-reports--analytics)
10. [Customer Kiosk (Autoservicio)](#10-customer-kiosk-autoservicio)
11. [Notifications & Alerts](#11-notifications--alerts)
12. [Settings & Configuration](#12-settings--configuration)
13. [Mobile & PWA](#13-mobile--pwa)
14. [AI Features](#14-ai-features)
15. [Technical Architecture](#15-technical-architecture)

---

## 1. Design System

### 1.1 Brand Identity
- **Name:** Kiora
- **Tagline:** "Tu tienda inteligente"
- **Tone:** Professional, warm, reliable
- **Target audience:** Small-to-medium retail businesses in Latin America

### 1.2 Visual Language
- **Primary color:** `#3D1A10` (deep brown — warm, premium feel)
- **Secondary color:** `#C41E1E` (alert red — urgency, notifications)
- **Accent color:** `#008B8B` (teal — success, confirmation, data highlights)
- **Background:** `#F5F0EB` (warm off-white — reduces eye strain in retail environments)
- **Surface:** `#FFFFFF` (cards, modals, drawers)
- **Text primary:** `#1A1A1A` (near-black, high contrast)
- **Text secondary:** `#6B6B6B` (medium gray, less important info)
- **Border radius:** `1rem` (cards), `0.5rem` (buttons, inputs)
- **Shadows:** Warm-toned shadows (`rgba(61, 26, 16, 0.08)`) instead of cool gray
- **Typography:** Geist (Sans) — variable font, all weights available

### 1.3 Component Library
- **Framework:** shadcn/ui (Radix primitives + Tailwind v4)
- **Custom components:** StripeQRModal, OrderDrawer, ProductGrid, POSKeypad, SaleTimeline
- **Icons:** Lucide React (consistent, scalable, tree-shakeable)
- **Charts:** Recharts (responsive, composable)

### 1.4 Responsive Breakpoints
| Breakpoint | Width | Target |
|---|---|---|
| Mobile | < 640px | POS operators with phones |
| Tablet | 640-1024px | Kiosk screens, small tablets |
| Desktop | 1024-1536px | Main admin panel |
| Wide | > 1536px | Large monitors, dashboards |

### 1.5 Accessibility
- WCAG 2.1 AA minimum contrast ratios
- Focus indicators on all interactive elements
- Screen reader labels on icon-only buttons
- Keyboard navigation (Tab, Enter, Escape, Arrow keys in POS)
- `prefers-reduced-motion` support

---

## 2. Authentication & Security

### 2.1 Login Screen (`/login`)
- **Visual:** Full-screen gradient (warm brown to cream), centered card
- **Branding:** Kiora logo + tagline at top
- **Fields:**
  - Email input (with validation: email format, max length)
  - Password input (with show/hide toggle)
  - "Remember this device" checkbox
- **Actions:**
  - "Iniciar Sesión" button (full-width, loading state)
  - "¿Olvidaste tu contraseña?" link → recovery flow
- **States:**
  - Loading: Skeleton pulse on button, disabled form
  - Error: Inline error messages (red, below each field)
  - Rate-limited: "Demasiados intentos. Intenta en 15 minutos." with countdown timer
  - Locked: "Cuenta bloqueada. Contacta al administrador." with contact button
- **Security features:**
  - Rate limiting: 10 attempts per 15 min per IP
  - Brute force lockout: 5 failed attempts → 15 min block
  - Session versioning: `session_version` in JWT, incremented on password change
  - HTTP-only refresh token cookie (7 day expiry)
  - Access token in memory/localStorage (15 min expiry)
  - Auto-refresh: silent token renewal 10s before expiry

### 2.2 Password Recovery (`/recuperar-contrasena`)
- **Step 1 — Email:** Enter email → "Si el correo está registrado, recibirás un código" (always same message, prevents enumeration)
- **Step 2 — Code:** 6-digit OTP input (auto-advance between digits, paste support)
- **Step 3 — New Password:** Password + confirmation, with strength meter
- **Security:** Code expires in 15 min, single-use, rate-limited (5 attempts per 15 min)

### 2.3 Session Management
- **Idle timeout:** 15 min → warning at 14 min, auto-logout at 15 min
- **Tab visibility:** Pause inactivity timer when tab hidden
- **Concurrent sessions:** Allowed (multi-device), each with own refresh token
- **Logout:** Revokes access + refresh tokens (Redis blacklist)
- **Force logout on password change:** Increments session_version, invalidates all other sessions

---

## 3. POS Terminal (Punto de Venta)

### 3.1 Layout
```
┌─────────────────────────────────────────────────────────────┐
│  🔍 [Búsqueda de productos...]         🗂️ [Categorías ▼]   │
├──────────────────────────────────┬──────────────────────────┤
│                                  │    Orden Actual #---     │
│  ┌────┐ ┌────┐ ┌────┐           │  ┌────────────────────┐  │
│  │Coca │ │Agua │ │Papas│  ...    │  │ Coca-Cola 350ml    │  │
│  │$2.5 │ │$1.5 │ │$1.8 │        │  │ [−] 2 [+]  $5.0   │  │
│  │Stock│ │Stock│ │Stock│        │  ├────────────────────┤  │
│  │: 44 │ │: 25 │ │: 22 │        │  │ Agua Cristal 500ml │  │
│  └────┘ └────┘ └────┘           │  │ [−] 1 [+]  $1.5   │  │
│                                  │  ├────────────────────┤  │
│  ┌────┐ ┌────┐ ┌────┐           │  │ Total: $6.5        │  │
│  │JET  │ │Oreo │ │ ... │        │  │                    │  │
│  │$2.0 │ │$2.2 │ │     │        │  │ [💵 Efectivo]      │  │
│  │Stock│ │Stock│ │     │        │  │ [💳 Tarjeta]       │  │
│  └────┘ └────┘ └────┘           │  │ [🔄 Cancelar]      │  │
│                                  │  └────────────────────┘  │
│  Página 1 de 3  ← 1 2 3 →       │                          │
└──────────────────────────────────┴──────────────────────────┘
```

### 3.2 Product Grid (Left Panel)
- **Product cards:** Square/compact with image, name, price, stock badge
  - Image loads from Cloudinary (`getImageUrl`)
  - Name truncated to 2 lines
  - Price prominent (Colombian peso format: `$2.500`)
  - Stock badge: green (>50%), yellow (25-50%), orange (10-25%), red (<10%)
- **Search:** Fuse.js fuzzy search (matches name, code, category)
  - 200ms debounce
  - Recent searches shown when input focused
  - "No results" state with suggestion to adjust search
- **Category filter:** Horizontal pill buttons (all, bebidas, snacks, confitería...)
  - Active pill: filled primary, others: outlined
  - Count badge showing products in each category
- **Pagination:** "Cargar más" (infinite scroll) or numbered pages
- **Empty state:** "No hay productos disponibles" with illustration

### 3.3 Order Drawer (Right Panel)
- **Header:** Order #, status badge, time elapsed
- **Item list:** Scrollable, each item showing:
  - Product name + variations (size if applicable)
  - Quantity controls (`−` / number / `+`) with haptic feedback
  - Unit price and line total
  - Delete button (swipe to delete on mobile, long-press on desktop)
  - Low stock warning icon if item is near its stock limit
- **Empty state:** "Agrega productos usando el botón + o buscando arriba" with illustration
- **Summary:** Subtotal, discounts (if any), total (bold, large)
- **Payment methods:** Large buttons with icons
  - `💵 Efectivo` → Opens cash payment modal (amount received, change calculation)
  - `💳 Tarjeta` → Stripe QR modal (for card reader) or direct link
  - `📱 Digital` → Nequi/Daviplata/Bancolombia (Colombian payment apps)
- **Validation:**
  - Cannot create order without items
  - Stock check before order creation (real-time validation)
  - Zero-stock products shown as disabled with "Agotado" overlay

### 3.4 Quick Actions
- **Numpad:** Quick quantity entry (`x3` = 3 units)
- **Price override:** Long-press product → edit unit price (requires admin PIN)
- **Discount:** Percentage or fixed amount (requires admin PIN)
- **Hold order:** Save current order, clear cart, restore later (saved in localStorage)
- **Last order repeat:** "Repetir última venta" button
- **Customer display:** Toggle to show prices on a secondary screen/customer-facing display

### 3.5 Cash Payment Flow
1. Select "Efectivo"
2. Enter amount received (numpad opens)
3. System calculates change
4. Confirm → Order created as `completada`
5. Receipt automatically downloaded (PDF) or printed (Bluetooth thermal printer)
6. Return to empty POS ready for next customer

### 3.6 Card Payment Flow (Stripe QR)
1. Select "Tarjeta"
2. Order created as `pendiente`
3. Stripe Checkout session generated
4. **Stripe QR Modal:**
   - Large QR code (configurable size 200-300px)
   - Amount display (large, prominent)
   - Customer scans QR with phone camera
   - Polling every 3s to check payment status
   - **States:**
     - `pending` — QR displayed, "Esperando pago..." pulsing indicator
     - `paid` — Success animation (checkmark), auto-close modal, download receipt
     - `failed` — Error message, retry button, switch to cash option
     - `cancelled` — Order cancelled, return to POS
   - **Actions:**
     - "Ir a la pasarela" (opens Stripe in new tab for desktop)
     - "Reintentar" (generates new session for same order)
     - "Cambiar a efectivo" (cancels card order, creates new cash order)
     - "Cancelar pago" (cancels the pending order)

### 3.7 Digital Payment (Colombia-specific)
- Nequi, Daviplata, Bancolombia, Addi options
- Generates payment link or QR
- Manual confirmation by cashier once customer shows payment confirmation

### 3.8 Receipt / Invoice
- **Print:** Bluetooth thermal printer (ESC/POS protocol)
  - Configurable paper size (58mm/80mm)
  - Store header: name, address, NIT, phone
  - Itemized list, totals, payment method
  - QR for electronic invoice (Factus/DIAN)
  - Footer: "¡Gracias por tu compra!"
- **PDF:** Downloadable receipt (jsPDF + autotable)
- **Email:** Send receipt to customer email (if provided)
- **Electronic invoice:** Auto-emit to DIAN via Factus, return CUFE string

---

## 4. Dashboard

### 4.1 Main Dashboard (`/panel?tab=dashboard`)
- **KPI Cards (top row):**
  - Total sales today (COP, formatted)
  - Orders today (count, compare to yesterday)
  - Average ticket (COP)
  - Active customers (unique today)
  - Stock alerts (count of products below minimum)
- **Charts:**
  - Sales trend (24h, 7d, 30d) — area chart with gradient
  - Top products (bar chart, top 10 by revenue)
  - Sales by payment method (donut chart)
  - Hourly heatmap (hour × day of week, sales volume)
- **Recent orders:** Mini table (last 10), status-colored badges
- **Low stock alerts:** Horizontal scrolling list of critical products
- **Quick actions:** "Nueva venta", "Ver reportes", "Revisar inventario"
- **Real-time updates:** WebSocket connection, dashboard auto-refreshes on new sales

### 4.2 Real-time Sales Feed
- Sidebar or bottom sheet showing new orders as they come in
- Toast notification for each new sale
- Sound effect (configurable, on/off)

---

## 5. Product Management

### 5.1 Product List (`/panel?tab=productos`)
- **Data table** with:
  - Image thumbnail (click to enlarge)
  - Name (link to edit)
  - Category tags (Bebidas, Snacks...)
  - Price (COP format)
  - Stock (color-coded by health)
  - Status (active/inactive toggle)
- **Filters:** Category, stock status (normal/low/critical/out), search
- **Sort:** Name, price, stock, date added
- **Bulk actions:** Select multiple → delete, change category, adjust stock
- **Export:** CSV download of filtered products
- **Pagination:** 20 per page, showing "X de Y productos"

### 5.2 Product Form (Create/Edit)
- **Image:** Drag & drop upload, preview, crop (Cloudinary or local storage)
- **Fields:**
  - Name (required, max 200 chars)
  - Description (textarea, optional, max 1000 chars)
  - Price (required, COP format, positive number)
  - Category (multi-select checkboxes, at least one)
  - Stock (number input, non-negative)
  - Min stock (number input, non-negative, alert threshold)
  - Expiry date (date picker, optional)
- **Validation:**
  - Real-time field validation on blur
  - Server-side validation on submit (409 for duplicates)
- **Draft / Save & Continue:** Option to save draft and add another

### 5.3 Stock Adjustment
- Quick inline edit on product list (click stock cell → numeric input)
- Reason/movement type: "entrada", "salida", "ajuste"
- Audit log linked to inventory movements

---

## 6. Inventory Management

### 6.1 Inventory View (`/panel?tab=inventario`)
- **Tabs:**
  - Movements (historico)
  - Low stock (productos críticos)
  - Stock by supplier
- **Movements table:**
  - Date/time, product, type (entrada/salida/ajuste), quantity
  - Reference (order #, supplier, movement reason)
  - User who performed the action
- **Low stock section:**
  - Red highlight for products below minimum
  - Yellow for products within 20% of minimum
  - Suggested order quantity (auto-calculated: min * 3 - current)
  - "Ordenar a proveedor" button (generates purchase order)

### 6.2 Supplier Management
- **Supplier list:** Name, NIT, contact, phone, email
- **Supplier detail:** Products supplied, prices, stock by product
- **Purchase orders:** Create, send, track delivery status

### 6.3 Stock Adjustments
- Form: product + type + quantity + reason
- Requires admin PIN confirmation for negative adjustments
- Auto-syncs to products-service via circuit breaker

---

## 7. Order Management

### 7.1 Orders List (`/panel?tab=ventas`)
- **Data table:**
  - Order #, date/time, customer name, total, payment method
  - Status badge (colored, with transition animation)
  - Actions: view detail, download receipt, cancel/refund
- **Filters:** Date range (presets: today, yesterday, this week, this month, custom)
  - Status (all, pendiente, completada, cancelada, reembolsada)
  - Payment method (efectivo, tarjeta, digital)
- **Status colors:**
  - `pendiente`: amber (awaiting payment)
  - `pagado`/`pagada`: green (paid, awaiting completion)
  - `completada`: teal (done ✅)
  - `cancelada`: red (cancelled)
  - `reembolsada`: purple (refunded)
- **Export:** Daily sales report (Excel/PDF) with aggregated totals

### 7.2 Order Detail
- **Info card:** Order #, date, status timeline
- **Items:** List with product, quantity, unit price, subtotal
- **Summary:** Subtotal, discounts, tax (19% IVA), total
- **Payment info:** Method, transaction ID (Stripe), status
- **Actions (contextual to state):**
  - `pendiente` → Cancel, Mark as paid (if cash collected outside system)
  - `pagado` → Complete (trigger outbox events), Refund
  - `completada` → Refund, Download receipt, Emit electronic invoice
  - `cancelada` / `reembolsada` → Read-only

### 7.3 Refund Flow
1. Select order (must be `completada` or `pagado`)
2. Confirm refund reason (modal)
3. System:
   - If Stripe payment: process refund via Stripe API
   - Return stock to inventory (outbox: `inventory.movement` entrada)
   - Emit credit note (Factus/DIAN)
4. Show confirmation with refund ID

---

## 8. User & Role Management

### 8.1 Users List (`/panel?tab=usuarios`)
- **Table:** Name, email, role (admin/cliente), login attempts, status (locked/unlocked)
- **Filters:** Role, status
- **Actions:** Edit, change role, block/unblock, delete (soft delete)
- **Admin guard:** Users cannot delete themselves, cannot change own role

### 8.2 User Form
- Name, email, password, role (admin/cliente), phone
- Password strength meter (min 6 chars, must meet requirements)
- Optional: assign to specific store/branch

### 8.3 Role Management
- **Roles:** admin (full access), cliente (sales only, limited dashboard)
- Future: custom roles with granular permissions per module

---

## 9. Reports & Analytics

### 9.1 Reports Dashboard (`/panel?tab=reportes`)
- **Report types:**
  - Sales report (daily, weekly, monthly, custom range)
  - Product performance (best/worst sellers)
  - Inventory report (current stock, movements)
  - Profit analysis (cost vs. selling price)
  - Tax report (IVA collected, for DIAN filing)
- **Export formats:** PDF (formatted with store header), Excel (raw data)
- **Saved reports:** Recurring reports with email scheduling
- **Charts:**
  - Sales trend (interactive, zoomable)
  - Category breakdown (pie/bar)
  - Payment method distribution

### 9.2 Report Generation (Backend)
- PDF via PDFKit (streamed, handles large datasets)
- Excel via ExcelJS (styling, formulas)
- Reports-service + outbox for long-running reports

---

## 10. Customer Kiosk (Autoservicio)

### 10.1 Kiosk App (`kiora-kiosko`)
- **Standalone app** served at `kiosk.kiora.com` or separate port
- **Kiosk mode:** Full-screen, no browser chrome
- **Touch-optimized:** Large buttons, no hover states
- **Idle reset:** Returns to home screen after 60s of inactivity

### 10.2 Kiosk Screens
- **Home:** Category grid + featured products + "Escanea tu código" option
- **Product browsing:** Category filter, product grid, quick add
- **Cart:** Review items, adjust quantities, see total
- **Checkout:**
  - Payment selection (card via Stripe redirect, digital payment)
  - Stripe redirects back to kiosk with `?payment=success/fail`
- **Order confirmation:** Success animation, order #, receipt option

---

## 11. Notifications & Alerts

### 11.1 In-App Notifications
- **Toast system:** Bottom-right corner, auto-dismiss
- **Types:**
  - `success` (green) — "Venta registrada exitosamente"
  - `error` (red) — "Error al procesar el pago"
  - `warning` (amber) — "Stock bajo: Papas Margarita"
  - `info` (blue) — "Nueva venta: #42 — $12.500"
- **Notification center:** Bell icon in header, dropdown with history
- **Sound:** Optional notification sound for new sales

### 11.2 Push Notifications (Browser)
- Service Worker (PWA) push API
- Subscribe on login prompt
- Low stock alerts even when tab is closed

### 11.3 Email Notifications (Automatic)
- **Password recovery** (OTP code) — always
- **Daily sales summary** (configurable, cron) — via reports-service
- **Low stock alerts** (real-time per movement) — via inventory-service
- **System errors** (5xx, service down) — via monitoring

### 11.4 Telegram Bot Notifications
- **Real-time alerts:** Stock critical, server errors
- **Commands:** /stock, /ventas_hoy, /servicios
- **Daily summary:** Sent automatically by cron

---

## 12. Settings & Configuration

### 12.1 Store Settings
- Store name, address, NIT, phone (appears on receipts/invoices)
- Currency symbol and locale ($, COP, es-CO)
- Tax rate (default: 19% IVA Colombia)
- Receipt footer message

### 12.2 Payment Configuration
- Stripe keys (test/live mode toggle)
- Digital payment accounts (Nequi, Daviplata, Bancolombia)
- Cash denominations for quick change calculation

### 12.3 Printer Configuration
- Bluetooth device pairing
- Paper size (58mm default)
- Logo print toggle

### 12.4 Notification Preferences
- Which alerts go to email vs Telegram vs in-app
- Admin email list (dynamic, pulled from users with admin role)

### 12.5 Backup & Export
- Database backup trigger
- Full data export (JSON/CSV)

---

## 13. Mobile & PWA

### 13.1 PWA Features
- **Manifest:** Full web app manifest (icons, theme color, display: standalone)
- **Service Worker:** Cache-first for static assets (Astro build output)
  - Cache name versioned by build
  - Offline fallback page
- **Install prompt:** Custom "Instalar Kiora" button on supported browsers
- **Background sync:** Queue failed operations when offline

### 13.2 Mobile Adaptations
- Bottom navigation bar instead of sidebar
- Swipe gestures (delete order item, navigate between tabs)
- Pull-to-refresh on data lists
- Floating action button for new sale
- Camera integration for barcode scanning

---

## 14. AI Features

### 14.1 Predictive Inventory (Phase 1)
- Stockout prediction ("Papas se agotará en 3.2 días")
- Auto-adjust stock_minimo based on sales velocity
- Weekly email with predicted shortages

### 14.2 Sales Assistant (Phase 2)
- Natural language query: "¿Cuánto vendí la semana pasada?"
- Voice input on POS: "Agrega 2 Cocas"
- Chatbot for admin help within the panel

### 14.3 Smart Recommendations (Phase 3)
- "Los clientes que compraron esto también compraron..."
- Suggest products based on time/day/weather
- Dynamic pricing suggestions based on demand

---

## 15. Technical Architecture

### 15.1 Tech Stack
- **Framework:** Astro 5 (static generation + islands architecture)
- **UI Library:** React 19 + TypeScript
- **Styling:** Tailwind CSS v4 + tw-animate-css
- **Components:** shadcn/ui (Radix primitives)
- **State Management:** Zustand (global), React hooks (local)
- **Charts:** Recharts
- **HTTP Client:** Custom FetchHttpClient (with auth interceptor)
- **Forms:** React controlled components + Zod validation
- **PWA:** @vite-pwa/astro
- **Testing:** Vitest + Testing Library + Playwright (E2E)
- **Build:** Vite (via Astro)
- **Sentry:** Error tracking and performance monitoring

### 15.2 Project Structure
```
kiora-frontend/
├── src/
│   ├── components/
│   │   ├── auth/          # LoginForm, RecoverPasswordForm, etc.
│   │   ├── panel/         # PanelApp, AdminNavbar, DashboardSection, etc.
│   │   └── help/          # HelpCenter
│   ├── core/
│   │   ├── http/          # HttpClient, interceptors
│   │   └── ui/            # AlertService, toast system
│   ├── features/
│   │   ├── sales/         # POS, StripeQRModal, OrderDrawer
│   │   ├── products/      # Product CRUD, Category CRUD
│   │   ├── inventory/     # Movements, suppliers, low-stock
│   │   └── users/         # User management hooks
│   ├── hooks/             # usePOS, useSalesManager, useProductManager, etc.
│   ├── layouts/           # Main page layouts
│   ├── lib/               # Utilities, pushAppNotification
│   ├── models/            # TypeScript interfaces (Product, Order, User)
│   ├── pages/             # Astro pages (login, panel, ayuda, etc.)
│   ├── services/          # API services (Auth, Order, Product, etc.)
│   ├── store/             # Zustand stores (useSalesStore, useInventoryStore)
│   ├── styles/            # Global CSS, Tailwind setup
│   └── config/            # API config, DI setup (setup.ts)
```

### 15.3 Key Design Patterns
- **Dependency Injection:** All services receive `httpClient` via constructor
- **Singleton services:** Instantiated once in `setup.ts`, imported everywhere
- **Stores for state:** Zustand for shared state (sales cart, inventory cache)
- **Hooks for logic:** Custom React hooks encapsulate business logic (usePOS, useSalesManager)
- **Model-first:** TypeScript interfaces define data contracts (`Product`, `Order`, `User`)

### 15.4 Error Handling
- **HttpClient:** Centralized error parsing, 401/403 → auto-logout + redirect
- **Service methods:** try/catch → return `HttpResponse<T>` with `ok`, `error`, `data`
- **Components:** Error boundaries at section level
- **Global:** `window.onerror` + `window.onunhandledrejection` captured by LogService
- **Sentry:** Error reporting with source maps

### 15.5 Performance Targets
- **First load (LCP):** < 2s (static Astro build, CDN-cached)
- **Time to interactive:** < 1s after load (minimal JS per page)
- **API response:** < 200ms p95 (via backend optimization)
- **POS search:** < 100ms (Fuse.js with 200ms debounce)
- **Build size:** < 200KB JS total (code splitting per route)
- **Chunk size:** < 100KB per chunk (manual chunks via rollup)
