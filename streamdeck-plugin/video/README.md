# Marketplace Promo Video

Code-driven promo video for the **Bluetooth Device Connector** Stream Deck plugin,
built with [Remotion](https://www.remotion.dev/) (React → MP4). Output matches the
[Elgato Marketplace](https://docs.elgato.com/guidelines/products/) video spec:
**1920×1080 MP4, ≤ 50 MB** (plus a **1920×960** thumbnail).

## Setup

```bash
npm install
```

The first render auto-downloads a Chromium Headless Shell (~110 MB).

## Commands

| Command | What it does |
|---|---|
| `npm run studio` | Open the live preview/editor at `localhost:3000` |
| `npm run render` | Render the video → `out/promo.mp4` (H.264, CRF 23) |
| `npm run thumbnail` | Render the still → `out/thumbnail.png` (1920×960) |

## Storyboard (27s @ 60fps)

| Time | Beat |
|---|---|
| 0–5.5s | Stream Deck software setup: the Bluetooth action is dragged to key 1, then configured with Title **AirPods** and device **AirPods Pro** |
| 5–9s | The same plugin action is added again; key 2 gets Title **Echo Dot** and device **Amazon Echo Dot** |
| 9.5–14.5s | Physical Stream Deck appears with live status sync and no-Windows-settings callouts; pressing AirPods connects audio output and microphone profiles |
| 15–19.5s | Pressing the same AirPods key again disconnects it with a slower visible transition |
| 19.5–24.5s | Pressing Echo Dot connects a speaker-only Bluetooth device from its own key |
| 24.5–27s | Closing: benefit-led copy, live-status feature chips, Marketplace call-to-action |

## Structure

```
src/
  Root.tsx              Compositions (BluetoothPromo + BluetoothThumbnail)
  BluetoothPromo.tsx    Main timeline: continuous device + timed overlays + audio
  theme.ts              Colors, font, fps tokens
  components/
    Background.tsx      Light gradient + drifting glow
    StreamDeck.tsx      Device body + 5×3 key grid (buildDeck helper)
    Key.tsx             Single key (bluetooth state PNG / app glyph / empty)
    Popup.tsx           Centered notification card with blurred backdrop
    PropertyInspector.tsx  Device-picker dropdown panel
    SoftwareSetup.tsx   Stream Deck software setup view with title + device fields
    StatusTrail.tsx     Three-state connection progress rail
    TapIndicator.tsx    Finger-tap ripple
    Caption.tsx         Animated headlines
    Closing.tsx         End card
    Thumbnail.tsx       Static 1920×960 marketplace thumbnail
public/
  keys/*.png            Real plugin key art (disconnected/connecting/connected/error)
  plugin-icon.png       Plugin icon (closing card)
  audio/*.mp3           Synthesized SFX + ambient pad (original, royalty-free)
```

## Assets

- **Key art** is copied from the plugin's `imgs/` (the actual marketplace key states),
  so the on-device icon is pixel-accurate.
- **Audio** is fully synthesized with ffmpeg (no licensing concerns). To use a licensed
  music track instead, drop it in `public/audio/music.mp3` and re-render.

## Editing tips

- Timeline constants (tap, connect, panel in/out) live at the top of `BluetoothPromo.tsx`.
- Device-picker entries live in `SoftwareSetup.tsx` (`DEVICES`).
- Captions are plain `<Sequence>` blocks in `BluetoothPromo.tsx` — edit text/timing there.
