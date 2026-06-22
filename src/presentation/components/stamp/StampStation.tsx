"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import {
  Camera,
  Plus,
  Minus,
  Gift,
  Smartphone,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";

import {
  addStampsAction,
  lookupCardAction,
  lookupByCodeAction,
  redeemRewardAction,
  generateBindCodeAction,
  type StampActionState,
} from "@/src/presentation/actions/stamp-actions";
import { extractCustomerCode } from "@/src/presentation/lib/scan";
import type { StampType } from "@/src/domain/entities";
import { Card } from "@/src/presentation/components/ui/Card";
import { Input } from "@/src/presentation/components/ui/Input";
import { Button } from "@/src/presentation/components/ui/Button";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Modal } from "@/src/presentation/components/ui/Modal";
import { useToast } from "@/src/presentation/components/ui/Toast";
import { CardBalance } from "@/src/presentation/components/stamp/CardBalance";
import { QrScanModal } from "@/src/presentation/components/stamp/QrScanModal";

/** Lightweight customer for client-side autocomplete (preloaded by the page). */
export interface CustomerOption {
  id: string;
  phone: string;
  name: string | null;
}

const MAX_SUGGESTIONS = 8;

export function StampStation({
  stampTypes,
  customers,
}: {
  stampTypes: StampType[];
  customers: CustomerOption[];
}) {
  // Combobox
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  // Active customer (selected from a suggestion / scan / new)
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [isNew, setIsNew] = useState(false);
  // Stamp params
  const [quantity, setQuantity] = useState(1);
  const [typeId, setTypeId] = useState(stampTypes[0]?.id ?? "");
  const [result, setResult] = useState<StampActionState | null>(null);
  // Modals
  const [scanOpen, setScanOpen] = useState(false);
  const [bindImg, setBindImg] = useState<string | null>(null);
  const [bindError, setBindError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();

  const digits = query.replace(/\D/g, "");
  const q = query.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!q) return [];
    return customers
      .filter(
        (c) =>
          (digits.length > 0 && c.phone.includes(digits)) ||
          (q.length > 0 && (c.name?.toLowerCase().includes(q) ?? false)),
      )
      .slice(0, MAX_SUGGESTIONS);
  }, [customers, digits, q]);

  const exactMatch = digits.length > 0 && customers.some((c) => c.phone === digits);
  const canCreate = digits.length >= 9 && !exactMatch;

  function notify(next: StampActionState) {
    if (next.success) toast.success(next.success);
    if (next.error) toast.error(next.error);
  }

  function setActive(p: string, n: string | null, opts?: { isNew?: boolean }) {
    setPhone(p);
    setName(n ?? "");
    setIsNew(opts?.isNew ?? false);
    setQuery(n ? `${n} · ${p}` : p);
    setOpen(false);
  }

  function loadCard(p: string) {
    const fd = new FormData();
    fd.set("phone", p);
    start(async () => {
      const next = await lookupCardAction({}, fd);
      setResult(next);
      notify(next);
    });
  }

  function selectCustomer(c: CustomerOption) {
    setActive(c.phone, c.name);
    loadCard(c.phone);
  }

  function startNew() {
    setActive(digits, "", { isNew: true });
    setResult(null);
  }

  /** Build the add-stamps FormData for a phone + the current type/quantity. */
  function addFor(p: string, qty: number, displayName: string | null) {
    const fd = new FormData();
    fd.set("phone", p);
    fd.set("quantity", String(qty));
    fd.set("stampTypeId", typeId);
    fd.set("displayName", displayName ?? "");
    return fd;
  }

  /** Quick "+1" from a suggestion row — stamp without opening the card first. */
  function quickAdd(c: CustomerOption) {
    if (!typeId) return;
    start(async () => {
      const next = await addStampsAction({}, addFor(c.phone, 1, c.name));
      notify(next);
      setActive(c.phone, c.name);
      setResult(next);
    });
  }

  /** "+N" from the selected-customer panel. */
  function addStamps() {
    if (!phone || !typeId) return;
    start(async () => {
      const next = await addStampsAction({}, addFor(phone, quantity, name));
      setResult(next);
      notify(next);
      setIsNew(false);
    });
  }

  function redeem(stampTypeId: string) {
    const fd = new FormData();
    fd.set("phone", phone);
    fd.set("stampTypeId", stampTypeId);
    start(async () => {
      const next = await redeemRewardAction({}, fd);
      setResult(next);
      notify(next);
    });
  }

  const handleScan = useCallback(
    (scanned: string) => {
      setScanOpen(false);
      const fd = new FormData();
      fd.set("code", extractCustomerCode(scanned));
      start(async () => {
        const next = await lookupByCodeAction({}, fd);
        notify(next);
        setResult(next);
        if (next.phone) setActive(next.phone, next.view?.customer.displayName ?? null);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  function openBind() {
    setBindError(null);
    setBindImg(null);
    start(async () => {
      const res = await generateBindCodeAction(phone);
      if (res.error) {
        setBindError(res.error);
        toast.error(res.error);
      } else setBindImg(res.imageUrl ?? null);
    });
  }

  function reset() {
    setPhone("");
    setName("");
    setIsNew(false);
    setQuery("");
    setResult(null);
    setQuantity(1);
  }

  const view = result?.view;
  const redeemable = view?.types.filter((t) => t.eligibleToRedeem) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex flex-col gap-3">
          {/* Stamp type (only when the shop has more than one) */}
          {stampTypes.length > 1 && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                ประเภทแสตมป์
              </label>
              <select
                value={typeId}
                onChange={(e) => setTypeId(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              >
                {stampTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Combobox: type phone or name → suggestions with quick +1 */}
          <label className="text-sm font-medium text-foreground">
            ค้นหาลูกค้า (เบอร์ หรือ ชื่อ)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                inputMode="tel"
                placeholder="พิมพ์เบอร์ หรือ ชื่อลูกค้า"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setOpen(false);
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (matches[0]) selectCustomer(matches[0]);
                    else if (canCreate) startNew();
                  }
                }}
              />
              {open && q.length > 0 && (matches.length > 0 || canCreate) && (
                <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-xl border border-border bg-card py-1 shadow-lg">
                  {matches.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-2 px-2"
                    >
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectCustomer(c)}
                        className="flex-1 rounded-lg px-2 py-2 text-left hover:bg-muted-surface"
                      >
                        <span className="block text-sm text-foreground">
                          {c.name || c.phone}
                        </span>
                        {c.name && (
                          <span className="block text-xs text-muted">{c.phone}</span>
                        )}
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => quickAdd(c)}
                        disabled={pending || !typeId}
                        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-500 px-3 py-1.5 text-sm font-medium text-on-brand transition hover:bg-brand-600 disabled:opacity-60"
                        title="เพิ่ม 1 แสตมป์ทันที"
                      >
                        <Plus className="size-4" />1
                      </button>
                    </li>
                  ))}
                  {canCreate && (
                    <li>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={startNew}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-brand-700 hover:bg-muted-surface"
                      >
                        <UserPlus className="size-4" />
                        เพิ่มลูกค้าใหม่: {digits}
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </div>
            <Button
              variant="accent"
              onClick={() => setScanOpen(true)}
              disabled={pending}
              title="สแกน QR ส่วนตัวลูกค้า"
            >
              <Camera className="size-4" />
              สแกน
            </Button>
          </div>
          {open && q.length > 0 && matches.length === 0 && !canCreate && (
            <p className="text-xs text-muted">
              ไม่พบลูกค้า — พิมพ์เบอร์ให้ครบเพื่อเพิ่มลูกค้าใหม่
            </p>
          )}
        </div>
      </Card>

      {/* Selected-customer panel: card + add/redeem */}
      {phone && (
        <Card className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-foreground">{name || phone}</p>
              {name && <p className="text-xs text-muted">{phone}</p>}
              {isNew && (
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-brand-600">
                  <Sparkles className="size-3.5" /> ลูกค้าใหม่ — กด «เพิ่มแสตมป์» เพื่อสร้างบัตร
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-foreground"
            >
              <X className="size-3.5" />
              เปลี่ยน
            </button>
          </div>

          {isNew && (
            <Input
              placeholder="ชื่อลูกค้า (ไม่บังคับ)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}

          {view && <CardBalance view={view} />}

          {/* Quantity stepper + primary add */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center rounded-full border border-border">
              <button
                type="button"
                onClick={() => setQuantity((n) => Math.max(1, n - 1))}
                disabled={pending || quantity <= 1}
                className="flex size-9 items-center justify-center text-muted hover:text-foreground disabled:opacity-40"
                aria-label="ลดจำนวน"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center text-sm font-medium text-foreground">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((n) => Math.min(50, n + 1))}
                disabled={pending || quantity >= 50}
                className="flex size-9 items-center justify-center text-muted hover:text-foreground disabled:opacity-40"
                aria-label="เพิ่มจำนวน"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <Button
              fullWidth
              onClick={addStamps}
              loading={pending}
              disabled={!typeId}
            >
              <Plus className="size-4" /> เพิ่ม {quantity} แสตมป์
            </Button>
          </div>

          {redeemable.map((p) => (
            <Button
              key={p.type.id}
              variant="accent"
              fullWidth
              onClick={() => redeem(p.type.id)}
              disabled={pending}
            >
              <Gift className="size-4" />
              แลกรางวัล: {p.type.name} (ใช้ {p.type.threshold} ดวง)
            </Button>
          ))}

          {view && (
            <Button variant="outline" fullWidth onClick={openBind} disabled={pending}>
              <Smartphone className="size-4" />
              ออก QR ผูกบัตร (ให้ลูกค้าสแกนดูแต้มเอง)
            </Button>
          )}
        </Card>
      )}

      {!phone && (
        <EmptyState
          icon={<Sparkles />}
          title="เริ่มแจกแสตมป์"
          description="พิมพ์เบอร์/ชื่อแล้วแตะ «+1» ที่รายชื่อ หรือสแกน QR ของลูกค้า"
        />
      )}

      <QrScanModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onResult={handleScan}
      />

      <Modal
        open={bindImg !== null || bindError !== null}
        onClose={() => {
          setBindImg(null);
          setBindError(null);
        }}
        title="QR ผูกบัตรลูกค้า"
      >
        {bindError ? (
          <p className="text-sm text-error">{bindError}</p>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {bindImg && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bindImg}
                alt="QR ผูกบัตร"
                width={224}
                height={224}
                className="h-56 w-56 object-contain"
              />
            )}
            <p className="text-center text-sm text-muted">
              ให้ลูกค้าสแกนด้วยกล้องมือถือภายใน 5 นาที เพื่อผูกบัตรกับเครื่องตัวเอง
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
