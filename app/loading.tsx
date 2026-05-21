export default function Loading() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#F7F4EE",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div className="loading-wordmark">
          <span>groupdrop</span>
          <div className="loading-bar" />
        </div>
      </div>
    </>
  );
}

const STYLES = `
  .loading-wordmark {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .loading-wordmark span {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 22px;
    font-weight: 500;
    letter-spacing: 0.04em;
    color: #1A1814;
    opacity: 0.4;
  }
  .loading-bar {
    width: 48px;
    height: 1px;
    background: #B89A6A;
    position: relative;
    overflow: hidden;
  }
  .loading-bar::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: #D4B896;
    animation: sweep 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  @keyframes sweep {
    0%   { left: -100%; }
    100% { left: 200%; }
  }
`;
