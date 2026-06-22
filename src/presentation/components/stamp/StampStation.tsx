"use client";

import { useCallback, useState, useTransition } from "react";
import { Camera, Lock, Plus, Gift, Smartphone, Sparkles } from "lucide-react";

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

type Action = (s: StampActionState, fd: FormData) => Promise<StampActionState>;

export function StampStation({ stampTypes }: { stampTypes: StampType[] }) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [typeId, setTypeId] = useState(stampTypes[0]?.id ?? "");
  const [result, setResult] = useState<StampActionState | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [bindImg, setBindImg] = useState<string | null>(null);
  const [bindError, setBindError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  function notify(next: StampActionState) {
    if (next.success) toast.success(next.success);
    if (next.error) toast.error(next.error);
  }

  function run(action: Action, opts?: { stampTypeId?: string }) {
    const fd = new FormData();
    fd.set("phone", phone);
    fd.set("quantity", quantity);
    fd.set("displayName", name);
    fd.set("stampTypeId", opts?.stampTypeId ?? typeId);
    startTransition(async () => {
      const next = await action(result ?? {}, fd);
      setResult(next);
      notify(next);
      if (next.phone) setPhone(next.phone);
    });
  }

  // Resolve a scanned personal QR → customer (fills phone for add/redeem).
  const handleScan = useCallback(
    (scanned: string) => {
      setScanOpen(false);
      const fd = new FormData();
      fd.set("code", extractCustomerCode(scanned));
      startTransition(async () => {
        const next = await lookupByCodeAction({}, fd);
        setResult(next);
        notify(next);
        if (next.phone) setPhone(next.phone);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  function openBind() {
    setBindError(null);
    setBindImg(null);
    startTransition(async () => {
      const res = await generateBindCodeAction(phone);
      if (res.error) {
        setBindError(res.error);
        toast.error(res.error);
      } else setBindImg(res.imageUrl ?? null);
    });
  }

  const view = result?.view;
  const redeemable = view?.types.filter((t) => t.eligibleToRedeem) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-foreground">
            เบอร์โทรลูกค้า
          </label>
          <div className="flex gap-2">
            <Input
              type="tel"
              inputMode="numeric"
              placeholder="0812345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Button
              variant="outline"
              onClick={() => run(lookupCardAction)}
              disabled={pending || !phone}
            >
              ค้นหา
            </Button>
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

          <Input
            placeholder="ชื่อลูกค้า (ไม่บังคับ)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="inline-flex items-center gap-1 text-xs text-muted">
            <Lock className="size-3.5" />
            เก็บเบอร์และชื่อเพื่อใช้ในระบบสะสมแต้มเท่านั้น
          </p>

          {/* Stamp type picker (shown when the shop has more than one type) */}
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

          <div className="flex items-end gap-2">
            <div className="w-28">
              <label className="text-sm font-medium text-foreground">
                จำนวนแสตมป์
              </label>
              <Input
                type="number"
                min={1}
                max={50}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <Button
              onClick={() => run(addStampsAction)}
              loading={pending}
              disabled={!phone || !typeId}
            >
              <Plus className="size-4" /> เพิ่มแสตมป์
            </Button>
          </div>
        </div>
      </Card>

      {result?.error && (
        <p className="rounded-lg bg-error-surface px-3 py-2 text-sm text-error">
          {result.error}
        </p>
      )}
      {result?.success && (
        <p className="rounded-lg bg-success-surface px-3 py-2 text-sm text-success">
          {result.success}
        </p>
      )}

      {result?.searched &&
        (view ? (
          <Card className="flex flex-col gap-4">
            <CardBalance view={view} />
            <div className="flex flex-col gap-2">
              {redeemable.map((p) => (
                <Button
                  key={p.type.id}
                  variant="accent"
                  fullWidth
                  onClick={() =>
                    run(redeemRewardAction, { stampTypeId: p.type.id })
                  }
                  disabled={pending}
                >
                  <Gift className="size-4" />
                  แลกรางวัล: {p.type.name} (ใช้ {p.type.threshold} ดวง)
                </Button>
              ))}
              <Button
                variant="outline"
                fullWidth
                onClick={openBind}
                disabled={pending}
              >
                <Smartphone className="size-4" />
                ออก QR ผูกบัตร (ให้ลูกค้าสแกนดูแต้มเอง)
              </Button>
            </div>
          </Card>
        ) : (
          !result.error && (
            <EmptyState
              icon={<Sparkles />}
              title="ลูกค้าใหม่ / ยังไม่มีแต้ม"
              description="กด «เพิ่มแสตมป์» เพื่อสร้างบัตรและเพิ่มแต้มแรก"
            />
          )
        ))}

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
