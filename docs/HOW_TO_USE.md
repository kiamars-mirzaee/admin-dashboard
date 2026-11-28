# How to Use Kestrel Admin (v1.0.0)

This guide walks through **everyday operator workflows** in the Kestrel Admin console and **developer integration patterns** for reusing the TypeScript/React component system, `AutoDataGrid` backend contract, `EnterpriseTable`, File Storage Picker, `JSONViewer`, `DiffViewer`, Persian/RTL utilities, custom hooks, and PDF export engine.

---

## 1. Navigation Shell, Multi-Tenant Switcher & Productivity Tools

### Collapsible Sidebar, Workspace Switcher & Accessibility
- **Workspace / Tenant Switcher**: Use the organization dropdown at the top of the sidebar to switch between multi-tenant clearing workspaces (`Kestrel EU Clearing`, `Kestrel US Treasury`, `Kestrel APAC Hub`).
- **Impersonation & Global Announcements**:
  - Dismiss or jump directly from the top `AnnouncementBar` (`Platform Ops & Billing`).
  - Open the top-right account menu and click **Impersonate Operator** to preview another operator's session with a high-visibility `ImpersonationBanner` and one-click exit.
- **Skip Link**: Press `Tab` on page load to focus the **Skip to main content** link (`#main-content`).
- **Sidebar & Filter**: Click the collapse button in the sidebar header to toggle compact icon-only mode on desktop. Use **Filter menu...** to narrow route groups (`Commerce`, `Reports & heatmap`, `Audit log`, `File Storage`, `Admin & security`, `Tasks & Queue`, `Help & Docs`, `UI System`).

### Quick-Access Favorites, Recent Strip & Breadcrumbs
- **Pinned Shortcuts**: Click **Pin view** to bookmark the active route, or **Quick pin** to search and pin any individual order (`ORD-*`) or customer (`CUS-*`). Click `×` to unpin.
- **Recent Strip**: The `Recent:` strip next to pinned favorites automatically tracks your last visited routes for one-click jumping.
- **Breadcrumb Trail**: Dynamically reflects your active route hierarchy (`Overview / Admin & security / Platform Ops & Billing`) with clickable parent links.

### Global Command Palette (`⌘K` / `Ctrl+K`) & Keyboard Shortcuts (`?`)
- Press **`⌘K`** (`Ctrl+K` on Windows/Linux) to search orders, customers, routes, and UI System sections using fuzzy matching.
- Press **`?`** anywhere outside a text input to view all chords (`G` then `O/L/F/C/S/K`) and single-key shortcuts (`C`, `Q`, `N`, `D`).

### Language (`EN`, `AR`, `FA`, `ES`), Persian Normalization & Theme Switching
- Use the `#locale-switcher` dropdown in the top bar to toggle **English (`EN`)**, **Arabic (`AR` · RTL)**, **Persian (`FA` · RTL + Jalali)**, and **Spanish (`ES`)**.
- All layouts mirror cleanly (`dir="rtl"` / `dir="ltr"`) via logical CSS (`ms-*`, `me-*`, `ps-*`, `pe-*`), while technical IDs, currency totals, JSON trees, and diffs stay isolated in `<bdi dir="ltr">`.
- Persian search inputs and sorters normalize Arabic/Persian variants (`ي/ك` → `ی/ک`, Persian/Eastern Arabic numerals `۰-۹` / `٠-٩` → ASCII `0-9`, ZWNJ removal) and sort deterministically using `Intl.Collator('fa')`.

---

## 2. Operations Overview & Time-Series Analytics

- **KPI Stat Cards**: Displays Gross Volume, Settled Revenue, Average Order, and Flagged Review count with sparklines and drill-down actions.
- **Interactive Time-Series Chart (`TimeSeriesAnalytics`)**:
  1. Switch between **Area**, **Line**, **Bar**, **Stacked**, **Combo** (dual-axis), and **Donut** visualizations.
  2. Filter by preset window (**All**, **7D**, **30D**, **90D**, **Custom range**) and granularity (**Day**, **Week**, **Month**).
  3. Slice dynamically by metric (`Gross revenue`, `Settled`, `Orders`, `Avg order`), sales channels, and statuses with prior-period comparison deltas.
- **Reports & Heatmap (`Reports & heatmap`)**: Inspect regional throughput heatmaps (`HeatmapChart`), SLA `RadarChart`, and utilization `GaugeChart`.

---

## 3. Orders Ledger (`AutoDataGrid`), `EnterpriseTable`, Kanban & Forms

