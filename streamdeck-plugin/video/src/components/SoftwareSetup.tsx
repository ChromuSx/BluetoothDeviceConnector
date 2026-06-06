import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, FONT } from "../theme";
import {
  AIRPODS_INDEX,
  buildDeck,
} from "./StreamDeck";
import { Key } from "./Key";

const DEVICES = [
  { name: "AirPods Pro", tag: "headset" },
  { name: "Sony WH-1000XM4", tag: "headset" },
  { name: "Amazon Echo Dot", tag: "speaker" },
  { name: "JBL Flip 6", tag: "speaker" },
  { name: "Bose QC45", tag: "headset" },
];

const TAG_ICONS: Record<string, React.ReactNode> = {
  headset: (
    <path
      d="M5 13a7 7 0 0 1 14 0v5a2 2 0 0 1-2 2h-2v-7h4M5 13v5a2 2 0 0 0 2 2h2v-7H5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  speaker: (
    <path
      d="M4 9v6h4l6 5V4L8 9H4Zm14-1a5 5 0 0 1 0 8"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

const BluetoothMark: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path
      d="M24 6v36l11-9-22-18h22l-11-9"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ActionRow: React.FC<{ active?: boolean }> = ({ active = false }) => (
  <div
    style={{
      height: 46,
      borderRadius: 8,
      background: active ? "#0e7afe" : "#343434",
      border: `1px solid ${active ? "#2490ff" : "#4b4b4b"}`,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "0 12px",
      color: "#f4f7fb",
      fontSize: 14,
      fontWeight: 700,
    }}
  >
    <span
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        background: "#161c24",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: COLORS.blueBright,
      }}
    >
      <BluetoothMark />
    </span>
    Connect Bluetooth Device
  </div>
);

const ActionGhost: React.FC<{
  progress: number;
  opacity: number;
  selectedIndex: number;
  label?: string;
}> = ({ progress, opacity, selectedIndex, label = "Connect Bluetooth Device" }) => {
  const targetX = selectedIndex === AIRPODS_INDEX ? 382 : 558;
  const targetY = 350;
  const x = interpolate(progress, [0, 1], [1168, targetX], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(progress, [0, 1], [153, targetY], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(progress, [0, 0.82, 1], [1, 1, 0.58], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rotate = interpolate(progress, [0, 1], [0, -2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1480,
        height: 790,
        pointerEvents: "none",
        zIndex: 5,
        opacity,
      }}
    >
      <svg
        width="1480"
        height="790"
        viewBox="0 0 1480 790"
        style={{ position: "absolute", inset: 0, opacity: opacity * 0.7 }}
      >
        <path
          d={`M1298 176 C1038 150, 820 244, ${targetX + 18} ${targetY + 18}`}
          fill="none"
          stroke={COLORS.blueBright}
          strokeWidth="3"
          strokeDasharray="10 12"
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: 250,
          height: 46,
          borderRadius: 8,
          background: "rgba(14,122,254,0.92)",
          border: "1px solid rgba(124,198,255,0.9)",
          boxShadow: "0 18px 40px rgba(6,42,95,0.34)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 12px",
          color: "#fff",
          fontSize: 14,
          fontWeight: 800,
          transform: `scale(${scale}) rotate(${rotate}deg)`,
          transformOrigin: "left top",
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: "#141b24",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: COLORS.blueBright,
            flexShrink: 0,
          }}
        >
          <BluetoothMark />
        </span>
        {label}
      </div>
    </div>
  );
};

