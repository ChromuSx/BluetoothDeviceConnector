import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, FONT } from "../theme";

type IconKind = "check" | "bolt" | "bluetooth";

// Centered notification card with a blurred backdrop, mirroring the plugin's
// on-key feedback ("Connected!", etc.). Animates in with a spring, out with fade.
export const Popup: React.FC<{
  title: string;
  subtitle?: string;
  color: string;
  icon?: IconKind;
  /** frame (relative to this sequence) when the card starts leaving */
  outAt: number;
}> = ({ title, subtitle, color, icon = "check", outAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 14, mass: 0.7 } });
  const exit = interpolate(frame, [outAt, outAt + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = interpolate(enter, [0, 1], [0.78, 1]) * (1 - exit * 0.06);
  const opacity = Math.min(enter, 1) * (1 - exit);
  const backdrop = Math.min(enter, 1) * (1 - exit);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <AbsoluteFill
        style={{
          backdropFilter: `blur(${8 * backdrop}px)`,
          WebkitBackdropFilter: `blur(${8 * backdrop}px)`,
          background: `rgba(225,232,244,${0.38 * backdrop})`,
        }}
      />
      <div
        style={{
          transform: `scale(${scale})`,
          opacity,
          width: 520,
          padding: "46px 48px",
          borderRadius: 30,
          background: "rgba(255,255,255,0.96)",
          boxShadow:
            "0 30px 80px rgba(20,40,80,0.28), inset 0 1px 0 rgba(255,255,255,0.9)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
          fontFamily: FONT,
        }}
      >
        <Badge color={color} icon={icon} enter={enter} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 42, fontWeight: 800, color: COLORS.ink }}>
            {title}
          </div>
          {subtitle ? (
            <div
              style={{
                marginTop: 8,
                fontSize: 24,
                fontWeight: 500,
                color: COLORS.inkSoft,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Badge: React.FC<{ color: string; icon: IconKind; enter: number }> = ({
  color,
  icon,
  enter,
}) => {
  const dash = interpolate(enter, [0.2, 0.8], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        width: 104,
        height: 104,
        borderRadius: "50%",
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 12px 30px ${color}66`,
      }}
    >
      <svg width="56" height="56" viewBox="0 0 48 48">
        {icon === "check" && (
          <path
            d="M13 25l7 7 15-16"
            fill="none"
            stroke="#fff"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="40"
            strokeDashoffset={dash}
          />
        )}
        {icon === "bolt" && (
          <path d="M26 4 10 28h10l-2 16 16-26H24z" fill="#fff" />
        )}
        {icon === "bluetooth" && (
          <path
            d="M24 6v36l11-9-22-18h22l-11-9"
            fill="none"
            stroke="#fff"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  );
};
