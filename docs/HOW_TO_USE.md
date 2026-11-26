# How to Use Kestrel Admin (v1.0.0)

This guide walks through both **everyday operator workflows** in the Kestrel Admin console and **developer integration patterns** for reusing the `40+` TypeScript/React components, `AutoDataGrid` backend contract, File Storage Picker, `JSONViewer`, and PDF export engine.

---

## 1. Navigation Shell & Productivity Tools

### Collapsible Sidebar, Quick-Access Bar & Breadcrumbs
- **Sidebar & Filter**: Click the collapse button in the sidebar header to toggle compact icon-only mode on desktop. Use the **Filter menu...** search box at the top of the sidebar to narrow route groups (`Commerce`, `Reports & heatmap`, `Audit log`, `File Storage`, `Admin & security`, `Tasks & Queue`, `Help & Docs`, `UI System`).
- **Quick-Access Favorites Bar**: Located directly beneath the top bar.
  - Click **Pin view** to bookmark the active route.
  - Click **Quick pin** to search and pin any individual order (`ORD-*`) or customer (`CUS-*`) for one-click access.
  - Click the `×` icon on any pinned chip to unpin it. Favorites persist in `localStorage` and prune automatically if an underlying record is deleted.
- **Breadcrumb Trail**: Dynamically reflects your active hierarchy (`Overview`, `Commerce / Orders / All orders`, `UI System / All components`, etc.). Clicking parent breadcrumbs navigates back cleanly.

### Global Command Palette (`⌘K` / `Ctrl+K`)
- Press **`⌘K`** (macOS) or **`Ctrl+K`** (Windows/Linux), or click the header search bar, to open the fuzzy Command Palette.
- Filter by **All**, **Orders**, **Customers**, or **Sections**; type multi-term or fuzzy queries (e.g., `8490`, `marcus sf`, `json`, `jalali`, `storage`) and press **Enter** to jump directly to the record or component section.

### Keyboard Shortcuts (`?`)
Press **`?`** anywhere outside a text field to view the shortcut modal:
- **`G` then `O`** — Operations Overview
- **`G` then `L`** — Orders Ledger (`AutoDataGrid`)
- **`G` then `F`** — Flagged Orders Queue
- **`G` then `C`** — Customers Directory
- **`G` then `S`** — File Storage Vault
- **`G` then `K`** — Reusable UI Component Kit
- **`C`** — Open Create Order Modal
- **`Q`** — Open Camera / Manual QR Code Scanner
- **`N`** — Toggle Notifications Center
- **`D`** — Toggle Light / Dark Theme

### Language (`EN`, `AR`, `FA`, `ES`) & Theme Switching
- Use the header language dropdown to switch between **English (`EN`)**, **Arabic (`AR` · RTL)**, **Persian (`FA` · RTL + Jalali)**, and **Spanish (`ES`)**.
- All layouts automatically mirror (`dir="rtl"` / `dir="ltr"`) using logical CSS utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`), while technical tokens (`ORD-*`, currency numbers, JSON trees, paths) stay cleanly `dir="ltr"`.

---

## 2. Operations Overview & Time-Series Analytics

- **KPI Stat Cards**: Displays Gross Volume, Settled Revenue, Average Order, and Flagged Review count with interactive sparklines and drill-down clicks.
- **Interactive Time-Series Chart (`TimeSeriesAnalytics`)**:
  1. Choose a chart visualization: **Area**, **Line**, **Bar**, **Stacked**, **Combo** (dual-axis bar + line), or **Donut**.
  2. Slice the time window using **All**, **7D**, **30D**, **90D**, or **Custom range**.
  3. Switch bucket granularity between **Day**, **Week**, and **Month**, and switch metrics (`Gross revenue`, `Settled`, `Orders`, `Avg order`).
  4. Click **Series filters** to filter dynamically by sales channel (`Enterprise`, `Direct`, `Partner`, `Marketplace`) and order status (`Settled`, `Pending`, `Flagged`, `Refunded`).
- **Reports & Heatmap (`Reports & heatmap`)**: Inspect regional throughput heatmaps, activity intensity grids, and multi-axis SLA Radar / Gauge charts.

---

## 3. Orders Ledger (`AutoDataGrid`), Kanban & Forms

### Working with `AutoDataGrid` (`Commerce → Orders → All orders`)
- **Search & Multi-Type Filters**: Filter by plain search, numeric equality/ranges, comma-separated IDs, Gregorian date ranges, static multi-select, or debounced async multi-select (`company`, `region`, `planOrItem`). Active filters render as removable chips with a **Clear all** button.
- **Column Customization**: Open the column settings menu to show/hide columns, reorder columns, pin sticky columns, or drag column dividers to resize widths. Switch between **Standard** and **Compact** row density.
- **Row & Bulk Actions**:
  - Click any row to open the **Order Detail Drawer**, or use the trailing row action menu (`View`, `Edit`, `Duplicate`, `Print / PDF`, `Delete`).
  - Select checkboxes to open the floating **Bulk Action Bar**, allowing batch status updates, CSV export (`selected`, `current-page`, `current-filter`, `all-rows`), or confirmed deletion.

### Kanban Status Board (`Commerce → Orders → Kanban board`)
- View orders grouped by fulfillment/risk stage (`Pending`, `Flagged`, `Settled`, `Refunded`) and transition order cards across workflow columns.

### Order Detail Page & Create/Edit Forms
- Click **New order** (`C`) or **Commerce → Orders → Order Editor** to create or edit orders with field-level validation, unsaved-changes warnings, and auto-saved draft recovery.
- Use the header **QR Scanner (`Q`)** to scan a physical label or paste an `ORD-*` / `CUS-*` payload to open the matching record immediately.

---

## 4. Print Preview & Client-Side PDF Export

1. **Data Grid PDF Export**: Click **Print / Export PDF** in the Orders Ledger toolbar to preview a print-optimized A4 landscape table summarizing active filters, visible columns, and totals, then download as `.pdf` (`exportDataGridToPdf`).
2. **Order Dispatch Sheet PDF Export**: Open any order in the `OrderDetailDrawer` and click **Print / Export PDF** to generate a portrait A4 dispatch receipt with customer billing metadata, line details, and an embedded **QR verification code** (`exportOrderToPdf`).
3. **Arabic / Persian Unicode Support**: When exporting non-Latin / RTL text, `pdfExportService.ts` automatically rasterizes high-DPI HTML5 Canvas pages so Arabic and Persian ligatures and right-to-left typography render accurately inside the PDF.

---

## 5. File Storage Vault & Scoped Modal Form Picker

### Full File Storage Explorer (`File Storage`)
- **View Modes**: Switch between **Open folder** (breadcrumb navigation + `Up one level`) and **Tree view** (expandable folder hierarchy paired with the right-hand file inspector).
- **File & Folder Operations**:
  - Click **New folder** or **New file** (supports `.txt`, `.md`, `.json`, `.csv`, `.log`) to create items in the active directory.
  - Click **Upload files** or drag-and-drop files from your computer directly into the file list.
  - Select any file in the inspector to **preview**, **edit inline** (for text/code/structured files), **rename**, **download**, or **delete**.

### Using the Scoped Modal File Picker in Forms (`FileStoragePickerModal` & `StorageFormField`)
Developers can embed the storage picker inside any React form and lock browsing to a predefined root directory:

```tsx
import { StorageFormField } from './components/storage/FileStoragePickerModal';

