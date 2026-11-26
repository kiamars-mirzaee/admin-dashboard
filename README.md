# Kestrel Admin `v1.0.0` — Enterprise Operations Dashboard & React UI System

A full-stack, mobile-first operations console and reusable React component architecture built with **React 19**, **TypeScript**, **Tailwind CSS v4**, **Vite 8**, and **Express**. Engineered around high-density desktop workflows, 44px mobile touch ergonomics, full **LTR / RTL internationalization** (`EN`, `AR`, `FA`, `ES`), client-side PDF/Print document export, RBAC security administration, virtual file storage with scoped modal picking, and schema-driven data tables.

> **New in v1.0.0:** Complete 7-layer admin component system, `JSONViewer` API & Config debugger, Kanban order workflow board, Reports & Activity Heatmap, RBAC Permission Matrix & active session manager, Audit Log, Auth/2FA & 403/404/500 error suite, and `113` passing unit tests.
> See **[How to Use Kestrel Admin (`docs/HOW_TO_USE.md`)](docs/HOW_TO_USE.md)** for full operator workflows and developer integration examples.

![Operations Overview & Composed Time-Series Analytics](docs/screenshots/01-overview-analytics.png)

---

## Key Engineering Highlights

### 1. Backend-Driven `AutoDataGrid` & Order Workflow Suite
- **Self-Describing API Contract (`GET /api/orders`)**: The Express server returns column definitions, filter schemas, row actions (including nested submenus), bulk actions, CRUD validation schemas, paginated rows, and dataset metrics in one payload.
- **Multi-Type Query Filtering**: Supports plain text search, numeric equality, numeric ranges, comma-separated IDs, Gregorian date ranges, date-time cutover ranges, static multi-select, and debounced AJAX multi-select (`GET /api/orders/options/:field`).
- **Column Pinning, Resizing, Density & Bulk Actions**: Toggle visibility, reorder/pin sticky columns, drag column dividers to resize widths, switch between Standard and Compact density, and execute scoped mutations or CSV downloads (`selected`, `current-page`, `current-filter`, `all-rows`).
- **Kanban Status Board & Dedicated Detail/Form Views**: Transition orders across fulfillment/risk stages (`Pending`, `Processing`, `Flagged`, `Completed`, `Refunded`) in `KanbanView`, inspect full records in `OrderDetailPageView`, or create/edit with auto-saved drafts and unsaved-changes guards.

### 2. Multi-Type Time-Series Analytics & Reports Heatmap
- **Six Interactive SVG Chart Modes (`TimeSeriesAnalytics`)**: Switch seamlessly between **Area**, **Line**, **Bar**, **Stacked Bar**, **Composed (Bar + Line Dual Axis)**, and **Donut** breakdowns with hover inspection tooltips.
- **Dimensional Slice & Granularity Controls**: Filter live order datasets by date presets (`All`, `7D`, `30D`, `90D`, or custom range), bucket granularity (`Day`, `Week`, `Month`), metric (`Gross revenue`, `Settled`, `Orders`, `Avg order`), channels, and statuses with prior-period comparison deltas.
- **Operational Reports & Activity Heatmap**: Inspect channel slices, regional throughput heatmaps (`HeatmapChart`), SLA `RadarChart`, and utilization `GaugeChart` inside `ReportsView`.

### 3. Print & Client-Side PDF Export Service
- **Programmatic PDF Generation (`jspdf` + `jspdf-autotable`)**: Exports both `AutoDataGrid` ledgers (landscape A4 with repeating headers and active filter summaries) and individual `OrderDetailDrawer` dispatch records (portrait A4 with embedded QR verification codes via `qrcode`).
- **Unicode & RTL Document Rendering**: Automatically switches to high-DPI HTML5 Canvas rasterization when exporting Arabic/Persian or RTL text so ligatures and bi-directional layout render crisply inside PDFs.
- **Print-Optimized Document Views**: Dedicated print preview modals and `@media print` layouts for physical export.

### 4. File Storage Vault & Scoped Modal Form Picker (`FileStorageView` & `FileStoragePickerModal`)
- **Dual Explorer Modes (`Open folder` & `Tree view`)**: Browse directories hierarchically in a split tree + inline file inspector or navigate folder-by-folder with breadcrumb trails, `Up one level` traversal, search, kind filters, and sorting.
- **Full CRUD, Drag-and-Drop Uploads & Inline File Editor**: Create nested folders and text/markdown/JSON/CSV files, upload files from disk (or drag & drop into folders), rename, delete recursively, download, and edit text/code files directly in the inspector.
- **Scoped Modal File Picker for Forms (`rootFolderId`)**: Mount `FileStoragePickerModal` or `StorageFormField` inside any form to select single/multiple files with an optional predefined root folder (`Partner Contracts`, `Invoices & Settlements`, `Compliance & SOC2`) that locks breadcrumbs, tree hierarchy, search, and upload destinations strictly to that subtree.