### Working with `AutoDataGrid` (`Commerce → Orders → All orders`)
- **Search & Multi-Type Filters**: Filter by plain search, numeric equality/ranges, comma-separated IDs, Gregorian date ranges, static multi-select, or debounced async multi-select (`company`, `region`, `planOrItem`).
- **Column Customization**: Show/hide columns, reorder columns, pin sticky columns, drag column dividers to resize widths, and switch between **Standard** and **Compact** density.
- **Row & Bulk Actions**: Click any row to open `OrderDetailDrawer`, use trailing row menus (`View`, `Edit`, `Duplicate`, `Print / PDF`, `Delete`), or select checkboxes to run bulk status updates, scoped CSV export (`selected`, `current-page`, `current-filter`, `all-rows`), or confirmed deletion.

### Working with `EnterpriseTable` (`UI System → Charts & KPIs`)
- Switch between **Saved Views** (`All Accounts`, `Verified Only`, `Jalali Dates`) to swap visibility/date formatting presets.
- Toggle **Group by Region**, **Sort Persian (`Intl.Collator`)**, expand hierarchical **Tree sub-rows** (`ENT-01` → `ENT-01-A`), drag row handles to reorder rows, click any amount cell for **inline cell editing**, click a row to inspect its **Master-Detail** drawer/panel, and review aggregated totals in the **Summary Footer**.

### Kanban Status Board & Order Editor
- Transition orders across stages (`Pending`, `Flagged`, `Settled`, `Refunded`) in `Commerce → Orders → Kanban board`.
- Open **New order** (`C`) or **Order Editor** for field-level validation, unsaved-changes prompts (`useBeforeUnload`), and local draft persistence.
- Use the **QR Scanner (`Q`)** to scan shipping/invoice QR codes or paste an `ORD-*` / `CUS-*` ID.

---

## 4. Print Preview & Client-Side PDF Export

1. **Data Grid PDF Export**: Click **Print / Export PDF** in the Orders Ledger toolbar to preview a print-optimized A4 landscape table summarizing active filters and totals, then export via `exportDataGridToPdf`.
2. **Order Dispatch Sheet PDF Export**: Click **Print / Export PDF** inside `OrderDetailDrawer` to generate a portrait A4 dispatch receipt with an embedded **QR verification code** (`exportOrderToPdf`).
3. **Printable Invoices**: Open **Admin & security → Platform Ops & Billing → Print Invoice** to preview and print an invoice complete with a dynamic SVG `Barcode`.
4. **Arabic / Persian Unicode Support**: `pdfExportService.ts` automatically renders high-DPI HTML5 Canvas pages when exporting RTL or Arabic/Persian text so ligatures remain intact.

---

## 5. File Storage Vault & Scoped Modal Form Picker

### Full File Storage Explorer (`File Storage`)
- Switch between **Open folder** (breadcrumbs + `Up one level`) and **Tree view** (hierarchical sidebar + right-hand inspector).
- Click **New folder** or **New file** (`.txt`, `.md`, `.json`, `.csv`, `.log`), drag-and-drop uploads directly into directories, and edit text/code files inline.

### Using the Scoped Modal File Picker in Forms (`FileStoragePickerModal` & `StorageFormField`)
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
- When `rootFolderId` is supplied (`'fld-contracts'`, `'fld-invoices'`, `'fld-compliance'`), traversal, search, and uploads stay strictly scoped to that subtree. Omit `rootFolderId` for full-vault browsing.

---

## 6. Platform Ops, RBAC Security, Audit Diffs & Identity Suite

- **Platform Ops & Billing (`Admin & security → Platform Ops & Billing`)**:
  - **Teams & Orgs**: Manage tenant rosters and invite members.
  - **Billing & Plans**: Monitor seat, API, and storage usage meters.
  - **Feature Flags**: Toggle runtime capabilities (`jalali_calendar_exports`, etc.) and rollout percentages.
  - **Webhook Logs**: Inspect delivery latency and HTTP payloads with `JSONViewer` and retry failed deliveries.
  - **System Health**, **Search Results**, and **Print Invoice**.
