export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "64px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 20 }}>groupdrop (beta)</div>
          <div style={{ display: "flex", gap: 14, fontSize: 14 }}>
            <a href="#drops">Drops</a>
            <a href="#how">How it works</a>
            <a href="#join">Join</a>
          </div>
        </div>

        <div style={{ marginTop: 64 }}>
          <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1.05 }}>
            Premium group buys,
            <br />
            without the chaos.
          </div>
          <div style={{ marginTop: 14, fontSize: 18, color: "#444", maxWidth: 640 }}>
            Join curated drops. Watch the total climb. When we hit the target, everyone gets the deal.
          </div>

          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <a
              href="#join"
              style={{
                background: "#111",
                color: "white",
                padding: "12px 16px",
                borderRadius: 10,
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Join the next drop
            </a>
            <a
              href="#how"
              style={{
                border: "1px solid #ddd",
                padding: "12px 16px",
                borderRadius: 10,
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              How it works
            </a>
          </div>
        </div>

        <div id="drops" style={{ marginTop: 64, display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18 }}>
          <div style={{ border: "1px solid #eee", borderRadius: 16, padding: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#666" }}>ACTIVE DROP</div>
            <div style={{ marginTop: 8, fontSize: 22, fontWeight: 900 }}>Aesop Hand Wash Bundle</div>
            <div style={{ marginTop: 6, color: "#555" }}>
              Target: <b>$5,000</b> • Ends in <b>3 days</b>
            </div>

            <div style={{ marginTop: 16, height: 10, background: "#eee", borderRadius: 999 }}>
              <div style={{ width: "62%", height: "100%", background: "#111", borderRadius: 999 }} />
            </div>
            <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 14, color: "#555" }}>
              <div>
                Raised: <b>$3,100</b>
              </div>
              <div>
                62% • <b>$1,900</b> to go
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <a
                href="#join"
                style={{
                  display: "inline-block",
                  background: "#111",
                  color: "white",
                  padding: "12px 14px",
                  borderRadius: 12,
                  textDecoration: "none",
                  fontWeight: 800,
                }}
              >
                Join this drop
              </a>
            </div>
          </div>

          <div style={{ border: "1px solid #eee", borderRadius: 16, padding: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#666" }}>UP NEXT</div>
            <div style={{ marginTop: 8, fontSize: 20, fontWeight: 900 }}>Le Labo Discovery Set</div>
            <div style={{ marginTop: 6, color: "#555" }}>
              Vote to unlock • Target <b>$7,500</b>
            </div>

            <div style={{ marginTop: 16, borderTop: "1px solid #eee", paddingTop: 14, color: "#555", fontSize: 14 }}>
              Invite a friend and you both get early access.
            </div>
          </div>
        </div>

        <div id="how" style={{ marginTop: 64 }}>
          <div style={{ fontSize: 24, fontWeight: 900 }}>How it works</div>
          <ol style={{ marginTop: 12, color: "#444", lineHeight: 1.7 }}>
            <li>We post a curated drop with a target total.</li>
            <li>You join (no chaos, one checkout).</li>
            <li>If the drop hits the target before the timer ends, everyone gets the deal.</li>
          </ol>
        </div>

        <div id="join" style={{ marginTop: 64, border: "1px solid #eee", borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>Get notified when new drops go live</div>
          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              placeholder="you@email.com"
              style={{
                padding: "12px 12px",
                borderRadius: 10,
                border: "1px solid #ddd",
                minWidth: 260,
              }}
            />
            <button
              style={{
                background: "#111",
                color: "white",
                padding: "12px 16px",
                borderRadius: 10,
                border: "none",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Notify me
            </button>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
            (This button doesn’t do anything yet. We’ll wire it up next.)
          </div>
        </div>

        <div style={{ marginTop: 40, fontSize: 12, color: "#777" }}>© {new Date().getFullYear()} groupdrop</div>
      </div>
    </main>
  );
}
