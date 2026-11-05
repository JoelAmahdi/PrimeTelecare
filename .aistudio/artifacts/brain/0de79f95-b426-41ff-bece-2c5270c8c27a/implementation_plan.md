# Admin Dashboard & Navigation Redesign

Redesign the Telecare Administrator experience with a modern responsive sidebar navigation, breadcrumb header, and an executive-level dashboard featuring live clinical telemetry, doctor approval workflows, and itemized financial governance.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed by the user in Phase 1:
>
> - **Navigation Layout**: Modern left sidebar navigation ($240\text{px}$–$260\text{px}$) with distinctive icon tabs, live unboxed badge counters (pending approvals, pending payouts), and smooth mobile collapsible drawer.
> - **Primary Dashboard Layout**: Executive KPI metrics with live clinical queue and real-time consultation activity feed, complete with quick action triage drawers.

---

## 1. Overview & Core Concept

### What It Does
- **Modern Sidebar Architecture**: Replaces the cramped top segmented tab bar with a sleek, enterprise-grade left sidebar navigation with dedicated pages:
  1. **Dashboard** (`overview`): Executive KPI cards, real-time consultation activity feed, priority clinical triage alerts, and system health status.
  2. **Doctors List & Approval** (`doctors`): Licensure queue with instant verification badges (MDCN, Nigerian Medical Association), credential reviews, and single-click Approve / Suspend / Document Request actions.
  3. **Finance** (`finance`): Platform revenue telemetry, clinician NUBAN withdrawal approval queue, and itemized consult fee ledger in Nigerian Naira (`₦`).
  4. **Settings & Profile** (`settings`): Administrator profile card, MFA & security credentials, HIPAA/NDPR compliance toggles, and forensic audit log.
- **Top Bar Contract**: Breadcrumb trail (`Admin / Dashboard`, `Admin / Doctors & Licensure`), global quick-search filter, live telecare status pill, and rapid role-switching trigger.

### Target Audience & Persona
- **Telehealth Medical Directors & System Administrators**: Needing rapid situational awareness of active patient consultations, doctor verification queues, and financial payout compliance without layout clutter.

### Key Value
- Clean spatial rhythm and ergonomic navigation matching production SaaS standards (Linear, Stripe, Apple HIG).
- Zero navigational friction between doctor vetting, financial settlements, and active patient encounters.

---

## 2. User Experience & Visual Design

### Key User Flows

#### Flow 1: High-Level Executive Dashboard & Triage
1. **Entry**: Admin logs in or toggles into Admin Mode.
2. **Left Navigation**: Clean vertical sidebar displays the 4 core destinations with live counters (e.g., `2` pending doctors, `₦1.8M` payouts).
3. **Top Breadcrumb Header**: Displays active page context (`Telecare Admin / Overview & Operations`) and quick search.
4. **Executive KPI Ribbon**: Four high-contrast metric cards with tabular figures:
   - *Active Consultations*: `14` live video/voice sessions with trend indicator.
   - *Pending Licensure*: `2` physicians awaiting MDCN audit.
   - *Monthly Gross Booking*: `₦4,850,000` with 15% platform commission cut (`₦727,500`).
   - *Platform Uptime*: `99.98%` with verified WebRTC heartbeat.
5. **Operational Split View**:
   - *Left / Center (65%)*: Real-time consultation activity feed showing ongoing calls, participant avatars, specialty, and duration with "Inspect Call" modal.
   - *Right (35%)*: Actionable Attention Queue highlighting pending clinician credentials and high-value NUBAN disbursement requests.

#### Flow 2: Doctors List & Licensure Approvals
1. **Directory Header**: Filter tabs (`All Clinicians`, `Pending Verification`, `Active Practice`, `Suspended`) with search by name, MDCN number, or specialty.
2. **Review Drawer / Modal**: Clicking a pending clinician presents certified credentials, medical school, residency hospital, and certificate previews.
3. **Actions**: Instant "Approve & Grant Practice Privilege", "Request Additional Documentation", or "Reject Application".

#### Flow 3: Financial Governance & Withdrawals
1. **Financial Overview**: Tabular metrics tracking gross patient fees, net clinician balances, and pending disbursement volume.
2. **Payout Approvals**: NUBAN account verification, bank name, doctor balance, and "Approve Payout" action updating the audit trail.
3. **Ledger**: Itemized transactions with patient name, attending doctor, gross fee, platform retention, and net doctor payout.

