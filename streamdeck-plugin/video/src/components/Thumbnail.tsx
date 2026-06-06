import React from "react";
import { AbsoluteFill } from "remotion";
import { Background } from "./Background";
import { StreamDeck, buildDeck } from "./StreamDeck";
import { COLORS, FONT } from "../theme";

// Static 1920x960 marketplace thumbnail.
export const Thumbnail: React.FC = () => {
  const deck = buildDeck({
    airpods: "connected",
    echo: "connected",
    showEcho: true,
  });
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Background />
      <AbsoluteFill
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 82,
          padding: "0 110px",
        }}
      >
        <div style={{ transform: "scale(1.08)" }}>
          <StreamDeck keys={deck} heroGlow={0.4} />
        </div>
        <div style={{ maxWidth: 660 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(35,197,82,0.14)",
              border: `1px solid ${COLORS.connected}55`,
              color: COLORS.connected,
              padding: "8px 16px",
              borderRadius: 999,
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 22,
            }}
          >
            <span
              style={{
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: COLORS.connected,
              }}
            />
            No Windows settings
          </div>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.02,
              color: COLORS.ink,
              letterSpacing: 0,
            }}
          >
            Switch Bluetooth audio
            <br />
            from Stream Deck
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 30,
              fontWeight: 600,
              color: COLORS.inkSoft,
            }}
          >
            Headphones, speakers, and microphones on separate keys
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: 20,
              fontWeight: 800,
              color: COLORS.navySoft,
            }}
          >
            Bluetooth Device Connector
          </div>
          <div
            style={{
              marginTop: 28,
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {["Audio + mic", "Live status", "Tap to toggle"].map(
              (label) => (
                <span
                  key={label}
                  style={{
                    height: 36,
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0 14px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.76)",
                    border: "1px solid rgba(82,112,140,0.18)",
                    color: COLORS.navySoft,
                    fontSize: 17,
                    fontWeight: 800,
                  }}
                >
                  {label}
                </span>
              )
            )}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
