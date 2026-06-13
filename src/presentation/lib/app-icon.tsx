import { ImageResponse } from "next/og";

/**
 * Render the Easy Stamp app icon (brand orange + ★) at a given size as a PNG,
 * via next/og. Shared by the manifest icon route and the iOS apple-icon.
 * Mark is centered with padding so it works as a maskable icon.
 */
export function renderAppIcon(size: number): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f97316",
          color: "#ffffff",
          fontSize: size * 0.58,
          fontWeight: 800,
        }}
      >
        S
      </div>
    ),
    { width: size, height: size },
  );
}
