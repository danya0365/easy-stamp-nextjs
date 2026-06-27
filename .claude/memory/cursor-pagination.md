---
name: cursor-pagination
description: "Phase 4 — app-wide cursor \"load more\" pagination convention (page* repo methods + LoadMore + (createdAt,id) keyset)"
metadata: 
  node_type: memory
  type: project
  originSessionId: add8da62-4407-485f-ab53-38217a9b99d4
---

Phase 4 (2026-06-15) added a single cursor-pagination convention for all high-volume lists. How to extend it:

- **Contract:** [pagination.ts](src/application/repositories/pagination.ts) — `Page<T>={items,nextCursor}`, `PageOpts={limit?,cursor?}`, `encodeCursor`/`decodeCursor` (base64 `"createdAt|id"`, tolerant), and pure `toPage(rows,limit)` (fetch `limit+1`, derive nextCursor). Keyset is `(createdAt DESC, id DESC)` because `createdAt` (ISO string) is NOT unique — `id` (nanoid) is the tiebreaker.
- **Repo side:** keep existing `list*` methods (used for counts), ADD `page*(scope, opts)` returning `Page<T>`. Use `cursorWhere(createdAtCol, idCol, cur)` + `toPage` from [_cursor.ts](src/infrastructure/repositories/drizzle/_cursor.ts) (re-exports toPage). Done for: redemptions(pageByShop/pageByCustomer), notifications(pageByUser), payments(pageByShop/pageByStatus), customers(pageByShop+search), contacts(listOpen + pageResolved).
- **UI side:** generic client [LoadMore.tsx](src/presentation/components/ui/LoadMore.tsx) (`initialItems`,`initialCursor`,`loadMore(cursor)`,`renderItem`,`getKey`). Each surface = a small client list component that imports its server action + a row renderer; the page renders the first page server-side and shows EmptyState when empty. Data-returning approach (action returns plain enriched items + nextCursor), NOT RSC-returning.
- **Server actions** derive scope from session/cookie; client only passes the opaque cursor (+ slug/search bound where needed). Enrichment helpers are `server-only` modules ([redemption-items.ts](src/presentation/components/stamp/redemption-items.ts), [customer-rows.ts](src/presentation/components/shop/customer-rows.ts)).
- **Indexes:** migration `0006_thankful_the_captain.sql` added `payments(status,createdAt)` + `customers(shopId,createdAt)` (redemptions/notifications/contacts already had them). See [[drizzle-kit-targets-prod]].
- **Contacts special case:** open requests (all, few) + first page of resolved are concatenated as `initialItems`; "load more" appends only resolved (avoids a compound status+date cursor).
- **Not paginated** (bounded): branches, staff, stamp types, shop categories, admin shops list, /me cards, topup-transactions (no UI).
- Also Phase 4 polish: shared [Textarea.tsx](src/presentation/components/ui/Textarea.tsx); unified ellipsis `…`; resolved-contact label "ดำเนินการแล้ว"; eligible badge "ครบ แลกได้". Relates to [[multi-stamp-types]].
