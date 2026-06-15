"use client";

import { useActionState, useTransition } from "react";
import { Plus } from "lucide-react";

import type { StampType } from "@/src/domain/entities";
import {
  createStampTypeAction,
  updateStampTypeAction,
  toggleStampTypeAction,
  type FormState,
} from "@/src/presentation/actions/shop-actions";
import { Button } from "@/src/presentation/components/ui/Button";
import { Input } from "@/src/presentation/components/ui/Input";
import { Badge } from "@/src/presentation/components/ui/Badge";

const numberCls =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

function bahtValue(priceSatang: number | null): string {
  return priceSatang != null ? String(priceSatang / 100) : "";
}

function TypeRow({ type }: { type: StampType }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateStampTypeAction,
    {},
  );
  const [toggling, startToggle] = useTransition();

  return (
    <li className="py-4">
      <form action={action} className="flex flex-col gap-2">
        <input type="hidden" name="typeId" value={type.id} />
        <div className="flex items-center gap-2">
          <Input
            name="name"
            defaultValue={type.name}
            maxLength={40}
            required
            className="flex-1"
          />
          {type.isDefault && <Badge tone="brand">เริ่มต้น</Badge>}
          {!type.isActive && <Badge tone="neutral">ปิดอยู่</Badge>}
        </div>
        <div className="flex gap-2">
          <label className="flex-1 text-xs text-muted">
            จำนวนครบ
            <input
              name="threshold"
              type="number"
              min={1}
              max={100}
              defaultValue={type.threshold}
              className={numberCls}
            />
          </label>
          <label className="flex-1 text-xs text-muted">
            ราคา/บาท (ไม่บังคับ)
            <input
              name="priceBaht"
              type="number"
              min={0}
              step="1"
              defaultValue={bahtValue(type.priceSatang)}
              placeholder="—"
              className={numberCls}
            />
          </label>
        </div>
        <Input
          name="rewardText"
          defaultValue={type.rewardText}
          placeholder="ของรางวัล เช่น เครื่องดื่มฟรี 1 แก้ว"
          maxLength={200}
        />
        {state.error && <p className="text-sm text-error">{state.error}</p>}
        {state.success && <p className="text-sm text-success">{state.success}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            บันทึก
          </Button>
          {!type.isDefault && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={toggling}
              onClick={() =>
                startToggle(async () => {
                  await toggleStampTypeAction(type.id, !type.isActive);
                })
              }
            >
              {type.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
            </Button>
          )}
        </div>
      </form>
    </li>
  );
}

function AddTypeForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createStampTypeAction,
    {},
  );
  return (
    <form action={action} className="flex flex-col gap-2 pt-4">
      <p className="text-sm font-medium text-foreground">เพิ่มประเภทใหม่</p>
      <Input name="name" placeholder="ชื่อประเภท เช่น แสตมป์ 20฿" maxLength={40} required />
      <div className="flex gap-2">
        <label className="flex-1 text-xs text-muted">
          จำนวนครบ
          <input
            name="threshold"
            type="number"
            min={1}
            max={100}
            defaultValue={10}
            className={numberCls}
          />
        </label>
        <label className="flex-1 text-xs text-muted">
          ราคา/บาท (ไม่บังคับ)
          <input
            name="priceBaht"
            type="number"
            min={0}
            step="1"
            placeholder="—"
            className={numberCls}
          />
        </label>
      </div>
      <Input
        name="rewardText"
        placeholder="ของรางวัล เช่น เครื่องดื่มฟรี 1 แก้ว"
        maxLength={200}
      />
      {state.error && <p className="text-sm text-error">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        <Plus size={16} />
        เพิ่มประเภท
      </Button>
    </form>
  );
}

export function StampTypesManager({ types }: { types: StampType[] }) {
  return (
    <div className="flex flex-col">
      <ul className="flex flex-col divide-y divide-border">
        {types.map((t) => (
          <TypeRow key={t.id} type={t} />
        ))}
      </ul>
      <div className="border-t border-border">
        <AddTypeForm />
      </div>
    </div>
  );
}
