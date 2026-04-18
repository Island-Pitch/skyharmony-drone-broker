# SkyHarmony User Guide

## Kia ora — Welcome

SkyHarmony coordinates drone fleets across a cooperative of operators. This guide covers everyday use of the platform for all user types.

---

## Getting Started

### Creating Your Account

1. Visit the SkyHarmony landing page and click **Sign In**
2. Click **Sign up** at the bottom of the login form
3. Enter your name, email, and password (minimum 6 characters)
4. Complete the **onboarding wizard**:
   - **Step 1:** Select your role — what best describes you?
     - *Drone Fleet Owner* — You own drones and make them available
     - *Show Operator* — You coordinate shows and book fleet
     - *Logistics Provider* — You handle transport and field operations
     - *Platform Administrator* — You manage the cooperative
   - **Step 2:** Enter your organization name and primary region
   - **Step 3:** (Fleet owners only) Approximate fleet size
   - **Step 4:** Welcome — enter the platform

### Signing In

- Visit `/login` and enter your email and password
- Demo credentials: `admin@skyharmony.dev` / `admin123`
- Your session lasts 24 hours before requiring re-login

### Signing Out

Click **Sign Out** at the bottom of the sidebar navigation.

---

## Dashboard

Your dashboard shows a summary relevant to your role.

### Platform Admin Dashboard

- **KPI Cards** — Total assets, available, allocated, in transit, maintenance, retired, utilization %
- **Active Bookings** — All operators' upcoming shows, sortable by date
- **Maintenance Alerts** — Drones approaching flight hour limits, battery cycle limits, or firmware drift
- **Revenue Summary** — Total revenue, allocation fees, standby fees, pending invoices
- **Operator Breakdown** — Per-operator utilization bars and contribution ratios

### Operator Dashboard

- Available fleet count and utilization for your organization
- Your upcoming bookings

---

## Fleet Management

Navigate to **Fleet** in the sidebar.

### Viewing Assets

The fleet table shows your organization's assets (or all assets for admins):

| Column | Description |
|--------|-------------|
| Serial | Unique identifier (e.g., VE-0001) |
| Manufacturer | Verge Aero, DJI Enterprise, Skydio, Autel Robotics |
| Model | Specific model name |
| Status | Available, Allocated, In Transit, Maintenance, Retired |

### Asset Statuses

- **Available** — Ready for booking allocation
- **Allocated** — Assigned to an upcoming show
- **In Transit** — Being transported to/from a show site
- **Maintenance** — Undergoing service or repair
- **Retired** — Permanently removed from service

---

## Bookings

Navigate to **Bookings** in the sidebar. The page has three tabs:

### New Booking (Fleet Owners & Operators)

1. Select **Show Date** (required) and optional **End Date** for multi-day shows
2. Enter **Number of Drones** needed
3. Enter **Location** (e.g., "Los Angeles, CA")
4. Add optional **Notes** (special requirements)
5. Click **Submit Booking Request**
6. You'll see a confirmation with your booking reference number

### My Bookings

View all bookings you've submitted, sorted by show date. Each shows:
- Booking reference and date
- Drone count and location
- Current status (Pending, Allocated, Confirmed, Completed, Cancelled)

### Admin Queue (Admins only)

View and manage all bookings across operators:
- **Approve** — Move pending bookings to allocated status
- **Confirm** — Confirm allocated bookings after operator verification
- Sort by any column

### Booking Lifecycle

```
Pending → Allocated → Confirmed → Completed
  ↓          ↓           ↓
Cancelled  Cancelled   Cancelled
```

---

## Billing & Revenue

Navigate to **Billing** in the sidebar. (Fleet Owners see their own; Admins see all.)

### Revenue Breakdown

- **Allocation Fees** — $350 per drone per booking (for allocated/confirmed/completed bookings)
- **Standby Fees** — $150 per drone for pending bookings holding fleet in reserve
- **Insurance Pool** — 7% of allocation fees contributed to cooperative insurance
- **Pending Invoices** — Number of bookings awaiting payment

### Per-Operator Revenue

The bar chart and table show how revenue splits across operators, with allocation fees (gold) and standby fees (amber) stacked.

---

## QR Scan (Check-In / Check-Out)

Navigate to **Scan** in the sidebar. Used by field staff during show setup and teardown.

### Scanning a Drone

1. Enter the drone's **serial number** in the input field (e.g., `VE-0001`)
2. Click **Scan**
3. The drone's details appear: serial, manufacturer, model, firmware, flight hours, battery cycles, status

### Check-Out (Dispatching for a Show)

- If the drone is **Available**, click **Check Out**
- Status changes to **Allocated**
- A custody event is recorded with your user ID and timestamp

### Check-In (Returning from a Show)

- If the drone is **Allocated**, click **Check In**
- Status returns to **Available**
- Custody event logged

### Report Issue

- If you discover damage during check-in, click **Report Issue**
- You'll be redirected to the Incidents page with the asset pre-selected

### Manifest Reconciliation

The right panel shows progress for the current manifest:
- Progress bar: "X / Y scanned"
- List of unscanned drones
- "Fully Reconciled" when all drones are accounted for

---

## Allocation Engine (Admins only)

Navigate to **Allocation** in the sidebar.

### Checking Availability

1. Select a **pending booking** from the list
2. The panel shows how many drones are available for those dates
3. If there's a shortfall, alternative dates are suggested

### Allocating Drones

1. Click **Allocate** on a booking
2. The engine assigns available drones (sorted by serial number for fairness)
3. Each assigned drone's status changes to **Allocated**
4. The booking transitions from **Pending** to **Allocated**

---

## Incident Reporting

Navigate to **Incidents** in the sidebar.

### Reporting Damage

1. Click the **Report Incident** tab
2. Select the **Asset** from the dropdown
3. Choose **Severity**:
   - *Cosmetic* — Surface damage, no functional impact
   - *Functional* — Affects flight capability, needs repair
   - *Critical* — Unsafe to fly, immediately grounded
4. Describe the damage and optionally add a photo URL
5. Click **Submit Report**

**Note:** Critical severity automatically grounds the drone (changes status to Maintenance).

### Incident Queue (Admins only)

View all reported incidents with severity badges. Filter by severity or status. Click **Resolve** to close an incident with resolution notes.

---

## Keyboard Shortcuts & Accessibility

- All interactive elements are keyboard-navigable (Tab, Enter, Space, Escape)
- Focus indicators are visible on all controls
- Status changes are announced to screen readers
- The platform respects `prefers-reduced-motion` for users who need reduced animation
- Visit `/accessibility` for our full accessibility statement

---

## Getting Help

- **Accessibility issues:** accessibility@skyharmony.dev
- **Privacy questions:** privacy@skyharmony.dev
- **Legal inquiries:** legal@skyharmony.dev
- **Platform support:** support@skyharmony.dev
