import React from "react";
import { AbsoluteFill, CanvasImage, staticFile } from "remotion";
import { Background } from "./Background";
import { AIRPODS_INDEX, StreamDeck, buildDeck } from "./StreamDeck";
import { COLORS, FONT } from "../theme";

const CheckIcon: React.FC<{ color?: string; size?: number }> = ({
  color = COLORS.connected,
  size = 22,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="m5 12.5 4.2 4.2L19 7"
      fill="none"
      stroke={color}
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ArrowIcon: React.FC<{ color?: string; size?: number }> = ({
  color = COLORS.blue,
  size = 28,
}) => (
  <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
    <path
      d="M4 14h18m-6-6 6 6-6 6"
      fill="none"
      stroke={color}
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="m6 9 6 6 6-6"
      fill="none"
      stroke={COLORS.panelText}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RefreshIcon: React.FC = () => (
  <svg width="27" height="27" viewBox="0 0 28 28" aria-hidden="true">
    <path
      d="M22 9V4l-2 2A10 10 0 1 0 23.6 16"
      fill="none"
      stroke={COLORS.panelText}
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BrandLockup: React.FC<{ dark?: boolean }> = ({ dark = false }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
    <div
      style={{
        width: 76,
        height: 76,
        borderRadius: 20,
        background: dark ? "#10141a" : "rgba(255,255,255,0.86)",
        border: dark
          ? "1px solid rgba(255,255,255,0.10)"
          : "1px solid rgba(40,71,99,0.10)",
        boxShadow: dark
          ? "0 18px 38px rgba(0,0,0,0.26)"
          : "0 18px 38px rgba(40,71,99,0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <CanvasImage
        src={staticFile("plugin-icon-large.png")}
        width={62}
        height={62}
        fit="contain"
        style={{ width: 62, height: 62 }}
      />
    </div>
    <div>
      <div
        style={{
          color: dark ? COLORS.white : COLORS.ink,
          fontSize: 27,
          lineHeight: 1.05,
          fontWeight: 850,
          letterSpacing: -0.7,
        }}
      >
        Bluetooth Device
      </div>
      <div
        style={{
          color: COLORS.blue,
          fontSize: 27,
          lineHeight: 1.05,
          fontWeight: 700,
          letterSpacing: -0.6,
        }}
      >
        Connector
      </div>
    </div>
  </div>
);

const Benefit: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      minHeight: 52,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "0 17px 0 13px",
      borderRadius: 16,
      background: "rgba(255,255,255,0.76)",
      border: "1px solid rgba(40,71,99,0.12)",
      boxShadow: "0 12px 28px rgba(40,71,99,0.07)",
      color: COLORS.navy,
      fontSize: 18,
      fontWeight: 800,
      whiteSpace: "nowrap",
    }}
  >
    <span
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(35,197,82,0.13)",
      }}
    >
      <CheckIcon size={18} />
    </span>
    {children}
  </div>
);

const RouteDevice: React.FC<{
  name: string;
  state: "previous" | "active";
}> = ({ name, state }) => (
  <div
    style={{
      minWidth: 210,
      height: 64,
      display: "flex",
      alignItems: "center",
      gap: 13,
      padding: "0 18px",
      borderRadius: 17,
      background:
        state === "active" ? "rgba(35,197,82,0.12)" : "rgba(82,112,140,0.08)",
      border:
        state === "active"
          ? `1px solid ${COLORS.connected}55`
          : "1px solid rgba(82,112,140,0.16)",
    }}
  >
    <span
      style={{
        width: 13,
        height: 13,
        borderRadius: "50%",
        background: state === "active" ? COLORS.connected : "#a9b2bf",
        boxShadow:
          state === "active" ? `0 0 0 6px ${COLORS.connected}1f` : "none",
      }}
    />
    <div>
      <div
        style={{
          color: COLORS.ink,
          fontSize: 19,
          fontWeight: 800,
          lineHeight: 1.1,
        }}
      >
        {name}
      </div>
      <div
        style={{
          marginTop: 4,
          color: state === "active" ? COLORS.connected : COLORS.inkSoft,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 0.7,
          textTransform: "uppercase",
        }}
      >
        {state === "active" ? "Default output" : "Previous output"}
      </div>
    </div>
  </div>
);

const SelectField: React.FC<{
  label: string;
  value: string;
  helper: string;
  refresh?: boolean;
}> = ({ label, value, helper, refresh = false }) => (
  <div>
    <div
      style={{
        marginBottom: 11,
        color: COLORS.panelText,
        fontSize: 18,
        fontWeight: 750,
      }}
    >
      {label}
    </div>
    <div style={{ display: "flex", gap: 13 }}>
      <div
        style={{
          height: 64,
          flex: 1,
          borderRadius: 12,
          background: "#11141a",
          border: `1px solid ${COLORS.panelEdge}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 19px",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
        }}
      >
        <span
          style={{
            color: COLORS.panelText,
            fontSize: 20,
            fontWeight: 650,
          }}
        >
          {value}
        </span>
        <ChevronIcon />
      </div>
      {refresh ? (
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 12,
            background: "#252a33",
            border: `1px solid ${COLORS.panelEdge}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <RefreshIcon />
        </div>
      ) : null}
    </div>
    <div
      style={{
        marginTop: 11,
        maxWidth: 880,
        color: COLORS.panelMuted,
        fontSize: 16,
        lineHeight: 1.42,
        fontWeight: 550,
      }}
    >
      {helper}
    </div>
  </div>
);

// Designed to be registered as a 1920x960 Remotion Still.
export const MarketplaceHero: React.FC = () => {
  const deck = buildDeck({
    airpods: "connected",
    showEcho: false,
  });
  deck[AIRPODS_INDEX] = {
    kind: "bluetooth",
    state: "connected",
    title: "Echo Dot",
  };

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT,
        color: COLORS.ink,
        overflow: "hidden",
      }}
    >
      <Background />

      <div
        style={{
          position: "absolute",
          width: 640,
          height: 640,
          borderRadius: "50%",
          right: -230,
          top: -280,
          background: "rgba(10,132,255,0.08)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 440,
          height: 440,
          borderRadius: "50%",
          right: 520,
          bottom: -350,
          border: "2px solid rgba(10,132,255,0.12)",
        }}
      />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 58,
          padding: "66px 86px 58px",
        }}
      >
        <div
          style={{
            width: 760,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            zIndex: 2,
          }}
        >
          <div>
            <BrandLockup />

            <div
              style={{
                marginTop: 64,
                color: COLORS.navySoft,
                fontSize: 17,
                fontWeight: 850,
                letterSpacing: 2.2,
                textTransform: "uppercase",
              }}
            >
              One key. Verified playback routing.
            </div>
            <div
              style={{
                marginTop: 14,
                maxWidth: 745,
                color: COLORS.ink,
                fontSize: 82,
                lineHeight: 0.98,
                fontWeight: 880,
                letterSpacing: -4.4,
              }}
            >
              Switch audio
              <br />
              with one press.
            </div>
            <div
              style={{
                marginTop: 27,
                maxWidth: 690,
                color: COLORS.inkSoft,
                fontSize: 27,
                lineHeight: 1.36,
                fontWeight: 560,
              }}
            >
              After pairing, connect your device, move Windows playback, and
              verify the new default output—from one key.
            </div>

            <div
              style={{
                marginTop: 35,
                display: "flex",
                flexWrap: "wrap",
                gap: 11,
              }}
            >
              <Benefit>One-press handoff</Benefit>
              <Benefit>Default output verified</Benefit>
              <Benefit>Stereo or stereo + mic</Benefit>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              color: COLORS.navySoft,
              fontSize: 18,
              fontWeight: 750,
            }}
          >
            <span>Windows 10+</span>
            <span style={{ opacity: 0.45 }}>•</span>
            <span>Stream Deck 6.9+</span>
            <span style={{ opacity: 0.45 }}>•</span>
            <span>No account required</span>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 828,
              height: 746,
              borderRadius: 36,
              background: "rgba(255,255,255,0.80)",
              border: "1px solid rgba(40,71,99,0.12)",
              boxShadow: "0 42px 100px rgba(40,71,99,0.19)",
              backdropFilter: "blur(18px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "35px 34px 30px",
            }}
          >
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    color: COLORS.ink,
                    fontSize: 25,
                    fontWeight: 850,
                    letterSpacing: -0.4,
                  }}
                >
                  Bluetooth handoff complete
                </div>
                <div
                  style={{
                    marginTop: 5,
                    color: COLORS.inkSoft,
                    fontSize: 17,
                    fontWeight: 600,
                  }}
                >
                  Playback follows the device you selected.
                </div>
              </div>
              <div
                style={{
                  height: 39,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "0 14px",
                  borderRadius: 999,
                  color: COLORS.connected,
                  background: "rgba(35,197,82,0.12)",
                  border: `1px solid ${COLORS.connected}44`,
                  fontSize: 15,
                  fontWeight: 850,
                }}
              >
                <CheckIcon size={18} />
                Verified
              </div>
            </div>

            <div style={{ marginTop: 29 }}>
              <StreamDeck
                keys={deck}
                keySize={82}
                keyGlows={{ [AIRPODS_INDEX]: 0.85 }}
                selectedIndex={AIRPODS_INDEX}
              />
            </div>

            <div
              style={{
                width: "100%",
                marginTop: 27,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
              }}
            >
              <RouteDevice name="AirPods Pro" state="previous" />
              <ArrowIcon />
              <RouteDevice name="Echo Dot" state="active" />
            </div>

            <div
              style={{
                width: "100%",
                marginTop: 18,
                height: 50,
                borderRadius: 14,
                background: "rgba(10,132,255,0.08)",
                border: "1px solid rgba(10,132,255,0.16)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                color: COLORS.navy,
                fontSize: 16,
                fontWeight: 800,
              }}
            >
              <span style={{ color: COLORS.blue }}>Audio Profile</span>
              <span style={{ opacity: 0.35 }}>•</span>
              <span>Stereo only (A2DP)</span>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Designed to be registered as a 1920x960 Remotion Still.
