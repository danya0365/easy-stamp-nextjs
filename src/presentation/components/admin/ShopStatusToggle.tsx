"use client";

import { useTransition } from "react";

import { setShopStatusAction } from "@/src/presentation/actions/admin-actions";
import { Button } from "@/src/presentation/components/ui/Button";

export function ShopStatusToggle({
  shopId,
  adminSuspended,
}: {
  shopId: string;
  adminSuspended: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <Button
      size="sm"
      variant={adminSuspended ? "outline" : "danger"}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await setShopStatusAction(
            shopId,
            adminSuspended ? "active" : "suspended_by_admin",
          );
        })
      }
    >
      {adminSuspended ? "เปิดใช้งาน" : "ระงับร้าน"}
    </Button>
  );
}
