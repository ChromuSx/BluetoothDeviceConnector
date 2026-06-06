import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Background } from "./components/Background";
import { Caption } from "./components/Caption";
import { Closing } from "./components/Closing";
import { Footer } from "./components/Footer";
import { Popup } from "./components/Popup";
import { SoftwareSetup } from "./components/SoftwareSetup";
import { StatusTrail } from "./components/StatusTrail";
import {
  AIRPODS_INDEX,
  ECHO_INDEX,
  StreamDeck,
  buildDeck,
} from "./components/StreamDeck";
import { TapIndicator } from "./components/TapIndicator";
import { BtState } from "./components/Key";
import { COLORS } from "./theme";

// Timeline (frames @ 60fps, 1620 total = 27s)
const DURATION = 1620;
const SETUP_A_DURATION = 330;
const SETUP_B_IN = 300;
const SETUP_B_DURATION = 270;
const STAGE_IN = 570;
const AIR_TAP = 670;
const AIR_CONNECTED_AT = 805;
const AIR_DISCONNECT_TAP = 945;
const AIR_DISCONNECTED_AT = 1080;
const ECHO_TAP = 1210;
const ECHO_CONNECTED_AT = 1345;
const CLOSE_AT = 1470;

const HERO_X = 96;
const ECHO_X = 346;
const HERO_Y = 254;

function deckStates(frame: number): { airpods: BtState; echo: BtState } {
  let airpods: BtState = "disconnected";
  let echo: BtState = "disconnected";

  if (frame >= AIR_TAP && frame < AIR_CONNECTED_AT) {
    airpods = "connecting";
  } else if (frame >= AIR_CONNECTED_AT && frame < AIR_DISCONNECT_TAP) {
    airpods = "connected";
  } else if (frame >= AIR_DISCONNECT_TAP && frame < AIR_DISCONNECTED_AT) {
    airpods = "connecting";
  }

  if (frame >= ECHO_TAP && frame < ECHO_CONNECTED_AT) {
    echo = "connecting";
  } else if (frame >= ECHO_CONNECTED_AT) {
    echo = "connected";
  }

  return { airpods, echo };
}

function activeState(frame: number): BtState {
  if (frame >= ECHO_TAP) return deckStates(frame).echo;
  if (frame >= AIR_DISCONNECT_TAP && frame < AIR_DISCONNECTED_AT) {
    return "connecting";
  }
  if (frame >= AIR_DISCONNECTED_AT) return "disconnected";
  return deckStates(frame).airpods;
}

