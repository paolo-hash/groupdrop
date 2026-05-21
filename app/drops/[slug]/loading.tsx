export default function DropLoading() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <main style={{ minHeight: "100vh", backgroundColor: "#F7F4EE" }}>

        {/* Nav skeleton */}
        <header style={{
          height: "68px",
          borderBottom: "1px solid rgba(26,24,20,0.10)",
          backgroundColor: "#F7F4EE",
          display: "flex",
          alignItems: "center",
          padding: "0 28px",
        }}>
          <div className="skel" style={{ width: "110px", height: "16px", borderRadius: "2px" }} />
        </header>

        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "60px 28px" }}>

          {/* Breadcrumb */}
          <div className="skel" style={{ width: "180px", height: "10px", borderRadius: "2px", marginBottom: "48px" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px" }}>

            {/* Left — hero image */}
            <div>
              <div className="skel" style={{ width: "100%", aspectRatio: "4/5", borderRadius: "2px", marginBottom: "16px" }} />
            </div>

            {/* Right — content */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div className="skel" style={{ width: "60%", height: "12px", borderRadius: "2px" }} />
              <div className="skel" style={{ width: "85%", height: "44px", borderRadius: "2px" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div className="skel" style={{ width: "100%", height: "10px", borderRadius: "2px" }} />
                <div className="skel" style={{ width: "90%", height: "10px", borderRadius: "2px" }} />
                <div className="skel" style={{ width: "75%", height: "10px", borderRadius: "2px" }} />
              </div>

              {/* Power meter skeleton */}
              <div style={{ marginTop: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div className="skel" style={{ width: "80px", height: "10px", borderRadius: "2px" }} />
                  <div className="skel" style={{ width: "40px", height: "10px", borderRadius: "2px" }} />
                </div>
                <div className="skel" style={{ width: "100%", height: "6px", borderRadius: "3px" }} />
              </div>

              {/* SKU cards skeleton */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skel" style={{ width: "100%", height: "64px", borderRadius: "2px" }} />
                ))}
              </div>

              {/* CTA skeleton */}
              <div className="skel" style={{ width: "100%", height: "44px", borderRadius: "2px", marginTop: "8px" }} />
            </div>

          </div>
        </div>
      </main>
    </>
  );
}

const STYLES = `
  .skel {
    background: linear-gradient(90deg, #EDE9E0 25%, #E5E0D5 50%, #EDE9E0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.6s ease infinite;
  }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @media (max-width: 768px) {
    .drop-grid { grid-template-columns: 1fr !important; }
  }
`;
