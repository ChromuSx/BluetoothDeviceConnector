import React from "react";
import { interpolate } from "remotion";

// A clean finger-tap indicator: a soft disc presses down, then a ripple ring
// expands outward. `progress` runs 0..1 over the tap.
export const TapIndicator: React.FC<{
  x: number;
  y: number;
  progress: number;
  size?: number;
}> = ({ x, y, progress, size = 110 }) => {
  const discScale = interpolate(progress, [0, 0.35, 0.6], [1.5, 0.82, 1], {
    extrapolateRight: "clamp",
  });
  const discOpacity = interpolate(
    progress,
    [0, 0.1, 0.75, 1],
    [0, 0.9, 0.9, 0]
  );
  const rippleScale = interpolate(progress, [0.3, 1], [0.2, 2.4], {
    extrapolateLeft: "clamp",
  });
  const rippleOpacity = interpolate(progress, [0.3, 0.45, 1], [0, 0.5, 0]);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "3px solid rgba(30,155,255,0.9)",
          transform: `scale(${rippleScale})`,
          opacity: rippleOpacity,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: size * 0.18,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 38% 35%, rgba(255,255,255,0.95), rgba(180,220,255,0.55) 60%, rgba(120,190,255,0.25) 100%)",
          boxShadow: "0 6px 18px rgba(10,90,180,0.35)",
          transform: `scale(${discScale})`,
          opacity: discOpacity,
        }}
      />
    </div>
  );
};
