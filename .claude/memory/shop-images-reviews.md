---
name: shop-images-reviews
description: "Shop profile image + gallery (owner-uploaded, public) and customer review system (rating + reply + admin moderation)"
metadata: 
  node_type: memory
  type: project
  originSessionId: 67955480-3ace-4361-beb6-449c7329deb7
---

Two features added after the map-first lead work (migration 0012, two new tables).

**Shop images:** `shop_images` table (kind 'profile'|'gallery'|'cover', shopId, storageKey, sortOrder). 'cover' added later (TS enum value only, no migration — kind is an app-level text enum). Cover + profile are single (SaveShopImageUseCase replaces same-kind); gallery up to 12. Public page header is `ShopHero` (cover banner + brand-gradient fallback when no cover, circular profile avatar overlapping, name/category/rating) — replaced the old flat ShopProfileHeader (deleted). Profile = max 1/shop (use case replaces old row+object). Owner uploads in /shop/settings new "ภาพร้าน" tab (`ShopImagesManager`); shown on public `/s/[slug]` via `ShopProfileHeader` + `ShopGallery`. Served by **public, cacheable** route `app/api/shop-images/[imageId]/route.ts` (no auth, `Cache-Control: public, max-age=86400, immutable` — URL/id changes on replace). Reuses `slipStorage.saveObject` + new `slipStorage.delete()` (added to ISlipStorage/R2 DeleteObjectCommand/Local unlink); key helper `shopImageKey(shopId,imageId,ext)='shops/<shopId>/<imageId>.<ext>'`. NOTE: `LocalSlipStorage.resolveKey` generalized to N path segments (was 2) to support the nested key.

**Reviews:** `shop_reviews` table (rating 1–5, comment, ownerReply, ownerRepliedAt, isHidden, unique(shopId,customerId) — 1/customer/shop, editable). Only **device-bound customers** can review — `review-actions.ts submitReviewAction` resolves customer via `getMemberToken(slug)` → `customerDeviceRepository.findByToken` (no new customer auth). Owner replies (`replyToReviewAction` in shop-actions, works even when paused) at new `/shop/reviews` page (`OwnerReviewList`). Platform admin hides at new `/admin/reviews` (`setReviewHiddenAction`, `AdminReviewList`) — hidden excluded from public `pageByShop`/`summary` but visible to owner+admin. New notification type `shop_received_review` (notifyShopOwner on new review only, not edits). Star UI: `ui/StarRating` (display, half-stars) + `ui/StarRatingInput` (1–5 picker). Nav: `/shop/reviews` + `/admin/reviews` added to AppTabBar.

**Discovery (passerby) follow-up:** map popup ([StoreMapView.tsx](src/presentation/components/map/StoreMapView.tsx)) now shows profile thumb + `StarRating` + count and links "ดูร้าน & รีวิว" → `/s/[slug]` (anon already sees profile/gallery/reviews there; softened the anon "bind device" empty-state into a friendly invite). New public **shop directory** `app/(public)/shops/page.tsx` lists active shops sorted by rating (in-memory; category filter chips) — discoverable even without map coords; added "ร้านค้า" tab to `CustomerTabBar` (now 5 tabs). Enriched via new batch repo methods `shopReviewRepository.summariesByShop(ids)` + `shopImageRepository.profilesByShop(ids)` (avoid N+1); `MapShopLocation = ShopMapLocation & {rating, profileImageId}` built in homepage `app/(public)/page.tsx`. No schema change.

**Dev gotcha:** `.env.local` has R2_* configured, so dev uploads go to **R2, not local disk** — inserting a DB row + local file won't serve (route 404s a row whose R2 object is missing; correct behavior). Drive uploads through the actual action to test serving. Repos/use cases/pages all verified; hide/summary/gating tested via direct DB rows.

**Shop public details (migration 0013):** `shop_profiles` 1:1 table (PK shopId, all-optional: description, openingHours, phone, lineUrl, facebookUrl, instagramUrl, websiteUrl) — `IShopProfileRepository.get/upsert`, `UpdateShopProfileUseCase` (normalizes URLs: prepends https://). Owner edits in /shop/settings new "รายละเอียดร้าน" tab (`ShopProfileForm`). Public `/s/[slug]` renders `ShopDetails` (components/shop): about / **reward menu** ("สะสมครบ N ดวง รับ X" from active stamp types — shown to passersby, was member-only) / opening hours + contact links / location + Google Maps navigate (from primary branch coords). lucide `Facebook`/`Instagram` icons removed in current version → used generic `Link2`.

Related: [[r2-slip-storage]], [[leads-crm]], [[notifications-line]], [[cursor-pagination]], [[css-lint-enforcement]], [[project-easy-stamp]].
