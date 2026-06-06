import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS } from "../theme";

// Soft, slowly drifting light background with a subtle technical texture.
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 1200], [0, 70], {
    extrapolateRight: "clamp",
  });
  const sweep = interpolate(frame, [0, 1200], [-18, 18], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: [
          `linear-gradient(155deg, ${COLORS.bgTop} 0%, ${COLORS.bgBottom} 62%, #eef8f3 100%)`,
          "linear-gradient(35deg, rgba(10,132,255,0.10), transparent 46%)",
          "linear-gradient(215deg, rgba(35,197,82,0.08), transparent 52%)",
        ].join(", "),
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(40,71,99,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(40,71,99,0.045) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          transform: `translate(${-drift}px, ${-drift * 0.35}px)`,
          opacity: 0.42,
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(${116 + sweep}deg, transparent 8%, rgba(255,255,255,0.56) 42%, transparent 68%)`,
          opacity: 0.5,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(88% 78% at 50% 48%, transparent 64%, rgba(20,40,70,0.08) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
