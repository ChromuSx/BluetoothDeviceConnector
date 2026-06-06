import React from "react";
import { COLORS, FONT } from "../theme";

// Subtle persistent footer, like the reference's "Built to work with …".
export const Footer: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      right: 56,
      bottom: 44,
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontFamily: FONT,
      opacity,
    }}
  >
    <span style={{ color: COLORS.inkSoft, fontSize: 18, fontWeight: 600 }}>
      for
    </span>
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        d="M12 3a9 9 0 1 0 8.5 12H12V9.5h11A9 9 0 0 0 12 3Z"
        fill={COLORS.navy}
      />
    </svg>
    <span style={{ color: COLORS.navy, fontSize: 19, fontWeight: 800 }}>
      Elgato Stream Deck
    </span>
  </div>
);
