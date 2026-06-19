"use client";

import { useActionState } from "react";
import { ImagePlus } from "lucide-react";

import {
  uploadLeadPhotoAction,
  type LeadFormState,
} from "@/src/presentation/actions/lead-actions";
import { Button } from "@/src/presentation/components/ui/Button";

export function LeadPhotoUpload({
  leadId,
  hasPhoto,
}: {
  leadId: string;
  hasPhoto: boolean;
}) {
  const [state, action, pending] = useActionState<LeadFormState, FormData>(
    uploadLeadPhotoAction,
    {},
  );

  return (
    <div className="flex flex-col gap-3">
      {hasPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/lead-photos/${leadId}`}
          alt="รูปร้าน"
          className="max-h-64 w-full rounded-lg border border-border object-cover"
        />
      ) : (
        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted">
          <ImagePlus className="mr-2 size-4" />
          ยังไม่มีรูปร้าน
        </div>
      )}

      <form action={action} className="flex flex-col gap-2">
        <input type="hidden" name="leadId" value={leadId} />
        <input
          type="file"
          name="photo"
          accept="image/png,image/jpeg,image/webp,image/heic"
          required
          className="text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700"
        />
        {state.error && <p className="text-sm text-error">{state.error}</p>}
        {state.success && (
          <p className="text-sm text-success">{state.success}</p>
        )}
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "กำลังอัปโหลด…" : hasPhoto ? "เปลี่ยนรูป" : "อัปโหลดรูป"}
        </Button>
      </form>
    </div>
  );
}