### 5. Security, RBAC, Audit Log, Auth & Background Operations
- **Roles & Permission Matrix (`AccessControlView`)**: Manage role presets (`Super Admin`, `Operations Lead`, `Finance Analyst`, `Support Agent`), toggle per-module `View / Create / Edit / Delete` capabilities, guard UI controls via `<Can resource="..." action="...">`, and revoke active device sessions.
- **Audit Log, Settings & Tasks Queue**: Filter workspace security/settlement audit trails, configure general/security/notification/integration preferences, monitor worker progress telemetry (`OperationsTasksView`), and preview Sign-In, Password Reset, 2FA/OTP, and `403 / 404 / 500 / Maintenance / Offline` pages.

### 6. Navigation Shell, Productivity & Hardware Tools
- **Global Fuzzy Command Palette (`⌘K` / `Ctrl+K`)**: Substring and fuzzy character matching across orders, customers, routes, and component sections with highlighted match fragments and keyboard navigation.
- **Quick-Access Favorites Bar**: Pin frequently used views, flagged queues, specific orders, or customer profiles with `localStorage` persistence and automatic pruning when records are deleted.
- **Camera QR Scanner (`jsqr`)**: Live camera stream frame scanning (plus manual order/URI fallback) to jump straight to an order drawer from physical shipping labels or printed invoices.
- **Dynamic Breadcrumbs & Sequential Keyboard Shortcuts**: Multi-key Vim-style chords (`G` then `O/L/F/C/S/K`) and single-key actions (`C`, `N`, `D`, `Q`, `?`) with an interactive help modal.

### 7. Reusable React Component Kit (`40+` Modular UI & Debug Primitives)
- **Debug & Data Display**: Interactive **`JSONViewer`** (syntax highlighting, collapsible nodes, key/value search with Prev/Next navigation, `Matches only` filter, JSONPath copy, raw toggle, parse-error fallback), `VirtualList`, `Timeline`, `CalendarView`, `ImageGallery` Lightbox, `CommentThread`, `DescriptionList`.
- **Forms, Calendars & Pickers**: **Gregorian Date Picker**, **Date-Time Picker**, **Dual-Calendar Date Range Picker**, **Solar Hijri / Persian (Jalali) Date Picker**, **WCAG Contrast-Checked Color Picker**, **Multi-Select & Async Multi-Select**, **Sanitized WYSIWYG & Markdown Editors**, **Chunked `File.slice()` Multipart Uploader**, **Canvas Image Cropper**, **FormWizard Stepper**, **Repeater & Schema FormBuilder**, and **Localized Number Formatter** (Latin / Eastern Arabic / Persian numerals).

