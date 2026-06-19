import type { ReactNode } from "react";
import {
  Clock,
  Gift,
  Globe,
  Link2,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
} from "lucide-react";

import type { Branch, ShopProfile, StampType } from "@/src/domain/entities";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";

function ContactLink({
  href,
  icon,
  label,
  external = true,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="inline-flex items-center gap-1.5 rounded-full bg-muted-surface px-3 py-1.5 text-sm text-foreground transition hover:bg-brand-50 hover:text-brand-700"
    >
      {icon}
      {label}
    </a>
  );
}

/**
 * Owner-managed public shop details for /s/[slug]: about, reward menu, opening
 * hours + contacts, and location with a navigate button. Each card renders only
 * when it has content.
 */
export function ShopDetails({
  profile,
  stampTypes,
  branch,
}: {
  profile: ShopProfile | null;
  stampTypes: StampType[];
  branch: Branch | null;
}) {
  const rewardTypes = stampTypes.filter((t) => t.threshold > 0);
  const hasContacts =
    !!profile &&
    (profile.phone ||
      profile.lineUrl ||
      profile.facebookUrl ||
      profile.instagramUrl ||
      profile.websiteUrl);
  const hasLocation =
    branch && (branch.address || (branch.latitude !== null && branch.longitude !== null));

  return (
    <>
      {profile?.description && (
        <Card>
          <CardHeader title="เกี่ยวกับร้าน" />
          <p className="whitespace-pre-line text-sm text-foreground">
            {profile.description}
          </p>
        </Card>
      )}

      {rewardTypes.length > 0 && (
        <Card>
          <CardHeader title="สะสมแสตมป์รับรางวัล" />
          <ul className="flex flex-col gap-2">
            {rewardTypes.map((t) => (
              <li key={t.id} className="flex items-start gap-2 text-sm">
                <Gift className="mt-0.5 size-4 shrink-0 text-brand-500" />
                <span className="text-foreground">
                  สะสมครบ <strong>{t.threshold}</strong> ดวง รับ{" "}
                  {t.rewardText || t.name}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {(profile?.openingHours || hasContacts) && (
        <Card>
          <CardHeader title="เวลาทำการ & ติดต่อ" />
          {profile?.openingHours && (
            <p className="mb-3 flex items-start gap-2 text-sm text-foreground">
              <Clock className="mt-0.5 size-4 shrink-0 text-muted" />
              <span className="whitespace-pre-line">{profile.openingHours}</span>
            </p>
          )}
          {hasContacts && (
            <div className="flex flex-wrap gap-2">
              {profile?.phone && (
                <ContactLink
                  href={`tel:${profile.phone}`}
                  external={false}
                  icon={<Phone className="size-4" />}
                  label={profile.phone}
                />
              )}
              {profile?.lineUrl && (
                <ContactLink
                  href={profile.lineUrl}
                  icon={<MessageCircle className="size-4" />}
                  label="LINE"
                />
              )}
              {profile?.facebookUrl && (
                <ContactLink
                  href={profile.facebookUrl}
                  icon={<Link2 className="size-4" />}
                  label="Facebook"
                />
              )}
              {profile?.instagramUrl && (
                <ContactLink
                  href={profile.instagramUrl}
                  icon={<Link2 className="size-4" />}
                  label="Instagram"
                />
              )}
              {profile?.websiteUrl && (
                <ContactLink
                  href={profile.websiteUrl}
                  icon={<Globe className="size-4" />}
                  label="เว็บไซต์"
                />
              )}
            </div>
          )}
        </Card>
      )}

      {hasLocation && (
        <Card>
          <CardHeader title="ที่อยู่ร้าน" />
          {branch?.address && (
            <p className="mb-3 flex items-start gap-2 text-sm text-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted" />
              {branch.address}
            </p>
          )}
          {branch?.latitude !== null && branch?.longitude !== null && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${branch?.latitude},${branch?.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-on-brand transition hover:bg-brand-600"
            >
              <Navigation className="size-4" />
              นำทางด้วย Google Maps
            </a>
          )}
        </Card>
      )}
    </>
  );
}
