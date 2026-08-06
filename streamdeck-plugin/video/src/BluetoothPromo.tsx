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
  StreamDeck,
  buildDeck,
} from "./components/StreamDeck";
import { TapIndicator } from "./components/TapIndicator";
import { BtState } from "./components/Key";
import { COLORS, FONT } from "./theme";

// Timeline (frames @ 60fps, 1620 total = 27s)
const DURATION = 1620;
const INITIAL_SETUP_DURATION = 280;
const AIR_STAGE_IN = 250;
const AIR_TAP = 340;
const AIR_CONNECTED_AT = 455;
const EDIT_IN = 550;
const EDIT_DURATION = 310;
const HANDOFF_STAGE_IN = 840;
const HANDOFF_TAP = 935;
const PREVIOUS_DISCONNECTED_AT = 1035;
const ROUTE_AT = 1170;
const ECHO_CONNECTED_AT = 1260;
const CLOSE_AT = 1450;

const AIR_STAGE_DURATION = EDIT_IN - AIR_STAGE_IN + 18;
const HANDOFF_STAGE_DURATION = CLOSE_AT - HANDOFF_STAGE_IN + 18;

const HERO_X = 96;
const HERO_Y = 254;

type StageMode = "airpods" | "handoff";

type RoutePhase = {
  order: number;
  start: number;
  eyebrow: string;
  title: string;
  detail: string;
  note: string;
  color: string;
};

