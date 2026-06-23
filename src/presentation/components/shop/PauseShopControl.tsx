"use client";

import { useTransition } from "react";

import {
  pauseMyShopAction,
  resumeMyShopAction,
} from "@/src/presentation/actions/shop-actions";
import { Button } from "@/src/presentation/components/ui/Button";
import { useConfirm } from "@/src/presentation/components/ui/ConfirmDialog";
import { useToast } from "@/src/presentation/components/ui/Toast";

/** Owner toggle to temporarily close / reopen the shop (freezes billing days). */
export function PauseShopControl({ paused }: { paused: boolean }) {
  const [pending, start] = useTransition();
  const confirm = useConfirm();
  const toast = useToast();

  function resume() {
    start(async () => {
      const res = await resumeMyShopAction();
      if (res.error) toast.error(res.error);
      else toast.success("เปิดร้านอีกครั้งแล้ว");
    });
  }

  if (paused) {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          ร้านกำลังปิดชั่วคราว — วันใช้งานถูกหยุดไว้ และจะคืนให้
          <strong>เป็นจำนวนวันเต็ม</strong>ที่ปิด เมื่อกดเปิดอีกครั้ง
        </p>
        <Button loading={pending} onClick={resume}>
          {pending ? "กำลังเปิด…" : "เปิดร้านอีกครั้ง"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        ปิดร้านชั่วคราวเมื่อไม่เปิดให้บริการ (วันหยุดยาว/ปรับปรุงร้าน) — ระบบจะ
        <strong>หยุดนับเฉพาะวันเต็มที่ปิด</strong> (ปิดสั้นกว่า 1 วันจะไม่ได้วันคืน)
        · ปิดได้ไม่เกิน <strong>8 ครั้ง/เดือน</strong> และเว้นอย่างน้อย{" "}
        <strong>24 ชม.</strong> ระหว่างการปิดแต่ละครั้ง ·
        ระหว่างปิดจะกดแสตมป์/แลกรางวัลไม่ได้ และร้านจะไม่แสดงบนแผนที่
      </p>
      <Button
        variant="outline"
        loading={pending}
        onClick={async () => {
          const ok = await confirm({
            title: "ปิดร้านชั่วคราว?",
            message:
              "ระบบหยุดนับเฉพาะ ‘วันเต็ม’ ที่ปิด (ปิดสั้นกว่า 1 วันไม่ได้วันคืน) · ปิดได้ไม่เกิน 8 ครั้ง/เดือน เว้นอย่างน้อย 24 ชม. · ระหว่างปิด พนักงานจะกดแสตมป์/แลกรางวัลไม่ได้ และร้านจะถูกซ่อนจากแผนที่ จนกว่าจะเปิดอีกครั้ง",
            confirmLabel: "ปิดร้านชั่วคราว",
            tone: "danger",
          });
          if (!ok) return;
          start(async () => {
            const res = await pauseMyShopAction();
            if (res.error) toast.error(res.error);
            else toast.success("ปิดร้านชั่วคราวแล้ว");
          });
        }}
      >
        {pending ? "กำลังปิด…" : "ปิดร้านชั่วคราว"}
      </Button>
    </div>
  );
}