const StepNote: React.FC<{
  label?: string;
  title?: string;
  subtitle?: string;
  opacity: number;
}> = ({ label, title, subtitle, opacity }) => {
  if (!label && !title && !subtitle) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 34,
        top: 76,
        width: 392,
        borderRadius: 12,
        background: "rgba(20,20,20,0.74)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 18px 50px rgba(0,0,0,0.18)",
        padding: 16,
        color: "#f1f1f1",
        zIndex: 6,
        opacity,
      }}
    >
      {label ? (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: 24,
            borderRadius: 999,
            padding: "0 10px",
            marginBottom: 9,
            background: "rgba(14,122,254,0.20)",
            border: "1px solid rgba(74,166,255,0.38)",
            color: COLORS.blueBright,
            fontSize: 11,
            fontWeight: 900,
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
      ) : null}
      {title ? (
        <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.1 }}>
          {title}
        </div>
      ) : null}
      {subtitle ? (
        <div
          style={{
            marginTop: 7,
            color: "#bfc4ca",
            fontSize: 13,
            fontWeight: 650,
            lineHeight: 1.35,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
};

const DeviceTag: React.FC<{ tag: string; selected?: boolean }> = ({
  tag,
  selected = false,
}) => (
  <span
    style={{
      height: 24,
      minWidth: 82,
      borderRadius: 999,
      padding: "0 8px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      background: selected ? "rgba(255,255,255,0.22)" : "#4a4a4a",
      color: selected ? "#fff" : "#b8b8b8",
      fontSize: 11,
      fontWeight: 800,
    }}
  >
    <svg width="13" height="13" viewBox="0 0 24 24">
      {TAG_ICONS[tag]}
    </svg>
    {tag}
  </span>
);

const Field: React.FC<{
  label: string;
  children: React.ReactNode;
  helper?: string;
}> = ({ label, children, helper }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "150px 1fr",
      gap: 14,
      alignItems: "start",
      marginBottom: 14,
    }}
  >
    <div
      style={{
        color: "#b7b7b7",
        fontSize: 13,
        fontWeight: 700,
        paddingTop: 11,
      }}
    >
      {label}
    </div>
    <div>
      {children}
      {helper ? (
        <div
          style={{
            marginTop: 7,
            color: "#8b8b8b",
            fontSize: 11,
            lineHeight: 1.35,
          }}
        >
          {helper}
        </div>
      ) : null}
    </div>
  </div>
);

const TextBox: React.FC<{ value: string; caret?: boolean }> = ({
  value,
  caret = false,
}) => (
  <div
    style={{
      height: 40,
      borderRadius: 5,
      background: "#3c3c3c",
      border: "1px solid #5a5a5a",
      color: "#f0f0f0",
      padding: "0 12px",
      display: "flex",
      alignItems: "center",
      fontSize: 14,
      fontWeight: 600,
    }}
  >
    {value}
    {caret ? (
      <span
        style={{
          width: 2,
          height: 18,
          marginLeft: 2,
          background: "#f0f0f0",
        }}
      />
    ) : null}
  </div>
);

const SelectBox: React.FC<{ value: string; open: number }> = ({
  value,
  open,
}) => (
  <div
    style={{
      height: 40,
      borderRadius: 5,
      background: "#3c3c3c",
      border: `1px solid ${open > 0.4 ? "#0e7afe" : "#5a5a5a"}`,
      color: value === "Select a device" ? "#9f9f9f" : "#f0f0f0",
      padding: "0 12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      fontSize: 14,
      fontWeight: 600,
    }}
  >
    {value}
    <svg width="14" height="14" viewBox="0 0 24 24" style={{ opacity: 0.8 }}>
      <path
        d="M6 9l6 6 6-6"
        fill="none"
        stroke="#d8d8d8"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

export const SoftwareSetup: React.FC<{
  title: string;
  device: string;
  selectedIndex: number;
  showEcho?: boolean;
  stepLabel?: string;
  stepTitle?: string;
  stepSubtitle?: string;
  showDrag?: boolean;
  duration?: number;
}> = ({
  title,
  device,
  selectedIndex,
  showEcho = false,
  stepLabel,
  stepTitle,
  stepSubtitle,
  showDrag = false,
  duration = 300,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18, mass: 0.75 } });
  const out = interpolate(frame, [duration - 24, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(enter, 1) * out;
  const y = interpolate(enter, [0, 1], [28, 0]);

  const titleCount = Math.round(
    interpolate(frame, [24, 74], [0, title.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const typedTitle = title.slice(0, titleCount);
  const dropdownOpen = interpolate(frame, [84, 110, 142, 168], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const selected = frame > 142;
  const listHeight = Math.round(dropdownOpen * 124);
  const deck = buildDeck({
    airpods: "disconnected",
    echo: "disconnected",
    showEcho,
  });
  const noteOpacity = interpolate(
    frame,
    [6, 24, duration - 42, duration - 18],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  const dragProgress = interpolate(frame, [18, 72], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dragOpacity = showDrag
    ? interpolate(frame, [10, 22, 64, 86], [0, 0.92, 0.92, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT,
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          width: 1480,
          height: 790,
          borderRadius: 18,
          overflow: "hidden",
          background: "#242424",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 36px 90px rgba(20,30,60,0.30)",
          position: "relative",
        }}
      >
        <StepNote
          label={stepLabel}
          title={stepTitle}
          subtitle={stepSubtitle}
          opacity={noteOpacity}
        />
        <ActionGhost
          progress={dragProgress}
          opacity={dragOpacity}
          selectedIndex={selectedIndex}
        />
        <div
          style={{
            height: 58,
            background: "#1b1b1b",
            borderBottom: "1px solid #383838",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 22px",
            color: "#d7d7d7",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: COLORS.blue,
              }}
            />
            Stream Deck
          </div>
          <div style={{ color: "#a8a8a8" }}>Stream Deck MK.2 / Default Profile</div>
          <div style={{ color: "#8e8e8e" }}>Marketplace</div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 330px",
            height: 460,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "radial-gradient(circle at 50% 46%, #3a3a3a 0%, #2a2a2a 46%, #232323 100%)",
            }}
          >
            <div>
              <div
                style={{
                  color: "#dadada",
                  fontSize: 17,
                  fontWeight: 800,
                  textAlign: "center",
                  marginBottom: 20,
                }}
              >
                Default Profile
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 74px)",
                  gridAutoRows: "74px",
                  gap: 15,
                  padding: 24,
                  borderRadius: 24,
                  background: "#161616",
                  border: "1px solid #3d3d3d",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                {deck.map((spec, index) => (
                  <Key
                    key={index}
                    spec={spec}
                    size={74}
                    selected={index === selectedIndex}
                  />
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              borderLeft: "1px solid #383838",
              padding: 18,
              background: "#2e2e2e",
              color: "#d6d6d6",
            }}
          >
            <div
              style={{
                height: 36,
                borderRadius: 6,
                background: "#202020",
                border: "1px solid #454545",
                color: "#828282",
                display: "flex",
                alignItems: "center",
                paddingLeft: 12,
                fontSize: 13,
                marginBottom: 18,
              }}
            >
              Search actions
            </div>
            <div style={{ fontSize: 13, color: "#a4a4a4", fontWeight: 800 }}>
              Bluetooth Device Connector
            </div>
            <div style={{ marginTop: 10 }}>
              <ActionRow active />
            </div>
            <div style={{ marginTop: 10 }}>
              <ActionRow />
            </div>
          </div>
        </div>

        <div
          style={{
            height: 272,
            background: "#2d2d2d",
            borderTop: "1px solid #3f3f3f",
            padding: "22px 28px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "#d6d6d6",
              fontSize: 16,
              fontWeight: 800,
              marginBottom: 18,
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: "#141b24",
                color: COLORS.blueBright,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BluetoothMark />
            </span>
            Connect Bluetooth Device
          </div>

          <div style={{ width: 880 }}>
            <Field
              label="Title"
              helper={`This text appears on the selected key: ${title}.`}
            >
              <TextBox value={typedTitle} caret={titleCount < title.length} />
            </Field>
            <Field
              label="Bluetooth Device"
              helper="The saved device toggles when this key is pressed."
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 48px", gap: 8 }}>
                <SelectBox
                  value={selected ? device : "Select a device"}
                  open={dropdownOpen}
                />
                <div
                  style={{
                    height: 40,
                    borderRadius: 5,
                    border: "1px solid #5a5a5a",
                    background: "#3c3c3c",
                    color: "#d8d8d8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 800,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      d="M20 6v5h-5M4 18v-5h5M18.6 9A7 7 0 0 0 6.4 6.4L4 8.8M5.4 15A7 7 0 0 0 17.6 17.6L20 15.2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <div
                style={{
                  height: listHeight,
                  overflow: "hidden",
                  marginTop: 7,
                  borderRadius: 6,
                  background: listHeight > 4 ? "#242424" : "transparent",
                  border: listHeight > 4 ? "1px solid #4a4a4a" : "none",
                }}
              >
                <div style={{ padding: 5 }}>
                  {DEVICES.map((item, index) => {
                    const isTarget = item.name === device;
                    const rowSelected = selected && isTarget;
                    const appear = interpolate(
                      frame,
                      [94 + index * 4, 108 + index * 4],
                      [0, 1],
                      {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      }
                    );
                    return (
                      <div
                        key={item.name}
                        style={{
                          height: 34,
                          borderRadius: 5,
                          padding: "0 10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: rowSelected ? "#0e7afe" : "transparent",
                          opacity: appear,
                          color: "#f2f2f2",
                          fontSize: 13,
                          fontWeight: rowSelected ? 800 : 600,
                        }}
                      >
                        {item.name}
                        <DeviceTag tag={item.tag} selected={rowSelected} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </Field>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
