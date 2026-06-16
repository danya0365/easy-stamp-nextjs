"use client";

import { useState } from "react";

import { Modal } from "@/src/presentation/components/ui/Modal";
import { PublicContactForm } from "./PublicContactForm";

/**
 * Trigger that opens the public contact-admin form in a modal. Renders as a
 * subtle text link by default; pass `className` to restyle.
 */
export function PublicContactButton({
  label = "ติดต่อผู้ดูแล",
  className = "text-sm text-brand-700 hover:underline",
}: {
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="ติดต่อผู้ดูแล">
        <PublicContactForm onCancel={() => setOpen(false)} />
      </Modal>
    </>
  );
}
