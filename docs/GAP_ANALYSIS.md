# SkyHarmony Gap Analysis — Codebase vs Jira Specifications

**Audit Date:** April 18, 2026
**Audited By:** Codebase review against all 21 completed Jira epic Gherkin scenarios

---

## Summary

| Rating | Count | Epics |
|--------|-------|-------|
| **Fully Implemented** | 8 | SHD-3, 5, 8, 9, 15, 17, 22, (SHD-12 heatmap) |
| **Partial** | 11 | SHD-1, 2, 4, 6, 7, 10, 11, 12, 13, 14, 19 |
| **Not Implemented** | 2 | SHD-18 (aviation specifics), SHD-20 (multi-type booking) |

---

## Critical Gaps (Highest Impact)

### 1. Invoice PDF + Payment Integration (SHD-7)
**Spec says:** Invoice PDF generated and emailed. ACH and Stripe credit card payment.
**Reality:** Invoice line items stored as JSONB. `stripe_payment_id` and `payment_method` fields exist but are just strings — no Stripe SDK, no ACH integration, no email service.
**Impact:** Billing is display-only; operators can't actually pay invoices.
**Fix:** Integrate Stripe Elements for credit card, add PDF generation (e.g., `@react-pdf/renderer` or server-side `puppeteer`), add email via SendGrid/Postmark.

### 2. Multi-Type Asset Booking (SHD-20)
**Spec says:** Booking for 500 drones + 1 RTK + 2 trailers, all on manifest and billing.
**Reality:** Bookings have `drone_count` (integer) and `allocated_assets` (UUID array). No way to specify non-drone asset types in a booking.
**Impact:** Expanded asset types (trailers, RTK, antennas) exist in the catalog but can't be booked alongside drones.
**Fix:** Replace `drone_count` with `requested_assets: [{ type_id, count }]` structure. Update allocation to handle multi-type.

### 3. Aviation-Specific Features (SHD-18)
**Spec says:** FAA logbook fields, pilot certification tracking, leg-based (hours) booking.
**Reality:** Fixed-wing/helicopter/pyrodrone asset types exist with `typed_attributes`, but no FAA logbook table, no pilot certification entity, and bookings don't distinguish between drone-count pricing and flight-hours pricing.
**Impact:** Platform can catalog aircraft but can't broker them with aviation-compliant workflows.
**Fix:** Add `pilot_certifications` table, `faa_logbook_entries` table, and a booking mode switch (per-unit vs per-hour).

---

## High-Priority Gaps

### 4. No Real-Time Status Propagation (SHD-4)
**Spec says:** Admin dashboard reflects scan status change within 60 seconds.
**Reality:** Database updates are immediate, but no WebSocket or Server-Sent Events push changes to other clients. Dashboard only refreshes on page load.
**Fix:** Add WebSocket layer (e.g., `ws` or Socket.IO) for real-time asset status events.

### 5. MAC Address Not Captured on Scan (SHD-4)
**Spec says:** MAC address associated with custody event on scan.
**Reality:** `mac_address` column exists in `custody_events` table but is never populated by the scan endpoints.
**Fix:** Accept optional `mac_address` in POST /api/scan/checkout and /api/scan/checkin request body.

### 6. No Priority Rules for Allocation (SHD-6)
**Spec says:** Priority rules from governance agreement applied uniformly. Configurable fairness rules.
**Reality:** Allocation is first-come-first-served by serial number order. No priority rules table, no operator contribution weighting.
**Fix:** Add `allocation_rules` config table with operator priority weights, contribution-based ranking.

### 7. No Alternative Date Suggestions (SHD-6)
**Spec says:** When not enough drones available, suggest 3 alternative dates.
**Reality:** The frontend `AllocationService.ts` has `suggestAlternativeDates()` but the backend `/api/allocation/check` doesn't return alternatives.
**Fix:** Add alternative date scanning to the API check endpoint.

### 8. Critical Incident Doesn't Create Maintenance Ticket (SHD-14)
**Spec says:** When damage report submitted, maintenance ticket created.
**Reality:** Critical severity auto-grounds the drone (status → maintenance) and creates an audit event, but does NOT create a `maintenance_tickets` record.
**Fix:** In incidents.ts POST handler, after auto-grounding, insert a maintenance_ticket with type "damage".

---

## Medium-Priority Gaps

### 9. No Data Freshness Indicator (SHD-2)
**Spec says:** Data freshness less than 5 minutes old.
**Reality:** No timestamp shown for when dashboard data was last fetched.
**Fix:** Add `last_refreshed` timestamp to summary responses, show "Updated X seconds ago" in UI.

