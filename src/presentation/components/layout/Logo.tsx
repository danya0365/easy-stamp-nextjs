/* eslint-disable @next/next/no-img-element */

/**
 * Brand logo. `mark` = the square stamp-card mark (compact, for headers/tiles);
 * `wordmark` = the horizontal "Easy Stamp" lockup (for the login/hero). The
 * source images have an opaque light background, so callers place them on a
 * light/rounded tile to look intentional in dark mode.
 */
export function Logo({
  variant = "mark",
  className,
  alt = "Easy Stamp",
}: {
  variant?: "mark" | "wordmark";
  className?: string;
  alt?: string;
}) {
  const src =
    variant === "wordmark" ? "/icons/logo-wordmark.png" : "/icons/logo-mark.png";
  return <img src={src} alt={alt} className={className} />;
}
