import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, FONT } from "../theme";

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
            width: 286,
            height: 286,
            borderRadius: 40,
            overflow: "hidden",
            transform: `scale(${iconScale})`,
            boxShadow: "0 26px 60px rgba(20,40,80,0.28)",
            background: "#02070b",
          }}
        >
          <Img
            src={staticFile("logo.png")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
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
