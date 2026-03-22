import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const alt = "groupdrop — luxury goods at collective pricing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function loadFont() {
  /* Read Cormorant Garamond italic 500 from the installed fontsource package */
  return readFileSync(
    join(process.cwd(), "node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2")
  );
}

export default async function Image() {
  const fontData = loadFont();

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