export const MarketplacePropertyInspector: React.FC = () => (
  <AbsoluteFill
    style={{
      fontFamily: FONT,
      background:
        "radial-gradient(100% 130% at 88% 0%, #303640 0%, #1c2027 46%, #13161b 100%)",
      color: COLORS.panelText,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
        backgroundSize: "80px 80px",
        opacity: 0.5,
      }}
    />

    <AbsoluteFill
      style={{
        padding: "58px 70px",
        display: "flex",
        flexDirection: "row",
        gap: 50,
      }}
    >
      <div
        style={{
          width: 440,
          height: "100%",
          borderRadius: 30,
          background: "linear-gradient(165deg, #242a32, #171a20)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 38px 80px rgba(0,0,0,0.32)",
          padding: "38px 35px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <BrandLockup dark />

        <div
          style={{
            marginTop: 45,
            color: COLORS.panelMuted,
            fontSize: 14,
            fontWeight: 850,
            letterSpacing: 1.7,
            textTransform: "uppercase",
          }}
        >
          Selected key
        </div>

        <div
          style={{
            marginTop: 18,
            height: 260,
            borderRadius: 24,
            background: "linear-gradient(155deg, #111820, #06080c)",
            border: "1px solid rgba(75,96,121,0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.04), 0 28px 50px rgba(0,0,0,0.30)",
          }}
        >
          <CanvasImage
            src={staticFile("keys/connected.png")}
            width={188}
            height={188}
            fit="contain"
            style={{ width: 188, height: 188 }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 18,
              color: COLORS.white,
              textAlign: "center",
              fontSize: 20,
              fontWeight: 850,
              textShadow: "0 2px 8px rgba(0,0,0,0.9)",
            }}
          >
            AirPods Pro
          </div>
        </div>

        <div
          style={{
            marginTop: 22,
            height: 48,
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            color: COLORS.connected,
            background: "rgba(35,197,82,0.10)",
            border: `1px solid ${COLORS.connected}3d`,
            fontSize: 17,
            fontWeight: 850,
          }}
        >
          <span
            style={{
              width: 11,
              height: 11,
              borderRadius: "50%",
              background: COLORS.connected,
              boxShadow: `0 0 0 6px ${COLORS.connected}1a`,
            }}
          />
          Connected
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 15,
          }}
        >
          {[
            "Paired-device picker",
            "Per-key audio profile",
            "Verified Windows routing",
          ].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: COLORS.panelText,
                fontSize: 17,
                fontWeight: 650,
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(10,132,255,0.13)",
                }}
              >
                <CheckIcon color={COLORS.blueBright} size={17} />
              </span>
              {label}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          height: "100%",
          borderRadius: 30,
          background: "linear-gradient(180deg, #262b33, #1b1f26)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 38px 90px rgba(0,0,0,0.30)",
          padding: "37px 50px 42px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                color: COLORS.white,
                fontSize: 30,
                fontWeight: 850,
                letterSpacing: -0.7,
              }}
            >
              Connect Bluetooth Device
            </div>
            <div
              style={{
                marginTop: 7,
                color: COLORS.panelMuted,
                fontSize: 17,
                fontWeight: 600,
              }}
            >
              Choose the device and audio profile saved to this key.
            </div>
          </div>
          <div
            style={{
              height: 40,
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "0 15px",
              borderRadius: 999,
              color: COLORS.blueBright,
              background: "rgba(10,132,255,0.10)",
              border: "1px solid rgba(10,132,255,0.25)",
              fontSize: 15,
              fontWeight: 850,
            }}
          >
            Windows audio
          </div>
        </div>

        <div
          style={{
            height: 1,
            background: "rgba(255,255,255,0.08)",
            margin: "29px 0 27px",
          }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "240px 1fr",
            gap: "28px 35px",
            alignItems: "start",
          }}
        >
          <div
            style={{
              color: COLORS.panelText,
              fontSize: 18,
              fontWeight: 750,
              paddingTop: 19,
            }}
          >
            Title
          </div>
          <div
            style={{
              height: 64,
              borderRadius: 12,
              background: "#11141a",
              border: `1px solid ${COLORS.panelEdge}`,
              display: "flex",
              alignItems: "center",
              padding: "0 19px",
              color: COLORS.panelText,
              fontSize: 20,
              fontWeight: 650,
            }}
          >
            AirPods Pro
          </div>

          <div
            style={{
              color: COLORS.panelText,
              fontSize: 18,
              fontWeight: 750,
              paddingTop: 1,
            }}
          >
            Bluetooth settings
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 29 }}>
            <SelectField
              label="Bluetooth Device"
              value="AirPods Pro"
              helper="Select the paired device to connect. Don't see it? Pair it in your system Bluetooth settings, then click ⟳."
              refresh
            />
            <SelectField
              label="Audio Profile"
              value="Stereo + microphone (A2DP + Hands-Free)"
              helper="Stereo only disables the Windows Hands-Free microphone profile, which can reduce playback quality. Changes apply on the next key press."
            />
          </div>
        </div>

        <div
          style={{
            marginTop: "auto",
            height: 62,
            borderRadius: 16,
            background: "rgba(35,197,82,0.09)",
            border: `1px solid ${COLORS.connected}33`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "rgba(35,197,82,0.13)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckIcon size={21} />
            </span>
            <span
              style={{
                color: COLORS.panelText,
                fontSize: 17,
                fontWeight: 750,
              }}
            >
              On the next press, the selected profile is applied before audio is
              routed.
            </span>
          </div>
          <span
            style={{
              color: COLORS.connected,
              fontSize: 15,
              fontWeight: 850,
              letterSpacing: 0.8,
              textTransform: "uppercase",
            }}
          >
            Ready
          </span>
        </div>
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);
