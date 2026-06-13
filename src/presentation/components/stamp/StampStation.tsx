"use client";

import { useCallback, useState, useTransition } from "react";

import {
  addStampsAction,
  lookupCardAction,
  lookupByCodeAction,
  redeemRewardAction,
  generateBindCodeAction,
  type StampActionState,
} from "@/src/presentation/actions/stamp-actions";
import { extractCustomerCode } from "@/src/presentation/lib/scan";
import { Card } from "@/src/presentation/components/ui/Card";
import { Input } from "@/src/presentation/components/ui/Input";
import { Button } from "@/src/presentation/components/ui/Button";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { Spinner } from "@/src/presentation/components/ui/Spinner";
import { Modal } from "@/src/presentation/components/ui/Modal";
import { CardBalance } from "@/src/presentation/components/stamp/CardBalance";
import { QrScanModal } from "@/src/presentation/components/stamp/QrScanModal";

type Action = (s: StampActionState, fd: FormData) => Promise<StampActionState>;

export function StampStation() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [result, setResult] = useState<StampActionState | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [bindImg, setBindImg] = useState<string | null>(null);
  const [bindError, setBindError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: Action) {
    const fd = new FormData();
    fd.set("phone", phone);
    fd.set("quantity", quantity);
    fd.set("displayName", name);
    startTransition(async () => {
      const next = await action(result ?? {}, fd);
      setResult(next);
      if (next.phone) setPhone(next.phone);
    });
  }

  // Resolve a scanned personal QR → customer (fills phone for add/redeem).
  const handleScan = useCallback((scanned: string) => {
    setScanOpen(false);
    const fd = new FormData();
    fd.set("code", extractCustomerCode(scanned));
    startTransition(async () => {
      const next = await lookupByCodeAction({}, fd);
      setResult(next);
      if (next.phone) setPhone(next.phone);
    });
  }, []);

  function openBind() {
    setBindError(null);
    setBindImg(null);
    startTransition(async () => {
      const res = await generateBindCodeAction(phone);
      if (res.error) setBindError(res.error);
      else setBindImg(res.imageUrl ?? null);
    });
  }

  const view = result?.view;
  const eligible = view?.eligibleToRedeem ?? false;

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
              📷 สแกน
            </Button>
          </div>

          <Input
            placeholder="ชื่อลูกค้า (ไม่บังคับ)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="text-xs text-muted">
            🔒 เก็บเบอร์และชื่อเพื่อใช้ในระบบสะสมแต้มเท่านั้น
          </p>

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
              disabled={pending || !phone}
            >
              {pending ? <Spinner /> : "➕"} เพิ่มแสตมป์
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
              {eligible && (
                <Button
                  variant="accent"
                  fullWidth
                  onClick={() => run(redeemRewardAction)}
                  disabled={pending}
                >
                  🎁 แลกรางวัล (ใช้ {view.threshold} ดวง)
                </Button>
              )}
              <Button
                variant="outline"
                fullWidth
                onClick={openBind}
                disabled={pending}
              >
                📲 ออก QR ผูกบัตร (ให้ลูกค้าสแกนดูแต้มเอง)
              </Button>
            </div>
          </Card>
        ) : (
          !result.error && (
            <EmptyState
              icon="🆕"
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
