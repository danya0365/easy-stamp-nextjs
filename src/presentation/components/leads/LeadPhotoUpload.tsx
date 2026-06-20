"use client";

import { useActionState, useState } from "react";
import { ImagePlus } from "lucide-react";

import {
  uploadLeadPhotoAction,
  type LeadFormState,
} from "@/src/presentation/actions/lead-actions";
import { Button } from "@/src/presentation/components/ui/Button";
import { ImageCropField } from "@/src/presentation/components/ui/ImageCropField";

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
  const [ready, setReady] = useState(false);

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
        <ImageCropField
          name="photo"
          aspect={null}
          label={hasPhoto ? "เลือกรูปใหม่" : "เลือกรูปร้าน"}
          onReadyChange={setReady}
        />
        {state.error && <p className="text-sm text-error">{state.error}</p>}
        {state.success && (
          <p className="text-sm text-success">{state.success}</p>
        )}
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={pending || !ready}
        >
          {pending ? "กำลังอัปโหลด…" : hasPhoto ? "เปลี่ยนรูป" : "อัปโหลดรูป"}
        </Button>
      </form>
    </div>
  );
}