#### Flow 4: Settings & Administrator Profile
1. **SysAdmin Profile Card**: Profile photo, Super Administrator designation, MFA status, and credential updates.
2. **Compliance Switches**: HIPAA end-to-end encryption toggle, automated 15-minute appointment reminder daemon, and emergency maintenance mode.
3. **Audit Trail**: Forensic event logging with admin user ID, action timestamps, and cryptographic status seals.

### Visual Identity & Theme
- **Layout Architecture**: 2-column workspace layout with fixed desktop sidebar ($250\text{px}$) and fluid main content area ($1190\text{px}$ max width with generous 24px–32px padding).
- **Color Palette**:
  - Background Canvas: Crisp off-white `#f8fafc` / `#f1f5f9`
  - Sidebar Surface: Clean porcelain white `#ffffff` with subtle hairline divider `border-slate-200/80`
  - Primary Clinical Accent: Deep emerald `#006c44` and clinical mint `#e6f4ea`
  - Deep Navy Slate: `#0f172a` for primary headings and high-contrast tabular numerals
  - Warning / Alert: Subdued amber `#d97706` for pending reviews; crimson `#dc2626` for suspended accounts
- **Typography & Hierarchy**:
  - Headings & Navigation: `Outfit` (semi-bold 600)
  - Body Text & Descriptions: `Nunito Sans` (regular 400, 14px)
  - Numerals & Codes: `JetBrains Mono` with `tabular-nums`
- **Zero-Pill Restraint**: Unboxed metadata with quiet typographic bullet separators (`·`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Persistent Left Sidebar vs. Top Tabs**:
  - *Chosen Approach*: Left navigation drawer (collapsible on mobile, persistent on desktop $\ge 1024\text{px}$) with icon + label + badge count layout.
  - *Why*: Eliminates top header crowding, matches desktop SaaS standards, and allows clear visual hierarchy with space for breadcrumbs and global actions.
- **Decision 2: Live Consultation Feed with Real-Time Drawer**:
  - *Chosen Approach*: Live visual roster on the Dashboard displaying active video/audio/chat sessions with doctor and patient metadata, connected duration, and direct observation controls.
  - *Why*: Provides immediate situational awareness to medical directors during operational hours.
- **Decision 3: Consolidated 4-Page System**:
  - *Chosen Approach*: Strictly organize into Dashboard, Doctors List & Approval, Finance, and Settings & Profile as requested.
  - *Why*: Avoids fragmented micro-pages while providing deep, full-featured management in each domain.

---

## 4. Technical Architecture & Data Strategy

### System Component Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 ADMIN WORKSPACE SHELL                                  │
├──────────────────────────────┬─────────────────────────────────────────────────────────┤
│    RESPONSIVE LEFT SIDEBAR   │                   TOP APP BAR HEADER                    │
│  - Brand Logo & Admin Badge  │  - Breadcrumb Trail (e.g. Admin / Dashboard)            │
│  - Navigation Items (4 Tabs) │  - Global Quick Search Filter                           │
│    • Dashboard (Live count)  │  - Telecare System Status (Active Sessions)             │
│    • Doctors (Pending badge) │  - Role Switcher ("Switch to Doctor / Patient")         │
│    • Finance (Payout badge)  ├─────────────────────────────────────────────────────────┤
│    • Settings & Profile      │                  MAIN CONTENT CANVAS                    │
│  - Current SysAdmin Card     │                                                         │
│  - Quick Sign Out Action     │  ┌───────────────────────────────────────────────────┐  │
│                              │  │ [Dashboard / Doctors / Finance / Settings Views]  │  │
│                              │  └───────────────────────────────────────────────────┘  │
└──────────────────────────────┴─────────────────────────────────────────────────────────┘
```

### Component & State Mapping

| Section | Active View Component | Key Handlers & State Transitions |
| :--- | :--- | :--- |
| **Sidebar Navigation** | `AdminSidebar` | `activeTab` switching, `mobileMenuOpen` toggle, dynamic badge counters |
| **Top Header** | `AdminHeader` | Search query filter, breadcrumb generation, exit admin mode |
| **Dashboard** | `AdminDashboardView` | Metric cards with trend calculations, live consultation drawer toggle, alert banner quick links |
| **Doctors** | `AdminDoctorsView` | MDCN license verification modal, approve/suspend status mutation, specialty filtering |
| **Finance** | `AdminFinanceView` | Disburse NUBAN payout action, fee breakdown calculations, search ledger |
| **Settings** | `AdminSettingsView` | Update admin profile details, toggle HIPAA/reminder compliance switches, export audit trail |
