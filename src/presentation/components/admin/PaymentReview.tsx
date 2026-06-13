"use client";

import { useState, useTransition } from "react";

import { verifyPaymentAction } from "@/src/presentation/actions/admin-actions";
import { Button } from "@/src/presentation/components/ui/Button";
import { Input } from "@/src/presentation/components/ui/Input";

export function PaymentReview({ paymentId }: { paymentId: string }) {
  const [pending, start] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  function approve() {
    start(async () => {
      await verifyPaymentAction(paymentId, "approve");
    });
  }

  function reject() {
    start(async () => {
      await verifyPaymentAction(paymentId, "reject", reason || "สลิปไม่ถูกต้อง");
      setRejecting(false);
      setReason("");
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <Button size="sm" onClick={approve} disabled={pending}>
          อนุมัติ
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setRejecting((v) => !v)}
          disabled={pending}
        >
          ปฏิเสธ
        </Button>
      </div>
      {rejecting && (
        <div className="flex gap-2">
          <Input
            placeholder="เหตุผล"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button size="sm" variant="danger" onClick={reject} disabled={pending}>
            ยืนยันปฏิเสธ
          </Button>
        </div>
      )}
    </div>
  );
}
