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
export function PauseShopControl({
  paused,
  daysUntilDue,
  frozenDaysSoFar = 0,
  pausesUsed = 0,
  pauseCap = 8,
  cooldownRemainingSec = 0,
}: {
  paused: boolean;
  /** Usable days left (active state). */
  daysUntilDue?: number;
  /** Whole days closed so far → what reopening now refunds. */
  frozenDaysSoFar?: number;
  /** Closures used in the current 30-day window. */
  pausesUsed?: number;
  /** Max closures per window. */
  pauseCap?: number;
  /** Seconds until the shop may pause again (0 = none). */
  cooldownRemainingSec?: number;
}) {
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
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <p>ร้านกำลังปิดชั่วคราว — ระบบหยุดนับวันใช้งานไว้</p>
          <p className="mt-1 font-medium">
            {frozenDaysSoFar >= 1
              ? `ปิดมาแล้ว ${frozenDaysSoFar} วัน ระบบไม่หักวันช่วงนี้ · เปิดแล้ววันคงเหลือยังเท่าเดิม${
                  typeof daysUntilDue === "number" ? ` (${daysUntilDue} วัน)` : ""
                }`
              : "ยังปิดไม่ครบ 1 วัน — ช่วงสั้นกว่า 1 วันยังนับเป็นวันใช้งานตามปกติ (ปิดให้ครบวันถึงจะหยุดนับ)"}
          </p>
        </div>
        <Button loading={pending} onClick={resume}>
          {pending ? "กำลังเปิด…" : "เปิดร้านอีกครั้ง"}
        </Button>
      </div>
    );
  }

  const cooldownHrs = Math.ceil(cooldownRemainingSec / 3600);
  const capReached = pausesUsed >= pauseCap;
  const blocked = cooldownRemainingSec > 0 || capReached;
  const blockNote = capReached
    ? `เดือนนี้ปิดครบ ${pauseCap} ครั้งแล้ว หากจำเป็นโปรดติดต่อผู้ดูแล`
    : cooldownRemainingSec > 0
      ? `เพิ่งปิด/เปิดร้านไปไม่นาน — ปิดได้อีกครั้งในอีกประมาณ ${cooldownHrs} ชม.`
      : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 text-sm text-muted">
        <p>ปิดร้านชั่วคราวเมื่อไม่เปิดให้บริการ (วันหยุดยาว/ปรับปรุงร้าน)</p>
        {typeof daysUntilDue === "number" && (
          <p className="font-medium text-foreground">
            เหลือ {daysUntilDue} วันใช้งาน · เดือนนี้ปิดไปแล้ว {pausesUsed}/
            {pauseCap} ครั้ง
          </p>
        )}
        <ul className="flex list-disc flex-col gap-1 pl-5">
          <li>
            หยุดนับ<strong>เฉพาะวันเต็มที่ปิด</strong> — ปิดสั้นกว่า 1
            วันจะไม่ได้วันคืน
          </li>
          <li>
            ปิดได้ไม่เกิน <strong>{pauseCap} ครั้ง/เดือน</strong>
          </li>
          <li>
            เว้นอย่างน้อย <strong>24 ชม.</strong> ระหว่างการปิดแต่ละครั้ง
          </li>
          <li>ระหว่างปิด กดแสตมป์/แลกรางวัลไม่ได้ และร้านถูกซ่อนจากแผนที่</li>
        </ul>
      </div>

      {blockNote && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {blockNote}
        </p>
      )}

      <Button
        variant="outline"
        loading={pending}
        disabled={blocked}
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