- **Users & Permissions (`Admin & security → Users & permissions`)**: Switch role presets, configure per-module capabilities (`View / Create / Edit / Delete`) in the Permission Matrix, and revoke active device sessions.
- **Audit Log & `DiffViewer` (`Audit log`)**: Filter events by actor/severity and click **Inspect diff** on any audit row to open a **Unified** or **Split** `DiffViewer` showing exact before/after changes.
- **Auth & 2FA Suite (`Admin & security → Auth & 2FA suite`)**: Interactive previews for **Login**, **Register**, **Forgot Password**, **Change Password**, **OTP Challenge**, **2FA Setup (QR + Recovery Codes)**, **Verify / Invite Accept**, **Account Lockout**, and **Onboarding Wizard**, alongside `403`, `404`, `500`, `Maintenance 503`, and `Offline` state pages.

---

## 7. Reusable Component Kit, Persian/RTL Utilities & Hooks (`UI System`)

### Component System Highlights
- **Primitives & Layout**: `Button`, `ButtonGroup`, `SplitButton`, `IconButton`, `Badge`, `StatusDot`, `Avatar`, `AvatarGroup`, `Card`, `Accordion`, `Tabs`, `Breadcrumb`, `SplitView`, `CircularProgress`, `Skeleton`, `EmptyState`, `Popconfirm`, `BottomSheet`, `SessionTimeoutModal`, `ProductTourModal`, `BackgroundTaskManager`, `FeedbackWidget`.
- **Forms & Workflows (`UI System → Inputs & pickers` / `Workflows & templates`)**:
  - Standard & specialized inputs (`NumberInput`, `CurrencyInput`, `PhoneInput`, `PasswordInput`, `OTPInput`, `MultiSelect`, `AsyncMultiSelect`, `ColorPicker`, `DatePicker`, `DateTimePicker`, `DateRangePicker`, `PersianDatePicker`, `WysiwygEditor`, `MarkdownEditor`, `MultipartUploader`, `ImageUpload`, `Repeater`, `FormBuilder`, `FormWizard`).
  - Advanced inputs & workflows (`TransferList`, `CascaderField`, `TreeSelectField`, `InputGroupAndMask`, `ConditionalAndMultiLangForm` with `FA/EN` bilingual tabs + auto-save, `CronBuilder`, `DurationInput`, `IconPicker`, `MentionInput`, `LocationPicker`, `SignaturePad`, `Captcha`, `ApprovalFlow`, `VersionHistory`, `TrashRecovery`, `AttachmentsList`, `TagCategoryManager`, `TemplateEditor`).
- **Charts, Logs & Diagnostics (`UI System → Charts & KPIs`)**:
  - `EnterpriseTable`, `FunnelChart`, `ScatterChart`, `TreemapChart`, `Barcode`, `OrgChart`, `LogViewer`, `PDFPreviewCard`, `MediaPlayer`, and `DiffViewer`.
  - **`JSONViewer`**: Syntax-highlighted tree debugger with search (`Enter` / `Shift+Enter`), `Matches only` mode, JSONPath click-to-copy, depth expansion, and raw view toggle:
    ```tsx
    import { JSONViewer } from './components/ui/JSONViewer';

    <JSONViewer
      title="GET /api/v2/orders/ORD-8490"
      data={apiPayload}
      defaultExpandDepth={2}
      surface="dark"
      searchable
      allowRawToggle
    />
    ```

### Persian/RTL Utilities (`src/utils/persianRtl.ts`) & Custom Hooks (`src/hooks/index.ts`)
```ts
import {
  normalizeDigits,
  normalizePersianText,
  sortByPersianField,
  computeJsonDiff,
} from './src/utils/persianRtl';

normalizeDigits('۱۴۰۵/۰۸/۲۷'); // "1405/08/27"
normalizePersianText('گروه كیان'); // "گروه کیان"
sortByPersianField(rows, (r) => r.companyFa, 'asc');
```
Available React hooks in `src/hooks/index.ts`:
- **Productivity & State**: `useDebounce`, `useDisclosure`, `useMediaQuery`, `useBreakpoint`, `useLocalStorage`, `useQueryParams`, `useUrlState`, `usePagination`, `useSelection`, `useTableState`, `useHotkeys`, `useClipboard` (`useCopy`).
- **Enterprise Lifecycle & Auth**: `useIdle`, `useBeforeUnload`, `useWebSocket`, `useInterval`, `useEventListener`, `useDownload`, `useFormPersist`, `useAbility`.

---

## 8. Running Locally, Tests & Production Build

```bash
# 1. Install dependencies
npm install

# 2. Start full-stack Express + Vite dev server on http://localhost:3000
npm run dev

# 3. Run all 119 decoupled unit tests (node:test)
npx tsx --test src/utils/*.test.ts

# 4. Run TypeScript strict type checking
npm run lint

# 5. Build production bundle
npm run build
```
