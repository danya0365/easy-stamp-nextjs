"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, MessageCircle } from "lucide-react";

import {
  generateLineLinkCodeAction,
  unlinkLineAction,
} from "@/src/presentation/actions/line-actions";
import { Button } from "@/src/presentation/components/ui/Button";

/**
 * LINE account linking widget. Generates a one-time code the operator sends to
 * the OA chat; the webhook then binds their lineUserId so they get LINE pushes.
 */
export function LineLinkCard({
  linked,
  addUrl,
}: {
  linked: boolean;
  addUrl?: string;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (linked) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-sm text-success">
          <CheckCircle2 size={16} />
          เชื่อมต่อ LINE แล้ว
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => start(async () => void (await unlinkLineAction()))}
        >
          ยกเลิกการเชื่อมต่อ
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {!addUrl && (
        <p className="text-xs text-warning">
          * ระบบยังไม่ได้ตั้งค่า LINE OA — เชื่อมต่อได้เมื่อผู้ดูแลตั้งค่าเสร็จ
        </p>
      )}
      {!code ? (
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await generateLineLinkCodeAction();
              setCode(r.code);
            })
          }
        >
          <MessageCircle size={16} />
          สร้างโค้ดเชื่อมต่อ LINE
        </Button>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl bg-muted-surface p-4 text-sm">
          <p className="font-medium text-foreground">วิธีเชื่อมต่อ</p>
          <ol className="list-decimal space-y-1 pl-5 text-muted">
            <li>
              {addUrl ? (
                <>
                  เพิ่มเพื่อน LINE OA:{" "}
                  <a
                    className="text-brand-700 underline"
                    href={addUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    กดเพิ่มเพื่อน
                  </a>
                </>
              ) : (
                "เพิ่มเพื่อน LINE OA ของระบบ"
              )}
            </li>
            <li>พิมพ์โค้ดนี้ส่งในแชท:</li>
          </ol>
          <p className="select-all rounded-lg bg-card px-3 py-2 text-center text-lg font-bold tracking-widest text-brand-700">
            {code}
          </p>
          <p className="text-xs text-muted">
            เมื่อส่งโค้ดแล้วระบบจะตอบกลับว่าเชื่อมต่อสำเร็จ จากนั้นรีเฟรชหน้านี้
          </p>
        </div>
      )}
    </div>
  );
}
