import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Mentiohunt – The Distribution Queue for Founders"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  const outfit = await fetch(
    new URL(
      "https://fonts.gstatic.com/s/outfit/v11/QGYyz_MVcBeNP4NjuGObqx1XmO1I4TC1C4G-EiAou6Y.ttf",
      import.meta.url
    )
  )
    .then((res) => (res.ok ? res.arrayBuffer() : null))
    .catch(() => null)

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#fdf9f3",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          fontFamily: "Outfit, sans-serif",
        }}
      >
        {/* Top gradient bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "5px",
            background: "linear-gradient(90deg, #ff5400 0%, #ff8500 50%, #ff9e00 100%)",
          }}
        />

        {/* Orange glow top-right */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-60px",
            width: "480px",
            height: "480px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,133,0,0.18) 0%, rgba(255,84,0,0.06) 55%, transparent 75%)",
          }}
        />

        {/* Content wrapper */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 80px 60px",
            height: "100%",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #ff5400 0%, #ff8500 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: "26px",
                fontWeight: 700,
              }}
            >
              M
            </div>
            <span style={{ fontSize: "24px", fontWeight: 600, color: "#1a0a05", letterSpacing: "-0.02em" }}>
              Mentiohunt
            </span>
          </div>

          {/* Main copy */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                alignSelf: "flex-start",
                gap: "8px",
                background: "rgba(255, 84, 0, 0.08)",
                border: "1px solid rgba(255, 84, 0, 0.22)",
                borderRadius: "100px",
                padding: "6px 16px",
              }}
            >
              <div
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#ff5400",
                }}
              />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#ff8500", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Distribution queue for founders
              </span>
            </div>

            {/* Headline */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxWidth: "860px" }}>
              <span style={{ fontSize: "62px", fontWeight: 700, color: "#1a0a05", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
                The distribution queue
              </span>
              <span style={{ fontSize: "62px", fontWeight: 700, color: "#ff6400", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
                for founders.
              </span>
            </div>

            {/* Subline */}
            <span style={{ fontSize: "22px", color: "#7a4a30", lineHeight: 1.5, maxWidth: "680px" }}>
              High-fit sites to pitch for backlinks, communities to engage — with a ready-to-use outreach draft for every opportunity.
            </span>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
            {[
              ["Backlinks", "site pitching"],
              ["Fit scoring", "per opportunity"],
              ["Ready-to-send", "outreach drafts"],
            ].map(([val, label]) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "22px", fontWeight: 700, color: "#1a0a05" }}>{val}</span>
                <span style={{ fontSize: "14px", color: "#9a6a50" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: outfit
        ? [{ name: "Outfit", data: outfit, style: "normal", weight: 700 }]
        : [],
    }
  )
}
