import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, FONT } from "../theme";

const ClosingLogo: React.FC = () => (
  <svg width="180" height="180" viewBox="0 0 180 180">
    <defs>
      <linearGradient id="logoTile" x1="30" y1="18" x2="150" y2="162">
        <stop offset="0" stopColor="#182536" />
        <stop offset="1" stopColor="#071019" />
      </linearGradient>
      <linearGradient id="logoBlue" x1="66" y1="46" x2="112" y2="134">
        <stop offset="0" stopColor="#39b8ff" />
        <stop offset="1" stopColor="#0082fc" />
      </linearGradient>
    </defs>
    <rect
      x="0"
      y="0"
      width="180"
      height="180"
      rx="38"
      fill="url(#logoTile)"
    />
    <circle cx="90" cy="88" r="58" fill="rgba(0,130,252,0.14)" />
    <path
      d="M58 84V70c0-28 18-45 43-45 23 0 41 17 41 45v14"
      fill="none"
      stroke="#33516a"
      strokeWidth="9"
      strokeLinecap="round"
    />
    <rect x="42" y="76" width="26" height="48" rx="10" fill="#33516a" />
    <rect x="132" y="76" width="26" height="48" rx="10" fill="#33516a" />
    <path
      d="M90 34v112l34-28-68-56h68L90 34Z"
      fill="none"
      stroke="url(#logoBlue)"
      strokeWidth="9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M137 66h22l-13 28h17l-31 38 10-30h-17l12-36Z"
      fill="#385973"
      stroke="#4f6d86"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

export const Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 16, mass: 0.8 } });
  const iconScale = interpolate(enter, [0, 1], [0.6, 1]);
  const rise = interpolate(enter, [0, 1], [30, 0]);
  const textIn = spring({
    frame: frame - 8,
    fps,
    config: { damping: 18, mass: 0.7 },
  });
  const btnIn = spring({
    frame: frame - 18,
    fps,
    config: { damping: 18, mass: 0.7 },
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 26,
        }}
      >
        <div
          style={{
            width: 180,
            height: 180,
            borderRadius: 38,
            overflow: "hidden",
            transform: `scale(${iconScale})`,
            boxShadow: "0 26px 60px rgba(20,40,80,0.28)",
          }}
        >
          <ClosingLogo />
        </div>

        <div
          style={{
            textAlign: "center",
            opacity: Math.min(textIn, 1),
            transform: `translateY(${rise * (1 - Math.min(textIn, 1))}px)`,
          }}
        >
          <div style={{ fontSize: 54, fontWeight: 800, color: COLORS.ink }}>
            Bluetooth Device Connector
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 27,
              fontWeight: 600,
              color: COLORS.inkSoft,
            }}
          >
            Switch Bluetooth audio without opening Windows settings
          </div>
          <div
            style={{
              marginTop: 16,
              display: "flex",
              justifyContent: "center",
              gap: 10,
            }}
          >
            {["Audio + mic", "Live status", "Tap to toggle"].map((label) => (
              <span
                key={label}
                style={{
                  height: 34,
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0 14px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.72)",
                  border: "1px solid rgba(82,112,140,0.18)",
                  color: COLORS.navySoft,
                  fontSize: 16,
                  fontWeight: 800,
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div
          style={{
            marginTop: 8,
            opacity: Math.min(btnIn, 1),
            transform: `scale(${interpolate(
              Math.min(btnIn, 1),
              [0, 1],
              [0.9, 1]
            )})`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "#0b0d11",
            color: "#fff",
            padding: "18px 30px",
            borderRadius: 16,
            fontSize: 24,
            fontWeight: 700,
            boxShadow: "0 16px 40px rgba(11,13,17,0.35)",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path
              d="M12 3a9 9 0 1 0 8.5 12H12V9.5h11A9 9 0 0 0 12 3Z"
              fill="#fff"
            />
          </svg>
          Install from Elgato Marketplace
        </div>

        <div
          style={{
            opacity: Math.min(btnIn, 1),
            color: COLORS.inkSoft,
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          Windows 10+ | Stream Deck 6.9+
        </div>
      </div>
    </AbsoluteFill>
  );
};
