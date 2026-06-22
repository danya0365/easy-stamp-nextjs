"use client";

import { useState } from "react";

import {
  buildTemplateCopy,
  getPosterSize,
  type PromoCopyContext,
  type PromoGoal,
  type PosterSize,
} from "@/src/domain/services/promo-poster";
import { cn } from "@/src/presentation/components/ui/cn";
import { TabSelect } from "@/src/presentation/components/ui/TabSelect";
import { PromoGoalSelector } from "./PromoGoalSelector";
import { PosterSizeSwitcher } from "./PosterSizeSwitcher";
import { TemplatePosterPanel } from "./TemplatePosterPanel";
import { AiPromptPanel } from "./AiPromptPanel";
import { UploadBgPanel } from "./UploadBgPanel";
import type { PromoPath, PromoSeedData } from "./types";

const PATHS: { id: PromoPath; label: string }[] = [
  { id: "template", label: "เทมเพลตสำเร็จรูป" },
  { id: "ai_prompt", label: "พรอมต์ AI" },
  { id: "upload", label: "อัปรูป AI" },
];

/** Client orchestrator for the 3 promo paths; shares goal/size/reward state. */
export function PromoStudio({ seed }: { seed: PromoSeedData }) {
  const [goal, setGoal] = useState<PromoGoal>("new_customer");
  const [sizeId, setSizeId] = useState<PosterSize>("ig_square");
  const [rewardIdx, setRewardIdx] = useState(0);
  const [path, setPath] = useState<PromoPath>("template");
  // Lifted so the uploaded background survives switching path tabs.
  const [uploadBg, setUploadBg] = useState<string | null>(null);

  const size = getPosterSize(sizeId);
  const reward = seed.rewardOptions[rewardIdx] ?? seed.rewardOptions[0];
  const ctx: PromoCopyContext = {
    shopName: seed.shopName,
    rewardText: reward.rewardText,
    stampThreshold: reward.threshold,
  };
  const copy = buildTemplateCopy(goal, ctx);

  return (
    <div className="flex flex-col gap-5">
      <PromoGoalSelector value={goal} onChange={setGoal} />

      {seed.rewardOptions.length > 1 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">รางวัลที่จะโชว์</p>
          <div className="flex flex-wrap gap-2">
            {seed.rewardOptions.map((opt, i) => {
              const active = i === rewardIdx;
              return (
                <button
                  key={opt.id ?? "default"}
                  type="button"
                  onClick={() => setRewardIdx(i)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition",
                    active
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-border text-muted hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <PosterSizeSwitcher value={sizeId} onChange={setSizeId} />

      {/* Path tabs — dropdown on phones, pill toggle on sm+. */}
      <div className="sm:hidden">
        <TabSelect
          ariaLabel="วิธีสร้างโปสเตอร์"
          options={PATHS}
          value={path}
          onChange={(id) => setPath(id as PromoPath)}
        />
      </div>
      <div className="hidden gap-1 rounded-full bg-muted-surface p-1 sm:flex">
        {PATHS.map((p) => {
          const active = p.id === path;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPath(p.id)}
              aria-pressed={active}
              className={cn(
                "flex-1 rounded-full px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-card text-brand-700 shadow-sm"
                  : "text-muted hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="border-t border-border pt-5">
        {path === "template" && (
          <TemplatePosterPanel size={size} copy={copy} seed={seed} />
        )}
        {path === "ai_prompt" && (
          <AiPromptPanel key={goal} goal={goal} size={sizeId} ctx={ctx} />
        )}
        {path === "upload" && (
          <UploadBgPanel
            size={size}
            copy={copy}
            seed={seed}
            bgDataUrl={uploadBg}
            onBgChange={setUploadBg}
          />
        )}
      </div>
    </div>
  );
}
