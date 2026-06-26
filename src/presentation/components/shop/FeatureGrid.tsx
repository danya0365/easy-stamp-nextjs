import Link from "next/link";
import {
  BarChart3,
  Bell,
  Building2,
  CreditCard,
  History,
  MessageCircle,
  PauseCircle,
  QrCode,
  Stamp,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Card, CardHeader } from "@/src/presentation/components/ui/Card";

type Feature = {
  id: string;
  icon: LucideIcon;
  label: string;
  description: string;
  href: string;
};

export async function FeatureGrid() {
  const t = await getTranslations("shop");
  /** Full catalog of shop features — always visible so nothing is buried in the
   * bottom-bar "more" overflow. Each tile links straight to the feature. */
  const FEATURES: Feature[] = [
    { id: "stamps", icon: Stamp, label: t("featStampsLabel"), description: t("featStampsDesc"), href: "/shop/stamps" },
    { id: "customers", icon: Users, label: t("featCustomersLabel"), description: t("featCustomersDesc"), href: "/shop/customers" },
    { id: "analytics", icon: BarChart3, label: t("featAnalyticsLabel"), description: t("featAnalyticsDesc"), href: "/shop/analytics" },
    { id: "qr", icon: QrCode, label: t("featQrLabel"), description: t("featQrDesc"), href: "/shop/qr" },
    { id: "branches", icon: Building2, label: t("featBranchesLabel"), description: t("featBranchesDesc"), href: "/shop/branches" },
    { id: "staff", icon: UserCog, label: t("featStaffLabel"), description: t("featStaffDesc"), href: "/shop/staff" },
    { id: "pause", icon: PauseCircle, label: t("featPauseLabel"), description: t("featPauseDesc"), href: "/shop/settings" },
    { id: "line", icon: MessageCircle, label: t("featLineLabel"), description: t("featLineDesc"), href: "/shop/settings" },
    { id: "billing", icon: CreditCard, label: t("featBillingLabel"), description: t("featBillingDesc"), href: "/shop/billing" },
    { id: "notifications", icon: Bell, label: t("featNotificationsLabel"), description: t("featNotificationsDesc"), href: "/shop/notifications" },
    { id: "redemptions", icon: History, label: t("featRedemptionsLabel"), description: t("featRedemptionsDesc"), href: "/shop/redemptions" },
  ];

  return (
    <Card>
      <CardHeader
        title={t("featuresTitle")}
        subtitle={t("featuresSubtitle")}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <Link
              key={f.id}
              href={f.href}
              className="group flex flex-col gap-2 rounded-xl p-3 ring-1 ring-border transition hover:ring-brand-300 hover:bg-brand-50/50"
            >
              <span className="grid size-9 place-items-center rounded-lg bg-brand-100 text-brand-700">
                <Icon className="size-5" />
              </span>
              <span className="block text-sm font-medium text-foreground">
                {f.label}
              </span>
              <span className="block text-xs text-muted">{f.description}</span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
