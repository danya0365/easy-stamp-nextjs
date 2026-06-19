import type {
  LeadLostReason,
  LeadStatus,
  LeadVisitReaction,
} from "@/src/domain/entities";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "brand";

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: "ใหม่",
  visited: "เข้าพบแล้ว",
  interested: "สนใจ",
  won: "ปิดการขายได้",
  lost: "ไม่สำเร็จ",
};

export const LEAD_STATUS_TONE: Record<LeadStatus, BadgeTone> = {
  new: "neutral",
  visited: "brand",
  interested: "warning",
  won: "success",
  lost: "danger",
};

/** Hex fill for the map marker, by status. */
export const LEAD_STATUS_PIN: Record<LeadStatus, string> = {
  new: "#94a3b8",
  visited: "#3b82f6",
  interested: "#f59e0b",
  won: "#22c55e",
  lost: "#ef4444",
};

export const LEAD_STATUS_ORDER: LeadStatus[] = [
  "new",
  "visited",
  "interested",
  "won",
  "lost",
];

export const LEAD_LOST_REASON_LABEL: Record<LeadLostReason, string> = {
  not_interested: "ไม่สนใจ",
  too_expensive: "ราคาสูงไป",
  no_smartphone: "ไม่สะดวกใช้แอป",
  closed_business: "ปิดกิจการ/ย้าย",
  competitor: "ใช้เจ้าอื่นอยู่",
  other: "อื่นๆ",
};

export const LEAD_LOST_REASON_ORDER: LeadLostReason[] = [
  "not_interested",
  "too_expensive",
  "no_smartphone",
  "closed_business",
  "competitor",
  "other",
];

export const LEAD_REACTION_LABEL: Record<LeadVisitReaction, string> = {
  positive: "ตอบรับดี",
  neutral: "เฉยๆ",
  negative: "ปฏิเสธ",
  no_answer: "ไม่อยู่/ไม่ได้คุย",
};

export const LEAD_REACTION_ORDER: LeadVisitReaction[] = [
  "positive",
  "neutral",
  "negative",
  "no_answer",
];