const tapPress = (frame: number, at: number) =>
  interpolate(frame, [at - 6, at, at + 12, at + 22], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

function routePhase(mode: StageMode, frame: number): RoutePhase {
  if (mode === "airpods") {
    const tapAt = AIR_TAP - AIR_STAGE_IN;
    const connectedAt = AIR_CONNECTED_AT - AIR_STAGE_IN;

    if (frame < tapAt) {
      return {
        order: 0,
        start: 0,
        eyebrow: "Selected device",
        title: "AirPods Pro",
        detail: "Stereo + microphone profile",
        note: "The microphone is used only when Windows exposes a matching endpoint.",
        color: COLORS.blue,
      };
    }
    if (frame < connectedAt) {
      return {
        order: 1,
        start: tapAt,
        eyebrow: "Bluetooth audio",
        title: "AirPods Pro",
        detail: "Connecting the requested services",
        note: "Windows routing follows only after the Bluetooth connection succeeds.",
        color: COLORS.connecting,
      };
    }
    return {
      order: 2,
      start: connectedAt,
      eyebrow: "Windows default output",
      title: "Headphones (AirPods Pro)",
      detail: "Playback endpoint verified",
      note: "A matching microphone is also attempted when one is exposed.",
      color: COLORS.connected,
    };
  }

  const tapAt = HANDOFF_TAP - HANDOFF_STAGE_IN;
  const disconnectedAt = PREVIOUS_DISCONNECTED_AT - HANDOFF_STAGE_IN;
  const routeAt = ROUTE_AT - HANDOFF_STAGE_IN;
  const connectedAt = ECHO_CONNECTED_AT - HANDOFF_STAGE_IN;

  if (frame < tapAt) {
    return {
      order: 0,
      start: 0,
      eyebrow: "Current Windows output",
      title: "Headphones (AirPods Pro)",
      detail: "Next target: Echo Dot",
      note: "The same key remembers its previous audio target.",
      color: COLORS.blue,
    };
  }
  if (frame < disconnectedAt) {
    return {
      order: 1,
      start: tapAt,
      eyebrow: "1 · Previous target",
      title: "AirPods Pro",
      detail: "Disconnecting audio services",
      note: "The new connection waits for the previous target to disconnect.",
      color: COLORS.blue,
    };
  }
  if (frame < routeAt) {
    return {
      order: 2,
      start: disconnectedAt,
      eyebrow: "2 · Selected device",
      title: "Echo Dot",
      detail: "Connecting stereo playback",
      note: "Speaker-only devices do not require a microphone endpoint.",
      color: COLORS.connecting,
    };
  }
  if (frame < connectedAt) {
    return {
      order: 3,
      start: routeAt,
      eyebrow: "3 · Windows output",
      title: "Speakers (Echo Dot)",
      detail: "Selecting and verifying default playback",
      note: "Success is shown only after the matching endpoint is confirmed.",
      color: COLORS.blue,
    };
  }
  return {
    order: 4,
    start: connectedAt,
    eyebrow: "Windows default output",
    title: "Speakers (Echo Dot)",
    detail: "Playback endpoint verified",
    note: "AirPods is no longer the active playback target.",
    color: COLORS.connected,
  };
}

const RoutingCard: React.FC<{
  mode: StageMode;
  frame: number;
  opacity: number;
}> = ({ mode, frame, opacity }) => {
  const phase = routePhase(mode, frame);
  const phaseIn = interpolate(frame, [phase.start, phase.start + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const handoffSteps = ["Disconnect", "Connect", "Route"];

  return (
    <div
      style={{
        position: "absolute",
        right: -382,
        top: 126,
        width: 342,
        padding: 22,
        borderRadius: 20,
        background: "rgba(255,255,255,0.88)",
        border: "1px solid rgba(82,112,140,0.18)",
        boxShadow: "0 22px 52px rgba(40,71,99,0.16)",
        fontFamily: FONT,
        opacity,
        transform: `translateX(${(1 - opacity) * 18}px)`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          color: COLORS.navySoft,
          fontSize: 14,
          fontWeight: 850,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: phase.color,
            boxShadow: `0 0 0 5px ${phase.color}22`,
          }}
        />
        {phase.eyebrow}
      </div>

      <div
        style={{
          marginTop: 18,
          minHeight: 94,
          opacity: phaseIn,
          transform: `translateY(${(1 - phaseIn) * 8}px)`,
        }}
      >
        <div
          style={{
            color: COLORS.ink,
            fontSize: 24,
            fontWeight: 850,
            lineHeight: 1.12,
          }}
        >
          {phase.title}
        </div>
        <div
          style={{
            marginTop: 8,
            color: phase.color,
            fontSize: 16,
            fontWeight: 800,
            lineHeight: 1.2,
          }}
        >
          {phase.detail}
        </div>
      </div>

      {mode === "handoff" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 7,
            margin: "12px 0 17px",
          }}
        >
          {handoffSteps.map((label, index) => {
            const step = index + 1;
            const active = phase.order === step;
            const complete = phase.order > step;
            const color = active
              ? phase.color
              : complete
                ? COLORS.connected
                : "rgba(82,112,140,0.28)";
            return (
              <div key={label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    height: 5,
                    borderRadius: 999,
                    background: color,
                    boxShadow: active ? `0 0 12px ${phase.color}66` : "none",
                  }}
                />
                <div
                  style={{
                    marginTop: 7,
                    color: active || complete ? COLORS.ink : COLORS.inkSoft,
                    fontSize: 12,
                    fontWeight: active ? 850 : 700,
                  }}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            height: 1,
            margin: "12px 0 17px",
            background: "rgba(82,112,140,0.16)",
          }}
        />
      )}

      <div
        style={{
          color: COLORS.inkSoft,
          fontSize: 13,
          fontWeight: 650,
          lineHeight: 1.35,
        }}
      >
        {phase.note}
      </div>
    </div>
  );
};

const SameKeyCard: React.FC<{
  mode: StageMode;
  opacity: number;
}> = ({ mode, opacity }) => (
  <div
    style={{
      position: "absolute",
      left: -358,
      top: 148,
      width: 318,
      padding: 22,
      borderRadius: 20,
      background: "rgba(255,255,255,0.86)",
      border: "1px solid rgba(82,112,140,0.18)",
      boxShadow: "0 22px 52px rgba(40,71,99,0.14)",
      fontFamily: FONT,
      opacity,
      transform: `translateX(${(1 - opacity) * -18}px)`,
    }}
  >
    <div
      style={{
        color: COLORS.navySoft,
        fontSize: 14,
        fontWeight: 850,
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}
    >
      Same Stream Deck key
    </div>
    <div
      style={{
        marginTop: 13,
        color: COLORS.ink,
        fontSize: 26,
        fontWeight: 850,
        lineHeight: 1.15,
      }}
    >
      {mode === "airpods" ? "AirPods Pro" : "AirPods → Echo Dot"}
    </div>
    <div
      style={{
        marginTop: 10,
        color: mode === "airpods" ? COLORS.blue : COLORS.connected,
        fontSize: 15,
        fontWeight: 750,
        lineHeight: 1.3,
      }}
    >
      {mode === "airpods"
        ? "Stereo + microphone selected"
        : "Previous target retained for the next press"}
    </div>
  </div>
);

const ConnectionStage: React.FC<{
  mode: StageMode;
  duration: number;
}> = ({ mode, duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tapAt =
    mode === "airpods"
      ? AIR_TAP - AIR_STAGE_IN
      : HANDOFF_TAP - HANDOFF_STAGE_IN;
  const connectedAt =
    mode === "airpods"
      ? AIR_CONNECTED_AT - AIR_STAGE_IN
      : ECHO_CONNECTED_AT - HANDOFF_STAGE_IN;

  const intro = spring({
    frame,
    fps,
    config: { damping: 18, mass: 0.9 },
  });
  const stageIn = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [duration - 26, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = stageIn * fadeOut;
  const scale = interpolate(intro, [0, 1], [0.93, 1]);
  const floatY = Math.sin(frame / 40) * 4;
  const press = tapPress(frame, tapAt);

  let state: BtState = "disconnected";
  if (frame >= tapAt && frame < connectedAt) state = "connecting";
  if (frame >= connectedAt) state = "connected";

  const title = mode === "airpods" ? "AirPods" : "Echo Dot";
  const deck = buildDeck({
    airpods: state,
    showEcho: false,
  });
  deck[AIRPODS_INDEX] = { kind: "bluetooth", state, title };

  const connectedGlow =
    frame >= connectedAt
      ? interpolate(frame, [connectedAt, connectedAt + 20], [1, 0.42], {
          extrapolateRight: "clamp",
        })
      : 0;
  const routeGlow =
    mode === "handoff" && frame >= ROUTE_AT - HANDOFF_STAGE_IN
      ? interpolate(
          frame,
          [
            ROUTE_AT - HANDOFF_STAGE_IN,
            ROUTE_AT - HANDOFF_STAGE_IN + 18,
            connectedAt,
          ],
          [0, 0.68, 0.3],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }
        )
      : 0;

  return (
    <AbsoluteFill style={{ opacity }}>
      <div style={{ position: "absolute", left: "50%", top: "55%" }}>
        <div
          style={{
            transform: `translate(-50%, -50%) translateY(${floatY}px) scale(${scale})`,
            transformOrigin: "center",
          }}
        >
          <div style={{ position: "relative", width: 692 }}>
            <StreamDeck
              keys={deck}
              keyPresses={{ [AIRPODS_INDEX]: press }}
              keyGlows={{
                [AIRPODS_INDEX]: Math.max(connectedGlow, routeGlow),
              }}
            />
            <StatusTrail state={state} />
            <SameKeyCard mode={mode} opacity={opacity} />
            <RoutingCard mode={mode} frame={frame} opacity={opacity} />
            <Sequence from={tapAt - 18} durationInFrames={52} layout="none">
              <TapWrap x={HERO_X} />
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
  (frame: number) =>
    interpolate(frame, [a, b, c, d], [0, peak, peak, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

export const BluetoothPromo: React.FC = () => {
  const frame = useCurrentFrame();
  const footerOpacity = interpolate(
    frame,
    [AIR_STAGE_IN, AIR_STAGE_IN + 30, CLOSE_AT - 30, CLOSE_AT],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <AbsoluteFill style={{ background: COLORS.bgBottom }}>
      <Background />

      <Sequence from={0} durationInFrames={INITIAL_SETUP_DURATION}>
        <SoftwareSetup
          title="AirPods"
          device="AirPods Pro"
          audioProfile="Stereo + microphone (A2DP + Hands-Free)"
          selectedIndex={AIRPODS_INDEX}
          showEcho={false}
          stepLabel="Current setup"
          stepTitle="Configure one Bluetooth key"
          stepSubtitle="Choose the paired device and its Windows audio profile."
          showDrag
          duration={INITIAL_SETUP_DURATION}
        />
      </Sequence>

      <Sequence from={AIR_STAGE_IN} durationInFrames={AIR_STAGE_DURATION}>
        <ConnectionStage mode="airpods" duration={AIR_STAGE_DURATION} />
      </Sequence>
      <Sequence from={AIR_STAGE_IN + 12} durationInFrames={258}>
        <Caption
          eyebrow="One press"
          title="Connect AirPods"
          subtitle="After Bluetooth connects, Windows playback is selected and verified"
        />
      </Sequence>
      <Sequence from={AIR_CONNECTED_AT} durationInFrames={90}>
        <Popup
          title="Connected!"
          subtitle="Windows playback: AirPods Pro"
          color={COLORS.connected}
          icon="check"
          outAt={66}
        />
      </Sequence>

      <Sequence from={EDIT_IN} durationInFrames={EDIT_DURATION}>
        <SoftwareSetup
          title="Echo Dot"
          device="Echo Dot"
          audioProfile="Stereo only (A2DP)"
          selectedIndex={AIRPODS_INDEX}
          showEcho={false}
          stepLabel="Same key"
          stepTitle="Change AirPods to Echo Dot"
          stepSubtitle="The previous target is retained for the next press."
          duration={EDIT_DURATION}
        />
      </Sequence>

      <Sequence from={HANDOFF_STAGE_IN} durationInFrames={HANDOFF_STAGE_DURATION}>
        <ConnectionStage mode="handoff" duration={HANDOFF_STAGE_DURATION} />
      </Sequence>
      <Sequence
        from={HANDOFF_STAGE_IN + 12}
        durationInFrames={CLOSE_AT - HANDOFF_STAGE_IN - 12}
      >
        <Caption
          eyebrow="Automatic handoff"
          title="Press the same key again"
          subtitle="AirPods disconnects, Echo connects, then Windows output is verified"
          accent={COLORS.connected}
        />
      </Sequence>
      <Sequence from={ECHO_CONNECTED_AT} durationInFrames={126}>
        <Popup
          title="Connected!"
          subtitle="Windows playback: Echo Dot"
          color={COLORS.connected}
          icon="check"
          outAt={96}
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
      {[AIR_TAP, HANDOFF_TAP].map((at) => (
        <Sequence key={at} from={at} durationInFrames={20}>
          <Audio src={staticFile("audio/click.mp3")} volume={0.8} />
        </Sequence>
      ))}
      {[AIR_CONNECTED_AT, ECHO_CONNECTED_AT].map((at) => (
        <Sequence key={at} from={at} durationInFrames={70}>
          <Audio src={staticFile("audio/connected.mp3")} volume={0.9} />
        </Sequence>
      ))}
      {[AIR_STAGE_IN - 8, HANDOFF_STAGE_IN - 8, CLOSE_AT].map((at) => (
        <Sequence key={at} from={at} durationInFrames={50}>
          <Audio src={staticFile("audio/whoosh.mp3")} volume={0.5} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