const tapPress = (frame: number, at: number) =>
  interpolate(frame, [at - 6, at, at + 12, at + 22], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const ProfileIcon: React.FC<{ kind: "audio" | "mic" | "speaker" }> = ({
  kind,
}) => (
  <svg width="24" height="24" viewBox="0 0 48 48">
    {kind === "audio" ? (
      <path
        d="M8 19v10h7l11 9V10L15 19H8Zm26-3a10 10 0 0 1 0 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ) : null}
    {kind === "mic" ? (
      <path
        d="M24 6a6 6 0 0 0-6 6v11a6 6 0 0 0 12 0V12a6 6 0 0 0-6-6Zm13 17a13 13 0 0 1-26 0M24 36v6m-7 0h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ) : null}
    {kind === "speaker" ? (
      <path
        d="M10 18v12h7l12 9V9L17 18H10Zm26-4a12 12 0 0 1 0 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ) : null}
  </svg>
);

const AudioProfileBadges: React.FC<{
  mode: "headset" | "speaker";
  opacity: number;
}> = ({ mode, opacity }) => {
  const rows =
    mode === "headset"
      ? [
          { icon: "audio" as const, label: "Audio output", detail: "A2DP music" },
          { icon: "mic" as const, label: "Microphone", detail: "Handsfree calls" },
        ]
      : [
          { icon: "speaker" as const, label: "Speaker audio", detail: "A2DP output" },
          { icon: "audio" as const, label: "No mic required", detail: "Speaker-only devices" },
        ];

  return (
    <div
      style={{
        position: "absolute",
        right: -284,
        top: 158,
        width: 244,
        display: "grid",
        gap: 10,
        opacity,
        transform: `translateX(${(1 - opacity) * 16}px)`,
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      {rows.map((row) => (
        <div
          key={row.label}
          style={{
            height: 68,
            borderRadius: 14,
            background: "rgba(255,255,255,0.82)",
            border: "1px solid rgba(82,112,140,0.18)",
            boxShadow: "0 14px 32px rgba(40,71,99,0.11)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 15px",
            color: COLORS.ink,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 11,
              background: "rgba(10,132,255,0.12)",
              color: COLORS.blue,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ProfileIcon kind={row.icon} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 850, lineHeight: 1 }}>
              {row.label}
            </div>
            <div
              style={{
                marginTop: 5,
                fontSize: 13,
                fontWeight: 700,
                color: COLORS.inkSoft,
              }}
            >
              {row.detail}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const WorkflowBadges: React.FC<{ opacity: number }> = ({ opacity }) => {
  const rows = [
    {
      label: "No Windows settings",
      detail: "Skip Bluetooth menus",
      icon: (
        <path
          d="M9 11h30v22H9V11Zm0 7h30M16 27l16-16m-2 17 3 3"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
    {
      label: "Live status sync",
      detail: "Checks real device state",
      icon: (
        <path
          d="M36 14a15 15 0 0 0-25.3 7M12 14v7h7M12 34a15 15 0 0 0 25.3-7M36 34v-7h-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: -292,
        top: 152,
        width: 252,
        display: "grid",
        gap: 10,
        opacity,
        transform: `translateX(${(1 - opacity) * -16}px)`,
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      {rows.map((row) => (
        <div
          key={row.label}
          style={{
            height: 68,
            borderRadius: 14,
            background: "rgba(255,255,255,0.84)",
            border: "1px solid rgba(82,112,140,0.18)",
            boxShadow: "0 14px 32px rgba(40,71,99,0.11)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 15px",
            color: COLORS.ink,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 11,
              background: "rgba(10,132,255,0.12)",
              color: COLORS.blue,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 48 48">
              {row.icon}
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 850, lineHeight: 1 }}>
              {row.label}
            </div>
            <div
              style={{
                marginTop: 5,
                fontSize: 13,
                fontWeight: 700,
                color: COLORS.inkSoft,
              }}
            >
              {row.detail}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Stage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - STAGE_IN);

  const intro = spring({
    frame: localFrame,
    fps,
    config: { damping: 18, mass: 0.9 },
  });
  const stageIn = interpolate(frame, [STAGE_IN - 24, STAGE_IN + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [CLOSE_AT - 8, CLOSE_AT + 24], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const introScale = interpolate(intro, [0, 1], [0.92, 1]);
  const slowZoom = interpolate(frame, [STAGE_IN, DURATION], [1, 1.028], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = introScale * slowZoom;
  const floatY = Math.sin(frame / 40) * 4;

  const airConnectPress = tapPress(frame, AIR_TAP);
  const airDisconnectPress = tapPress(frame, AIR_DISCONNECT_TAP);
  const echoPress = tapPress(frame, ECHO_TAP);
  const airGlow =
    frame >= AIR_CONNECTED_AT && frame < AIR_DISCONNECT_TAP
      ? interpolate(frame, [AIR_CONNECTED_AT, AIR_CONNECTED_AT + 18], [1, 0.4], {
          extrapolateRight: "clamp",
        })
      : 0;
  const echoGlow =
    frame >= ECHO_CONNECTED_AT
      ? interpolate(frame, [ECHO_CONNECTED_AT, ECHO_CONNECTED_AT + 18], [1, 0.42], {
          extrapolateRight: "clamp",
        })
      : 0;
  const workflowOpacity = interpolate(
    frame,
    [STAGE_IN + 8, STAGE_IN + 28, AIR_TAP - 22, AIR_TAP + 2],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  const syncGlow = interpolate(
    frame,
    [STAGE_IN + 14, STAGE_IN + 40, AIR_TAP - 30, AIR_TAP - 8],
    [0, 0.42, 0.42, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  const headsetProfiles = interpolate(
    frame,
    [AIR_TAP - 16, AIR_TAP + 20, ECHO_TAP - 50, ECHO_TAP - 22],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  const speakerProfiles = interpolate(
    frame,
    [ECHO_TAP - 18, ECHO_TAP + 22, CLOSE_AT - 46, CLOSE_AT - 18],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const states = deckStates(frame);
  const deck = buildDeck({
    airpods: states.airpods,
    echo: states.echo,
    showEcho: true,
  });

  return (
    <AbsoluteFill style={{ opacity: stageIn * fadeOut }}>
      <div style={{ position: "absolute", left: "50%", top: "52%" }}>
        <div
          style={{
            transform: `translate(-50%, -50%) translateY(${floatY}px) scale(${scale})`,
            transformOrigin: "center",
          }}
        >
          <div style={{ position: "relative", width: 692 }}>
            <StreamDeck
              keys={deck}
              keyPresses={{
                [AIRPODS_INDEX]: Math.max(airConnectPress, airDisconnectPress),
                [ECHO_INDEX]: echoPress,
              }}
              keyGlows={{
                [AIRPODS_INDEX]: Math.max(airGlow, syncGlow),
                [ECHO_INDEX]: Math.max(echoGlow, syncGlow * 0.82),
              }}
            />
            <StatusTrail state={activeState(frame)} />
            <WorkflowBadges opacity={workflowOpacity} />
            <AudioProfileBadges mode="headset" opacity={headsetProfiles} />
            <AudioProfileBadges mode="speaker" opacity={speakerProfiles} />
            <Sequence from={AIR_TAP - 18} durationInFrames={52} layout="none">
              <TapWrap x={HERO_X} />
            </Sequence>
            <Sequence
              from={AIR_DISCONNECT_TAP - 18}
              durationInFrames={52}
              layout="none"
            >
              <TapWrap x={HERO_X} />
            </Sequence>
            <Sequence from={ECHO_TAP - 18} durationInFrames={52} layout="none">
              <TapWrap x={ECHO_X} />
            </Sequence>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const TapWrap: React.FC<{ x: number }> = ({ x }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return <TapIndicator x={x} y={HERO_Y} progress={frame / durationInFrames} />;
};

const audioVol =
  (a: number, b: number, c: number, d: number, peak: number) =>
  (f: number) =>
    interpolate(f, [a, b, c, d], [0, peak, peak, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

export const BluetoothPromo: React.FC = () => {
  const frame = useCurrentFrame();
  const footerOpacity = interpolate(frame, [STAGE_IN, STAGE_IN + 30, CLOSE_AT - 30, CLOSE_AT], [
    0, 1, 1, 0,
  ]);

  return (
    <AbsoluteFill style={{ background: COLORS.bgBottom }}>
      <Background />

      <Sequence from={0} durationInFrames={SETUP_A_DURATION}>
        <SoftwareSetup
          title="AirPods"
          device="AirPods Pro"
          selectedIndex={AIRPODS_INDEX}
          stepLabel="Key 1"
          stepTitle="Add the Bluetooth action"
          stepSubtitle="Set the classic Title field, then choose the paired device."
          showDrag
          duration={SETUP_A_DURATION}
        />
      </Sequence>
      <Sequence from={SETUP_B_IN} durationInFrames={SETUP_B_DURATION}>
        <SoftwareSetup
          title="Echo Dot"
          device="Amazon Echo Dot"
          selectedIndex={ECHO_INDEX}
          showEcho
          stepLabel="Key 2"
          stepTitle="Use the same action again"
          stepSubtitle="Each key keeps its own title and Bluetooth device."
          showDrag
          duration={SETUP_B_DURATION}
        />
      </Sequence>

      <Stage />

      <Sequence from={590} durationInFrames={300}>
        <Caption
          eyebrow="One press"
          title="No Windows settings"
          subtitle="Audio output and microphone switch from the key"
        />
      </Sequence>
      <Sequence from={900} durationInFrames={270}>
        <Caption
          eyebrow="Same key"
          title="Press again to disconnect"
          subtitle="The selected device toggles back to disconnected"
          accent={COLORS.blue}
        />
      </Sequence>
      <Sequence from={1160} durationInFrames={300}>
        <Caption
          eyebrow="Multiple keys"
          title="One key per audio device"
          subtitle="Headsets, speakers, and Bluetooth mics stay separate"
          accent={COLORS.connected}
        />
      </Sequence>

      <Sequence from={AIR_CONNECTED_AT} durationInFrames={114}>
        <Popup
          title="Connected!"
          subtitle="AirPods Pro audio + mic"
          color={COLORS.connected}
          icon="check"
          outAt={86}
        />
      </Sequence>
      <Sequence from={AIR_DISCONNECTED_AT} durationInFrames={118}>
        <Popup
          title="Disconnected"
          subtitle="AirPods Pro audio + mic"
          color={COLORS.blue}
          icon="bluetooth"
          outAt={90}
        />
      </Sequence>
      <Sequence from={ECHO_CONNECTED_AT} durationInFrames={118}>
        <Popup
          title="Connected!"
          subtitle="Amazon Echo Dot speaker audio"
          color={COLORS.connected}
          icon="check"
          outAt={90}
        />
      </Sequence>

      <Footer opacity={footerOpacity} />

      <Sequence from={CLOSE_AT} durationInFrames={DURATION - CLOSE_AT}>
        <Closing />
      </Sequence>

      <Audio
        src={staticFile("audio/music.mp3")}
        volume={audioVol(0, 36, DURATION - 70, DURATION, 0.55)}
      />
      {[AIR_TAP, AIR_DISCONNECT_TAP, ECHO_TAP].map((at) => (
        <Sequence key={at} from={at} durationInFrames={20}>
          <Audio src={staticFile("audio/click.mp3")} volume={0.8} />
        </Sequence>
      ))}
      {[AIR_CONNECTED_AT, ECHO_CONNECTED_AT].map((at) => (
        <Sequence key={at} from={at} durationInFrames={70}>
          <Audio src={staticFile("audio/connected.mp3")} volume={0.9} />
        </Sequence>
      ))}
      <Sequence from={STAGE_IN - 8} durationInFrames={40}>
        <Audio src={staticFile("audio/whoosh.mp3")} volume={0.55} />
      </Sequence>
      <Sequence from={CLOSE_AT} durationInFrames={60}>
        <Audio src={staticFile("audio/whoosh.mp3")} volume={0.5} />
      </Sequence>
    </AbsoluteFill>
  );
};
