import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, FONT } from "../theme";

// Animated headline shown near the top. Fades/slides in at the start of its
// sequence and out at the end.
export const Caption: React.FC<{
  title: string;
  subtitle?: string;
  accent?: string;
  eyebrow?: string;
}> = ({ title, subtitle, accent = COLORS.blue, eyebrow }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 16, mass: 0.6 } });
  const out = interpolate(
    frame,
    [durationInFrames - 16, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const y = interpolate(enter, [0, 1], [26, 0]);
  const opacity = Math.min(enter, 1) * out;

  return (
    <div
      style={{
        position: "absolute",
        top: 92,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily: FONT,
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      {eyebrow ? (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            height: 34,
            padding: "0 15px",
            marginBottom: 18,
            borderRadius: 999,
            background: "rgba(255,255,255,0.72)",
            border: "1px solid rgba(82,112,140,0.18)",
            color: COLORS.navySoft,
            fontSize: 17,
            fontWeight: 800,
            boxShadow: "0 10px 28px rgba(40,71,99,0.08)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: accent,
            }}
          />
          {eyebrow}
        </div>
      ) : null}
      <div
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          fontSize: 54,
          fontWeight: 800,
          lineHeight: 1.08,
          color: COLORS.ink,
          letterSpacing: 0,
          textShadow: "0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        {title}
      </div>
      {subtitle ? (
        <div
          style={{
            maxWidth: 920,
            margin: "14px auto 0",
            fontSize: 27,
            fontWeight: 600,
            lineHeight: 1.24,
            color: accent,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
};
