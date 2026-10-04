import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = site.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "radial-gradient(ellipse at top, #3a2c0b, #0a0a0b 65%)",
          color: "#ececef",
        }}
      >
        <svg width="96" height="96" viewBox="0 0 32 32" fill="#f5b82e">
          <path d="M4 10l6 5 6-9 6 9 6-5-2.5 14h-19L4 10z" />
          <rect x="6.5" y="25.5" width="19" height="2.5" rx="1" />
        </svg>
        <div style={{ marginTop: 40, fontSize: 96, fontWeight: 800, lineHeight: 1, textTransform: "uppercase" }}>
          Blackout Kings
        </div>
        <div style={{ fontSize: 64, fontWeight: 800, color: "#f5b82e", textTransform: "uppercase" }}>
          Fantasy Football
        </div>
        <div style={{ marginTop: 32, fontSize: 32, color: "#9d9da8" }}>{site.tagline}</div>
      </div>
    ),
    size,
  );
}
