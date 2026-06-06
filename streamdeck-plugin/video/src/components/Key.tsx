import React from "react";
import { Img, staticFile } from "remotion";
import { COLORS } from "../theme";

export type BtState = "disconnected" | "connecting" | "connected" | "error";

type AppGlyph = "mic" | "music" | "gear" | "volume" | "cam";

export type KeySpec =
  | { kind: "empty" }
  | { kind: "bluetooth"; state: BtState; title?: string }
  | { kind: "app"; glyph: AppGlyph; color: string };

const GLYPHS: Record<AppGlyph, React.ReactNode> = {
  mic: (
    <path
      d="M24 4a6 6 0 0 0-6 6v10a6 6 0 0 0 12 0V10a6 6 0 0 0-6-6Zm12 16a12 12 0 0 1-24 0M24 32v8m-7 0h14"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  music: (
    <path
      d="M18 34V10l20-4v22M18 34a5 5 0 1 1-5-5 5 5 0 0 1 5 5Zm20-6a5 5 0 1 1-5-5 5 5 0 0 1 5 5Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  gear: (
    <path
      d="M24 16a8 8 0 1 0 8 8 8 8 0 0 0-8-8Zm17 8a17 17 0 0 0-.2-2.6l4-3.1-4-7-4.7 2a16 16 0 0 0-4.5-2.6L31 4H17l-.6 4.7a16 16 0 0 0-4.5 2.6l-4.7-2-4 7 4 3.1A17 17 0 0 0 7 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  volume: (
    <path
      d="M8 19v10h7l11 9V10L15 19H8Zm26-3a10 10 0 0 1 0 16m6-22a18 18 0 0 1 0 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  cam: (
    <path
      d="M6 14h22l8-5v30l-8-5H6Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

export const Key: React.FC<{
  spec: KeySpec;
  size: number;
  press?: number; // 0..1 press depth
  glow?: number; // 0..1 highlight ring
  selected?: boolean;
}> = ({ spec, size, press = 0, glow = 0, selected = false }) => {
  const radius = size * 0.16;
  const scale = 1 - press * 0.1;
  const ring =
    selected || glow > 0
      ? [
          selected ? "0 0 0 4px rgba(10,132,255,0.70)" : "",
          glow > 0
            ? `0 0 0 ${3 * glow}px rgba(30,155,255,${
                0.5 * glow
              }), 0 0 ${26 * glow}px rgba(30,155,255,${0.5 * glow})`
            : "",
        ]
          .filter(Boolean)
          .join(", ")
      : "none";

  const base: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: radius,
    transform: `scale(${scale})`,
    boxShadow: ring,
    overflow: "hidden",
    flex: "0 0 auto",
  };

  if (spec.kind === "empty") {
    return (
      <div
        style={{
          ...base,
          background: `linear-gradient(160deg, ${COLORS.keyEmpty}, #15171b)`,
          border: `1px solid ${COLORS.keyEmptyEdge}`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03)`,
        }}
      />
    );
  }

  if (spec.kind === "bluetooth") {
    return (
      <div
        style={{
          ...base,
          position: "relative",
          background:
            "linear-gradient(160deg, #101821 0%, #06090d 72%, #030507 100%)",
          border: "1px solid rgba(75,96,121,0.75)",
          filter: press > 0 ? `brightness(${1 - press * 0.16})` : undefined,
        }}
      >
        <Img
          src={staticFile(`keys/${spec.state}.png`)}
          style={{
            position: "absolute",
            left: "13%",
            top: spec.title ? "8%" : "6%",
            width: "74%",
            height: spec.title ? "58%" : "82%",
            objectFit: "contain",
            filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.45))",
          }}
        />
        {spec.title ? (
          <div
            style={{
              position: "absolute",
              left: 6,
              right: 6,
              bottom: 7,
              height: 19,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: Math.max(10, Math.round(size * 0.13)),
              lineHeight: 1,
              fontWeight: 800,
              textAlign: "center",
              textShadow: "0 2px 5px rgba(0,0,0,0.95)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {spec.title}
          </div>
        ) : null}
      </div>
    );
  }

  // app filler key — dark tile with a softly tinted glyph so the hero key pops
  return (
    <div
      style={{
        ...base,
        background: "linear-gradient(160deg, #2a2e37, #1a1d23)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        color: spec.color,
      }}
    >
      <svg
        width={size * 0.46}
        height={size * 0.46}
        viewBox="0 0 48 48"
        style={{ opacity: 0.9 }}
      >
        {GLYPHS[spec.glyph]}
      </svg>
    </div>
  );
};
