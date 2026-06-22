"use client";

import { useTransition } from "react";

import { setShopStatusAction } from "@/src/presentation/actions/admin-actions";
import { Button } from "@/src/presentation/components/ui/Button";
import { useConfirm } from "@/src/presentation/components/ui/ConfirmDialog";

export function ShopStatusToggle({
  shopId,
  adminSuspended,
}: {
  shopId: string;
  adminSuspended: boolean;
}) {
  const [pending, start] = useTransition();
  const confirm = useConfirm();

  function apply() {
    start(async () => {
      await setShopStatusAction(
        shopId,
        adminSuspended ? "active" : "suspended_by_admin",
      );
    });
  }

  async function onClick() {
    // Reactivation is safe; only confirm the destructive suspend direction.
    if (adminSuspended) return apply();
    const ok = await confirm({
      title: "ระงับร้านนี้?",
      message: "เจ้าของร้านจะใช้งานระบบไม่ได้จนกว่าจะเปิดใช้งานอีกครั้ง",
      confirmLabel: "ระงับร้าน",
      tone: "danger",
    });
    if (ok) apply();
  }

  return (
    <Button
      size="sm"
      variant={adminSuspended ? "outline" : "danger"}
      loading={pending}
      onClick={onClick}
    >
      {adminSuspended ? "เปิดใช้งาน" : "ระงับร้าน"}
    </Button>
  );
}
