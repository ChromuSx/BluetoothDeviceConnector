import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONT } from "../theme";
import { BtState } from "./Key";

const STEPS: Array<{ state: BtState; label: string; color: string }> = [
  { state: "disconnected", label: "Disconnected", color: COLORS.blue },
  { state: "connecting", label: "Connecting", color: COLORS.connecting },
  { state: "connected", label: "Connected", color: COLORS.connected },
];

export const StatusTrail: React.FC<{ state: BtState }> = ({ state }) => {
  const frame = useCurrentFrame();
  const intro = interpolate(frame, [18, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        margin: "22px auto 0",
        width: 612,
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 10,
        fontFamily: FONT,
        opacity: intro,
        transform: `translateY(${(1 - intro) * 12}px)`,
      }}
    >
      {STEPS.map((step) => {
        const active = step.state === state;
        return (
          <div
            key={step.state}
            style={{
              height: 48,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
              background: active
                ? "rgba(255,255,255,0.82)"
                : "rgba(255,255,255,0.50)",
              border: `1px solid ${
                active ? `${step.color}66` : "rgba(82,112,140,0.18)"
              }`,
              boxShadow: active
                ? `0 10px 26px ${step.color}26`
                : "0 8px 20px rgba(40,71,99,0.08)",
              color: active ? COLORS.ink : COLORS.inkSoft,
              fontSize: 17,
              fontWeight: active ? 800 : 700,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: step.color,
                boxShadow: active ? `0 0 0 5px ${step.color}22` : "none",
              }}
            />
            {step.label}
          </div>
        );
      })}
    </div>
  );
};
