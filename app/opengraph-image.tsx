import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "groupdrop — luxury goods at collective pricing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadFont() {
  /*
    Fetch Cormorant Garamond italic 500 from Google Fonts.
    Google Fonts CSS lists extended unicode ranges first, Latin basic last.
    We take the last match to get the Latin subset woff2 URL.
  */
  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,500&subset=latin",
    { headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" } }
  ).then((r) => r.text());

  const matches = [...css.matchAll(/url\(([^)]+)\)\s+format\('woff2'\)/g)];
  const url = matches[matches.length - 1]?.[1];
  if (!url) return null;

  return fetch(url).then((r) => r.arrayBuffer());
}

export default async function Image() {
  const fontData = await loadFont().catch(() => null);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#F7F4EE",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 100px",
          position: "relative",
        }}
      >
        {/* Gold circle — top right */}
        <div
          style={{
            position: "absolute",
            top: "64px",
            right: "100px",
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            backgroundColor: "#B89A6A",
            display: "flex",
          }}
        />

        {/* Gold rule + overline */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
          <div style={{ width: "48px", height: "1px", backgroundColor: "#B89A6A", display: "flex" }} />
          <div
            style={{
              fontSize: "13px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#B89A6A",
              fontWeight: 500,
              display: "flex",
            }}
          >
            Founding membership open
          </div>
        </div>

        {/* Wordmark */}
        <div
          style={{
            fontSize: "108px",
            fontWeight: 500,
            fontStyle: "italic",
            color: "#1A1814",
            lineHeight: 0.95,
            marginBottom: "36px",
            fontFamily: "Cormorant Garamond",
            display: "flex",
          }}
        >
          groupdrop
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "26px",
            fontWeight: 300,
            color: "#6B6560",
            letterSpacing: "0.02em",
            lineHeight: 1.5,
            display: "flex",
          }}
        >
          Luxury goods at collective pricing.
        </div>

        {/* Bottom gold rule */}
        <div
          style={{
            position: "absolute",
            bottom: "72px",
            left: "100px",
            right: "100px",
            height: "1px",
            backgroundColor: "#B89A6A",
            opacity: 0.4,
            display: "flex",
          }}
        />
      </div>
    ),
    {
      ...size,
      ...(fontData
        ? {
            fonts: [
              {
                name: "Cormorant Garamond",
                data: fontData,
                style: "italic",
                weight: 500,
              },
            ],
          }
        : {}),
    }
  );
}
