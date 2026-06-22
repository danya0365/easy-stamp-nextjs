"use client";

import { useTransition } from "react";

import {
  pauseMyShopAction,
  resumeMyShopAction,
} from "@/src/presentation/actions/shop-actions";
import { Button } from "@/src/presentation/components/ui/Button";
import { useConfirm } from "@/src/presentation/components/ui/ConfirmDialog";

/** Owner toggle to temporarily close / reopen the shop (freezes billing days). */
export function PauseShopControl({ paused }: { paused: boolean }) {
  const [pending, start] = useTransition();
  const confirm = useConfirm();

  if (paused) {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          ร้านกำลังปิดชั่วคราว — วันใช้งานถูกหยุดไว้ ไม่ถูกหักจนกว่าจะเปิดอีกครั้ง
        </p>
        <Button
          loading={pending}
          onClick={() => start(async () => void (await resumeMyShopAction()))}
        >
          {pending ? "กำลังเปิด…" : "เปิดร้านอีกครั้ง"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        ปิดร้านชั่วคราวเมื่อไม่เปิดให้บริการ (วันหยุดยาว/ปรับปรุงร้าน) — ระบบจะ
        <strong>หยุดนับวันใช้งาน</strong> วันที่เหลือจะไม่ถูกหัก
        ระหว่างปิดจะกดแสตมป์/แลกรางวัลไม่ได้ และร้านจะไม่แสดงบนแผนที่
      </p>
      <Button
        variant="outline"
        loading={pending}
        onClick={async () => {
          const ok = await confirm({
            title: "ปิดร้านชั่วคราว?",
            message:
              "พนักงานจะกดแสตมป์/แลกรางวัลไม่ได้ และร้านจะถูกซ่อนจากแผนที่ จนกว่าจะเปิดอีกครั้ง",
            confirmLabel: "ปิดร้านชั่วคราว",
            tone: "danger",
          });
          if (ok) start(async () => void (await pauseMyShopAction()));
        }}
      >
        {pending ? "กำลังปิด…" : "ปิดร้านชั่วคราว"}
      </Button>
    </div>
  );
}