<StorageFormField
  label="Signed Partner Contract"
  rootFolderId="fld-contracts"   // Locks tree, breadcrumbs, search & uploads to Partner Contracts
  multiple={false}
  value={selectedFileIds}
  onChange={setSelectedFileIds}
/>
```

- When `rootFolderId` is set (e.g. `'fld-contracts'`, `'fld-invoices'`, `'fld-compliance'`), users cannot traverse above that root folder, and uploads/searches stay confined to that subtree.
- Omit `rootFolderId` to allow browsing the entire File Storage vault.

---

## 6. Admin, Security (RBAC), Audit Log & Tasks

- **Users & Permissions (`Admin & security → Users & permissions`)**:
  - Switch active personas (`Super Admin`, `Operations Lead`, `Support Agent`, `Auditor`) and edit granular module capabilities (`orders`, `customers`, `storage`, `reports`, `settings`, `audit`) in the **Permission Matrix**.
  - Inspect active user sessions and revoke device sessions.
- **Audit Log (`Audit log`)**: Filter security, settlement, and role-change events by actor, severity, or resource.
- **Settings (`Settings`)**: Configure General workspace preferences, Security/2FA toggles, Notifications, and Webhook Integrations.
- **Auth & Error Showcase (`Admin & security → Auth Flows / 403 / 404 / 500 / Maintenance / Offline`)**: Preview complete Sign-In, Password Reset, 2FA/OTP verification, and full-page error states.
- **Tasks & Help (`Tasks & Queue` / `Help & Docs`)**: Monitor background worker queues with progress telemetry and browse the in-app Operations Playbook and release changelog.

---

## 7. Reusable Component Kit (`UI System → All components`)

Explore live interactive demos for every component layer:
- **Primitives & Layout**: `Button`, `ButtonGroup`, `SplitButton`, `IconButton`, `Badge`, `StatusDot`, `Avatar`, `AvatarGroup`, `Card`, `Accordion`, `Tabs`, `Breadcrumb`, `SplitView`, `CircularProgress`, `Skeleton`, `EmptyState`.
- **Forms & Inputs**: `NumberInput`, `CurrencyInput`, `PhoneInput`, `PasswordInput`, `OTPInput`, `MultiSelect`, `AsyncMultiSelect`, `ColorPicker` (with WCAG contrast), `DatePicker`, `DateTimePicker`, `DateRangePicker`, `PersianDatePicker` (Jalali), `WysiwygEditor`, `MarkdownEditor`, `MultipartUploader`, `ImageUpload` (canvas crop), `Repeater`, `FormBuilder`, and `FormWizard`.
- **Data Display & Debugging (`JSONViewer`)**:
  ```tsx
  import { JSONViewer } from './components/ui/JSONViewer';

  <JSONViewer
    title="GET /api/v2/orders/ORD-8490"
    data={apiPayload}
    defaultExpandDepth={2}
    surface="dark"          // 'dark' | 'auto'
    searchable
    allowRawToggle
  />
  ```
  - **Syntax Highlighting**: Distinct colors for keys, strings, numbers, booleans, `null`, and punctuation.
  - **Collapsible Nodes**: Toggle individual branches with `{N keys}` / `[N items]` summary badges, or use **Expand** / **Collapse** toolbar actions.
  - **Search & Debug**: Filter across keys and values, jump between matches with **`↑` / `↓`** (`Enter` / `Shift+Enter`), enable **Matches only** to isolate matching branches, hover any line to copy its canonical **JSONPath** (`$.order.rails[0].rail`), or toggle **Raw** JSON.

---

## 8. Running Locally, Tests & Production Build

```bash
# 1. Install dependencies
npm install

# 2. Start full-stack Express + Vite dev server on http://localhost:3000
npm run dev

# 3. Run all 113 decoupled unit tests (node:test)
npx tsx --test src/utils/*.test.ts

# 4. Run TypeScript strict type checking
npm run lint

# 5. Build production bundle
npm run build
```
