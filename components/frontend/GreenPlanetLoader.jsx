// src/components/frontend/GreenPlanetLoader.jsx
// Brand loader for Green Planet Computers — redrawn from the logo
// (globe, orbit swoosh, laptop). Pure SVG + CSS, no dependencies.
// Works in both server and client components.

const COLORS = {
  deep: "#0b6b32",
  mid: "#138a3e",
  light: "#2aa84f",
  ink: "#0a5a2a",
};

export default function GreenPlanetLoader({
  fullScreen = false,
  label = "Loading",
}) {
  return (
    <div
      className={`gp-loader ${fullScreen ? "gp-loader--full" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={`${label}, please wait`}
    >
      <div className="gp-stage">
        <svg
          className="gp-svg"
          viewBox="60 70 440 400"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="gp-swoosh" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={COLORS.light} />
              <stop offset="55%" stopColor={COLORS.mid} />
              <stop offset="100%" stopColor={COLORS.deep} />
            </linearGradient>
            <clipPath id="gp-screen-clip">
              <path d="M318 130 L452 98 L436 210 L302 207 Z" />
            </clipPath>
          </defs>

          {/* Globe (floats gently) */}
          <g className="gp-globe">
            <path
              fill={COLORS.deep}
              d="M148 188C118 230 110 300 135 360C160 410 220 435 292 442C250 420 225 395 215 365C205 340 245 335 240 300C232 270 195 262 190 235C185 215 165 195 155 195Z"
            />
            <path
              fill={COLORS.deep}
              d="M180 135C200 112 235 100 268 95C245 110 238 135 232 155C210 150 190 150 180 135Z"
            />
          </g>

          {/* Laptop */}
          <g className="gp-laptop">
            <path
              d="M312 125L458 90L440 215L296 212Z"
              fill="#fff"
              stroke={COLORS.mid}
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <g clipPath="url(#gp-screen-clip)">
              <rect
                className="gp-screen-bar"
                x="302"
                y="160"
                width="150"
                height="14"
                rx="7"
                fill={COLORS.light}
              />
              <rect
                className="gp-screen-bar gp-screen-bar--2"
                x="302"
                y="182"
                width="150"
                height="8"
                rx="4"
                fill={COLORS.light}
                opacity=".55"
              />
            </g>
            <path
              d="M200 245L290 220L442 218L396 247Z"
              fill={COLORS.mid}
            />
            <path
              d="M232 237h26M268 232h26M304 230h26M340 230h26M246 242h30M288 240h30M330 239h30"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>

          {/* Orbit swoosh */}
          <path
            className="gp-swoosh"
            fill="url(#gp-swoosh)"
            d="M92 165C90 150 130 148 175 160C280 190 400 290 470 405C475 420 465 432 450 428C420 425 405 415 380 385C320 310 220 215 120 190C100 185 92 175 92 165Z"
          />

          {/* Dot travelling along the orbit */}
          <circle r="9" fill="#fff" stroke={COLORS.deep} strokeWidth="4">
            <animateMotion
              dur="2.2s"
              repeatCount="indefinite"
              keyPoints="0;1"
              keyTimes="0;1"
              calcMode="spline"
              keySplines="0.45 0 0.55 1"
              path="M108 168C250 190 380 290 458 412"
            />
          </circle>
        </svg>

        <div className="gp-brand">
          <span className="gp-name">GREEN PLANET</span>
          <span className="gp-sub">COMPUTERS</span>
        </div>

        <div className="gp-track" aria-hidden="true">
          <span className="gp-fill" />
        </div>

        <p className="gp-label">
          {label}
          <span className="gp-dots" aria-hidden="true">
            <i>.</i>
            <i>.</i>
            <i>.</i>
          </span>
        </p>
      </div>

      <style>{`
        .gp-loader {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 70vh;
          padding: 24px;
          background: #ffffff;
        }
        .gp-loader--full {
          position: fixed;
          inset: 0;
          min-height: 100vh;
          z-index: 9999;
        }
        .gp-stage {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: min(360px, 82vw);
        }
        .gp-svg { width: 100%; height: auto; overflow: visible; }
        .gp-brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 4px;
          line-height: 1;
        }
        .gp-name {
          font-family: "Arial Black", "Segoe UI Black", Impact, system-ui, sans-serif;
          font-weight: 900;
          font-size: clamp(26px, 6vw, 34px);
          letter-spacing: -0.5px;
          color: ${COLORS.ink};
        }
        .gp-sub {
          margin-top: 6px;
          font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
          font-weight: 400;
          font-size: clamp(16px, 3.8vw, 21px);
          letter-spacing: 2px;
          color: ${COLORS.mid};
        }
        .gp-track {
          width: 72%;
          height: 5px;
          margin-top: 22px;
          border-radius: 999px;
          background: #e2f1e6;
          overflow: hidden;
        }
        .gp-fill {
          display: block;
          height: 100%;
          width: 40%;
          border-radius: inherit;
          background: linear-gradient(90deg, ${COLORS.light}, ${COLORS.deep});
          animation: gp-slide 1.4s cubic-bezier(.45,0,.55,1) infinite;
        }
        .gp-label {
          margin: 12px 0 0;
          font-family: "Segoe UI", system-ui, sans-serif;
          font-size: 14px;
          color: ${COLORS.mid};
        }
        .gp-dots i { font-style: normal; animation: gp-blink 1.2s infinite both; }
        .gp-dots i:nth-child(2) { animation-delay: .2s; }
        .gp-dots i:nth-child(3) { animation-delay: .4s; }

        .gp-globe { animation: gp-float 3s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
        .gp-laptop { animation: gp-pop 2.2s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
        .gp-swoosh { animation: gp-glow 2.2s ease-in-out infinite; }
        .gp-screen-bar { transform-box: fill-box; transform-origin: left center; animation: gp-load 2.2s ease-in-out infinite; }
        .gp-screen-bar--2 { animation-delay: .25s; }

        @keyframes gp-slide { 0% { transform: translateX(-110%); } 100% { transform: translateX(280%); } }
        @keyframes gp-blink { 0%, 80%, 100% { opacity: .2; } 40% { opacity: 1; } }
        @keyframes gp-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes gp-pop { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.025); } }
        @keyframes gp-glow { 0%, 100% { opacity: 1; } 50% { opacity: .72; } }
        @keyframes gp-load { 0% { transform: scaleX(0.05); } 70%, 100% { transform: scaleX(1); } }

        @media (prefers-reduced-motion: reduce) {
          .gp-globe, .gp-laptop, .gp-swoosh, .gp-screen-bar, .gp-fill, .gp-dots i { animation: none; }
          .gp-fill { width: 100%; }
          .gp-dots i { opacity: 1; }
          .gp-svg animateMotion { display: none; }
        }
      `}</style>
    </div>
  );
}