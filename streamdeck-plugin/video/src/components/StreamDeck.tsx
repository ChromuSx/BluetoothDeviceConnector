import React from "react";
import { COLORS } from "../theme";
import { Key, KeySpec } from "./Key";

// Elgato-style wordmark (simple, no trademarked logo asset).
const Wordmark: React.FC = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      opacity: 0.85,
    }}
  >
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path
        d="M12 3a9 9 0 1 0 8.5 12H12V9.5h11A9 9 0 0 0 12 3Z"
        fill="#cfd6e0"
      />
    </svg>
    <span
      style={{
        color: "#cfd6e0",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: 0,
      }}
    >
      STREAM DECK
    </span>
  </div>
);

export const HERO_INDEX = 5; // first key of second row
export const AIRPODS_INDEX = 5;
export const ECHO_INDEX = 7;

export const StreamDeck: React.FC<{
  keys: KeySpec[]; // 15 entries (5x3)
  keySize?: number;
  heroPress?: number;
  heroGlow?: number;
  keyPresses?: Record<number, number>;
  keyGlows?: Record<number, number>;
  selectedIndex?: number;
}> = ({
  keys,
  keySize = 104,
  heroPress = 0,
  heroGlow = 0,
  keyPresses,
  keyGlows,
  selectedIndex,
}) => {
  const gap = Math.round(keySize * 0.2);
  const pad = Math.round(keySize * 0.42);

  return (
    <div
      style={{
        background: `linear-gradient(165deg, ${COLORS.deviceTop} 0%, ${COLORS.deviceBottom} 100%)`,
        borderRadius: 34,
        padding: pad,
        paddingTop: Math.round(pad * 0.75),
        border: `1px solid ${COLORS.deviceEdge}`,
        boxShadow:
          "0 40px 90px rgba(20,30,60,0.30), 0 8px 24px rgba(20,30,60,0.18), inset 0 1px 0 rgba(255,255,255,0.05)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: Math.round(pad * 0.55),
      }}
    >
      <Wordmark />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(5, ${keySize}px)`,
          gridAutoRows: `${keySize}px`,
          gap,
        }}
      >
        {keys.map((spec, i) => (
          <Key
            key={i}
            spec={spec}
            size={keySize}
            press={keyPresses?.[i] ?? (i === HERO_INDEX ? heroPress : 0)}
            glow={keyGlows?.[i] ?? (i === HERO_INDEX ? heroGlow : 0)}
            selected={i === selectedIndex}
          />
        ))}
      </div>
    </div>
  );
};

export type DeckBuildOptions = {
  airpods?: "disconnected" | "connecting" | "connected" | "error";
  echo?: "disconnected" | "connecting" | "connected" | "error" | null;
  showEcho?: boolean;
};

// A convenient default deck layout: two Bluetooth actions + tasteful filler.
export function buildDeck({
  airpods = "disconnected",
  echo = "disconnected",
  showEcho = true,
}: DeckBuildOptions = {}): KeySpec[] {
  const E: KeySpec = { kind: "empty" };
  const deck: KeySpec[] = [
    { kind: "app", glyph: "music", color: "#9a93d6" },
    { kind: "app", glyph: "mic", color: "#d68aa0" },
    E,
    { kind: "app", glyph: "cam", color: "#7fb8e6" },
    { kind: "app", glyph: "gear", color: "#9aa3b2" },
    { kind: "bluetooth", state: airpods, title: "AirPods" },
    E,
    showEcho && echo
      ? { kind: "bluetooth", state: echo, title: "Echo Dot" }
      : { kind: "app", glyph: "volume", color: "#7fc6a3" },
    E,
    E,
    E,
    E,
    { kind: "app", glyph: "music", color: "#e0b483" },
    E,
    E,
  ];
  return deck;
}