### 8. Internationalization, Bi-Directional RTL & Theme Architecture
- Full UI translation dictionary and logical CSS (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`) supporting **English (`en`)**, **Arabic (`ar` · RTL)**, **Persian (`fa` · RTL + Jalali)**, and **Spanish (`es`)** with light/dark mode parity.

---

## Screenshots

### Operations Data Grid & Print / PDF Export
| Backend-Driven Data Grid (`AutoDataGrid`) | Order Dispatch Print & PDF Preview |
| :---: | :---: |
| ![Orders Data Grid](docs/screenshots/02-orders-datagrid.png) | ![Order Print Preview & PDF Export](docs/screenshots/03-order-print-pdf-preview.png) |

### Kanban Workflow, Reports & RBAC Security
| Order Workflow Kanban Board | Operational Reports & Analytics |
| :---: | :---: |
| ![Order Kanban Board](docs/screenshots/11-kanban-board.png) | ![Reports and Heatmap](docs/screenshots/10-reports-heatmap.png) |

| RBAC Users & Permission Matrix | Interactive `JSONViewer` Debugger |
| :---: | :---: |
| ![RBAC Permission Matrix](docs/screenshots/12-rbac-permission-matrix.png) | ![JSONViewer Search & Syntax Highlighting](docs/screenshots/13-json-viewer-debugger.png) |

### File Storage Vault & Scoped Modal Form Picker
| File Storage Tree View & Inline Inspector | Scoped Modal File Picker (`rootFolderId`) |
| :---: | :---: |
| ![File Storage Vault Tree View](docs/screenshots/08-file-storage-vault.png) | ![Scoped Modal File Picker](docs/screenshots/09-file-storage-modal-picker.png) |

### Global Command Palette & Reusable UI Component Kit
| Fuzzy Command Palette (`⌘K`) | Form Controls, Date/Jalali Pickers & Uploader |
| :---: | :---: |
| ![Global Command Palette](docs/screenshots/04-command-palette.png) | ![Reusable React Component Kit](docs/screenshots/05-component-kit-ui.png) |

### Full Bi-Directional RTL (Dark Mode) & Mobile Experience
| Arabic RTL + Dark Mode Analytics | Mobile Responsive (`390×844`) |
| :---: | :---: |
| ![Arabic RTL Dark Mode Analytics](docs/screenshots/06-rtl-dark-analytics.png) | ![Mobile Responsive Overview](docs/screenshots/07-mobile-responsive.png) |

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), Motion, Lucide React |
| **Backend & Tooling** | Express 4, Vite 8, `tsx` dev server middleware |
| **Documents & Media** | `jspdf`, `jspdf-autotable`, `qrcode`, `jsqr` |
| **Testing** | Node.js built-in test runner (`node:test`) across `src/utils/*.test.ts` (**113 unit tests**) |

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `⌘K` / `Ctrl+K` | Open global fuzzy Command Palette |
| `G` then `O` | Jump to Operations Overview |
| `G` then `L` | Jump to Orders Ledger (`AutoDataGrid`) |
| `G` then `F` | Jump to Flagged Review Queue |
| `G` then `C` | Jump to Customers Directory |
| `G` then `S` | Jump to File Storage Vault |
| `G` then `K` | Jump to Reusable UI Component Kit |
| `C` | Open Create New Order Modal |
| `Q` | Open Camera / Manual QR Code Scanner |
| `N` | Toggle Notifications Center |
| `D` | Toggle Light / Dark Theme |
| `?` | Open Keyboard Shortcuts Overlay |

---

## Backend API Endpoints (`server.ts`)

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `GET` | `/api/orders` | Returns full grid schema (columns, filter specs, actions, bulk actions, CRUD fields) + sorted/filtered/paginated rows |
| `GET` | `/api/orders/all` | Returns full order dataset for analytics and quick-inspection syncing |
| `GET` | `/api/orders/options/:field` | Debounced AJAX search options for `company`, `region`, and `planOrItem` |
| `GET` | `/api/orders/export` | Streams scoped CSV export (`selected`, `current-page`, `current-filter`, `all-rows`) matching visible columns |
| `POST` | `/api/orders` | Creates a new order or duplicates an existing record (`duplicateFromId`) with server validation |
| `PATCH` | `/api/orders/:id` | Partially or fully updates an order record |
| `DELETE` | `/api/orders/:id` | Deletes a single order record |
| `POST` | `/api/orders/bulk` | Executes bulk status changes or deletions across any grid scope |
| `GET` | `/api/storage` | Lists all file storage folders/files and aggregate vault summary stats |
| `POST` | `/api/storage/folder` | Creates a new folder under root or parent directory with duplicate validation |
| `POST` | `/api/storage/file` | Creates a new text/structured file with automatic MIME/extension inference |
| `POST` | `/api/storage/upload` | Uploads one or more files into a target directory |
| `PATCH` | `/api/storage/:id` | Renames a node or updates editable file contents |
| `DELETE` | `/api/storage/:id` | Recursively removes a file or folder subtree |

---

## Project Structure

```text
├── server.ts                      # Express API + Vite dev middleware entry point
├── docs/
│   ├── HOW_TO_USE.md              # v1.0 Operator & Developer Usage Guide
│   └── screenshots/               # Updated v1.0 application UI screenshots
└── src/
    ├── App.tsx                    # Root shell, routing state, drawers, shortcuts & modals
    ├── components/
    │   ├── dashboard/             # CreateOrderModal, OrderDetailDrawer, AdvancedFilterDrawer
    │   ├── layout/                # AppShell, FavoritesBar
    │   ├── print/                 # OrderPrintModal, DataGridPrintModal, PrintPortal
    │   ├── storage/               # FileStoragePickerModal, StorageTreePanel, StorageInspectorPanel, StorageModals
    │   ├── ui/                    # 45+ modular UI components (AutoDataGrid, Charts, JSONViewer, Pickers, QR, etc.)
    │   └── views/                 # OverviewView, OrdersView, KanbanView, ReportsView, CustomersView,
    │                              # FileStorageView, AccessControlView, AuditLogView, SettingsView,
    │                              # OperationsTasksView, AuthErrorShowcaseView, ComponentKitView
    ├── data/                      # Initial operational datasets & notifications
    ├── hooks/                     # Reusable UI hooks (useDebounce, useClipboard, usePagination, etc.)
    ├── i18n/                      # I18nContext & EN / AR / FA / ES translation dictionaries
    ├── services/                  # pdfExportService.ts & httpClient.ts
    ├── types/                     # TypeScript interfaces for admin, grid contracts, and storage nodes
    └── utils/                     # Pure decoupled engines & node:test suites (113 unit tests)
```

---

## Getting Started

### Prerequisites
- Node.js `>= 20`
- npm

### Installation & Local Development
```bash
# Install dependencies
npm install

# Start full-stack Express + Vite development server on http://localhost:3000
npm run dev
```

### Verification, Type Checking & Unit Tests
```bash
# Run all 113 decoupled unit tests (grid engine, JSONViewer, file storage & root scoping,
# time-series math, Jalali calendar, PDF layout, RBAC & admin suite, command palette, etc.)
npx tsx --test src/utils/*.test.ts

# TypeScript strict check
npm run lint

# Production client bundle
npm run build
```
