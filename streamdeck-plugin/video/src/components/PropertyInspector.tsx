import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONT } from "../theme";

const DEVICES = [
  { name: "AirPods Pro", tag: "headset" },
  { name: "Sony WH-1000XM4", tag: "headset" },
  { name: "Amazon Echo Dot", tag: "speaker" },
  { name: "JBL Flip 6", tag: "speaker" },
  { name: "Bose QC45", tag: "headset" },
];

const DeviceTag: React.FC<{ tag: string; selected: boolean }> = ({
  tag,
  selected,
}) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      minWidth: 88,
      justifyContent: "center",
      fontSize: 12,
      fontWeight: 800,
      letterSpacing: 0,
      color: selected ? "#fff" : COLORS.panelMuted,
      background: selected ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.06)",
      padding: "5px 9px",
      borderRadius: 999,
    }}
  >
    <svg width="14" height="14" viewBox="0 0 24 24">
      {tag === "speaker" ? (
        <path
          d="M4 9v6h4l6 5V4L8 9H4Zm14-1a5 5 0 0 1 0 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M5 13a7 7 0 0 1 14 0v5a2 2 0 0 1-2 2h-2v-7h4M5 13v5a2 2 0 0 0 2 2h2v-7H5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
    {tag}
  </span>
);

// Simplified Property Inspector showing the v1.0.5 device picker dropdown.
// Self-animates relative to its own sequence: panel slides in, dropdown opens,
// selection lands on the speaker-only device to highlight that feature.
export const PropertyInspector: React.FC<{ highlightIndex: number }> = ({
  highlightIndex,
}) => {
  const frame = useCurrentFrame();
  const open = interpolate(frame, [10, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const listH = Math.round(open * (DEVICES.length * 56 + 12));
  // The selection "lands" on the target device once the list is open.
  const selected = frame > 82 ? highlightIndex : 0;
  const helper = interpolate(frame, [84, 112], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: 560,
        background: `linear-gradient(180deg, ${COLORS.panel}, #14171d)`,
        border: `1px solid ${COLORS.panelEdge}`,
        borderRadius: 18,
        padding: 26,
        fontFamily: FONT,
        boxShadow: "0 30px 70px rgba(20,30,60,0.28)",
      }}
    >
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: COLORS.blue,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path
              d="M24 6v36l11-9-22-18h22l-11-9"
              fill="none"
              stroke="#fff"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span style={{ color: COLORS.panelText, fontSize: 18, fontWeight: 700 }}>
          Connect Bluetooth Device
        </span>
      </div>

      <div
        style={{
          height: 1,
          background: COLORS.panelEdge,
          margin: "20px 0 18px",
        }}
      />

      {/* field label */}
      <div
        style={{
          color: COLORS.panelMuted,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 0,
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        Bluetooth Device
      </div>

      {/* select box */}
      <div
        style={{
          height: 50,
          borderRadius: 11,
          background: "#11141a",
          border: `1px solid ${COLORS.panelEdge}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
        }}
      >
        <span style={{ color: COLORS.panelText, fontSize: 17, fontWeight: 600 }}>
          {DEVICES[selected]?.name ?? "Select a device"}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          style={{ opacity: 0.7 }}
        >
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke={COLORS.panelText}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* open dropdown */}
      <div
        style={{
          marginTop: 8,
          height: listH,
          overflow: "hidden",
          borderRadius: 11,
          background: listH > 4 ? "#11141a" : "transparent",
          border: listH > 4 ? `1px solid ${COLORS.panelEdge}` : "none",
        }}
      >
        <div style={{ padding: 6 }}>
          {DEVICES.map((d, i) => {
            const appear = interpolate(
              frame,
              [20 + i * 4, 32 + i * 4],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const isSel = i === selected;
            return (
              <div
                key={d.name}
                style={{
                  height: 50,
                  margin: 2,
                  borderRadius: 8,
                  paddingLeft: 14,
                  paddingRight: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: isSel ? COLORS.panelRowHi : "transparent",
                  opacity: appear,
                  transform: `translateX(${(1 - appear) * 12}px)`,
                }}
              >
                <span
                  style={{
                    color: "#fff",
                    fontSize: 17,
                    fontWeight: isSel ? 700 : 500,
                  }}
                >
                  {d.name}
                </span>
                <DeviceTag tag={d.tag} selected={isSel} />
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          height: 42,
          borderRadius: 11,
          background: "rgba(35,197,82,0.10)",
          border: `1px solid ${COLORS.connected}44`,
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "0 14px",
          opacity: helper,
          transform: `translateY(${(1 - helper) * 8}px)`,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: COLORS.connected,
            boxShadow: `0 0 0 5px ${COLORS.connected}22`,
          }}
        />
        <span
          style={{
            color: COLORS.panelText,
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          Speaker-only devices are included in the picker
        </span>
      </div>
    </div>
  );
};