### 10. No Global Fleet Map Placeholder (SHD-2)
**Spec says:** Fleet map placeholder showing "Fleet Map — Coming in Phase 2".
**Reality:** No map component exists on the dashboard.
**Fix:** Add a placeholder card with map icon and "Coming in Phase 2" text.

### 11. Asset Type Schemas Not Fully Config-Driven (SHD-1)
**Spec says:** Adding a new asset type requires zero code changes.
**Reality:** Type schemas (which typed_attributes fields each type has) are hardcoded in `fleet.ts` GET /api/fleet/types/:typeId/schema. Adding a type requires a code change to add its schema.
**Fix:** Move type schemas to a `schema_definition` JSONB column on `asset_types` table, serve dynamically.

### 12. No Fleet-Split Across Markets (SHD-10)
**Spec says:** 1000-drone booking split across 3 markets with per-drone leg/ETA tracking.
**Reality:** Manifests are per-booking, not per-market. No market/region splitting logic.
**Fix:** Add multi-manifest support per booking with region-based asset grouping.

### 13. QR Scan Load/Unload Events Missing (SHD-10)
**Spec says:** Scanning drones onto trailer logs "loaded" custody event.
**Reality:** Custody events only support `check_out` and `check_in` actions. No `loaded`/`unloaded` actions.
**Fix:** Extend CustodyAction enum to include `loaded`, `unloaded`. Fire from logistics leg status updates.

### 14. Only 2-Sigma Anomaly Detection (SHD-11)
**Spec says:** Flag at N sigma deviation, with 3-sigma mentioned.
**Reality:** Detection threshold is hardcoded at 2-sigma. No configurable sigma threshold.
**Fix:** Add configurable sigma threshold to analytics config. Support 2-sigma (warning) and 3-sigma (critical) tiers.

### 15. No False Positive Tuning UI (SHD-11)
**Spec says:** False positive tuning + threshold config.
**Reality:** No UI for adjusting detection thresholds or reviewing false positive rates.
**Fix:** Add threshold config endpoint + UI section in AnalyticsPage.

### 16. No Sponsor Portal (SHD-19)
**Spec says:** Sponsor logs in and sees all sponsored shows with performance summaries.
**Reality:** Sponsors are managed by admins. No sponsor-specific login or dashboard.
**Fix:** Add sponsor role, sponsor-scoped auth, and sponsor dashboard page.

---

## Low-Priority Gaps (Acceptable for MVP)

### 17. Forecasting Uses Moving Average, Not ARIMA (SHD-12)
**Spec says:** ARIMA/exponential smoothing.
**Reality:** Simple moving average with seasonal multipliers.
**Acceptable:** Moving average is appropriate for the current data volume. ARIMA adds complexity without proven benefit at this scale.

### 18. Route Optimization Uses Nearest-Neighbor, Not VRP (SHD-13)
**Spec says:** VRP solver integration, driver hour constraints.
**Reality:** Nearest-neighbor heuristic with Haversine distance.
**Acceptable:** VRP solver requires external library (e.g., OR-Tools). Nearest-neighbor is sufficient for 10 venues.

### 19. No Driver Hour Constraints (SHD-13)
**Spec says:** Driver hour + maintenance window constraints.
**Reality:** Not implemented.
**Acceptable:** Can be added when real logistics fleet is larger.

### 20. No Mapping Integration (SHD-13)
**Spec says:** Google Maps/Mapbox for route visualization.
**Reality:** Routes displayed as text list with distances.
**Acceptable:** Map integration adds external dependency. Text list is functional.

---

## Items Correctly Marked as Won't Do

- **SHR-30:** Preferential Pricing / Favoritism Logic — deliberately excluded per governance
- **SHR-31:** Home-NAS Production Hosting — documented as demo-only constraint

---

## Recommended Fix Priority

### Sprint 1 (Critical for Demo)
1. Critical incident → maintenance ticket creation (30 min fix)
2. MAC address capture on scan (15 min fix)
3. Dashboard fleet map placeholder (15 min fix)
4. Data freshness timestamp on summary (30 min fix)

### Sprint 2 (Critical for Production)
5. Stripe payment integration
6. Invoice PDF generation
7. Email notifications (booking confirmed, invoice sent)
8. Multi-type asset booking structure

### Sprint 3 (Feature Completeness)
9. WebSocket real-time updates
10. Priority rules for allocation
11. Alternative date suggestions API
12. Sponsor portal with sponsor login
13. FAA logbook + pilot certification
14. 3-sigma anomaly detection + tuning UI

### Backlog (Nice to Have)
15. ARIMA/exponential smoothing forecasting
16. VRP solver for route optimization
17. Fleet-split across markets
18. Config-driven asset type schemas from DB
