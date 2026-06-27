---
name: leads-crm
description: "Field-sales CRM (leads) — admin-only prospect tracking with map/navigate, photos, visit-log, convert-to-shop, follow-up cron"
metadata: 
  node_type: memory
  type: project
  originSessionId: 67955480-3ace-4361-beb6-449c7329deb7
---

Admin-only field-sales CRM for door-to-door prospecting, shipped after prod launch (first customer). Leads are a SEPARATE entity from billable `shops` (creating a shop auto-makes owner+subscription, would pollute billing/analytics).

**Schema (migration 0011):** `leads` (name, categoryId, address, phone, lat/lng, photoUrl, status, lostReason, nextFollowUpAt, notes, convertedShopId, convertedAt, createdBy) + `lead_visit_logs` (append-only ledger like topup_transactions; reaction/statusBefore/statusAfter/note/performedBy). Status funnel: new→visited→interested→won→lost.

**Layers:** `ILeadRepository`/`ILeadVisitLogRepository` + Drizzle impls (keyset pagination via `_cursor`, `listMapLocations`, `listDueFollowUps`); use cases in `src/application/use-cases/lead/` (Create/Update/UpdateLocation/SetStatus/AddVisitLog/Convert/ListDueFollowUps + SaveLeadPhoto); actions in `src/presentation/actions/lead-actions.ts`; pages under `app/(platform)/admin/leads/` (list w/ status filter, [leadId] detail, /map). Components in `src/presentation/components/leads/`. Display constants (labels/tones/pin colors) in `src/presentation/lib/lead-display.ts`.

**Reuse:** map forked from `StoreMapView`/`BranchLocationEditorView` (GPS capture, OSM tiles); photos reuse `ISlipStorage` via new generic `saveObject({key,...})` + `leadPhotoKey`, served at `/api/lead-photos/[leadId]` (admin-gated); geo validation extracted to `src/domain/services/geo.ts` (`validateLatLng`/`normalizeAddress`, also used by `UpdateBranchLocationUseCase`). Convert wraps `CreateShopUseCase` + `CreateBranchUseCase`, carries lat/lng to the new branch so it plots on the public map.

**Google Maps nav:** popup/editor link `https://www.google.com/maps/dir/?api=1&destination=lat,lng`.

**Follow-up reminder:** Vercel cron (`vercel.json`, `0 1 * * *` = 08:00 BKK) → `app/api/cron/lead-follow-ups/route.ts` (Bearer `CRON_SECRET`, timingSafeEqual) → `notifyAdmins` (new notification type `lead_follow_up_due`, added to schema enum + entities + NotificationList icon map). Prod needs `CRON_SECRET` env set.

**Local DB gotcha confirmed:** `.env.local` → `file:./local.db` (push-based, no migration journal — `db:migrate` fails on it; use `drizzle-kit push --force` with `TURSO_DATABASE_URL=file:./local.db` inline). `.env.production.local` → remote prod, and default `db:migrate`/`push` resolve to PROD (see [[drizzle-kit-targets-prod]]). Prod auto-migrates 0011 on next deploy via `scripts/vercel-migrate.mjs`.

**Map-first lead creation (added after v1.10.0):** `/admin/leads/new` page (`LeadCreateMapPicker`) — search a place, pan/zoom (≥15), tap an OSM POI marker to autofill name/category/phone/address/lat-lng, or tap empty spot for reverse-geocode address. Backed by `IGeocoder`/`OsmGeocoder` (Overpass + Nominatim, free OSM, no key; env `OSM_OVERPASS_URL`/`OSM_NOMINATIM_URL`/`GEO_USER_AGENT` with working defaults; in-memory TTL cache) + admin-gated routes `app/api/geo/{pois,reverse,search}/route.ts`. OSM tag→category mapping in `src/domain/services/osm-poi.ts` (pure; slugs match seed coffee/bakery/food/beverage/beauty/retail/other). Old inline `CreateLeadForm` removed; `createLeadAction` unchanged. No DB/migration change. TH OSM coverage is patchy for small shops → reverse-geocode fallback. Prod: set `GEO_USER_AGENT` with contact per Nominatim policy.

Built all 4 phases at once (one migration 0011). Related: [[project-easy-stamp]], [[notifications-line]], [[r2-slip-storage]], [[cursor-pagination]].
