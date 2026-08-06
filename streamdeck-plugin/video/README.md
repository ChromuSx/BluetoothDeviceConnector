# Marketplace Promo Video

Code-driven Marketplace media for the **Bluetooth Device Connector** Stream Deck
plugin, built with [Remotion](https://www.remotion.dev/) (React → PNG/MP4). The
exports match the current [Elgato product media guidelines](https://docs.elgato.com/guidelines/products/):
**1920×1080 MP4 under 250 MB** and **1920×960 PNG** stills.

## Setup

```bash
npm install
```

The first render auto-downloads a Chromium Headless Shell (~110 MB).

## Commands

| Command | What it does |
|---|---|
| `npm run studio` | Open the live preview/editor at `localhost:3000` |
| `npm run render` | Render and audio-normalize the video → `out/promo.mp4` (H.264, CRF 20) |
| `npm run thumbnail` | Render the still → `out/thumbnail.png` (1920×960) |
| `npm run marketplace:hero` | Render `marketplace/gallery-hero.png` |
| `npm run marketplace:inspector` | Render `marketplace/gallery-property-inspector.png` |
| `npm run marketplace:thumbnail` | Render `marketplace/promo-thumbnail.png` |
| `npm run marketplace:video` | Render and normalize `marketplace/promo.mp4` |
| `npm run marketplace` | Regenerate all four Marketplace media files |

## Storyboard (27s @ 60fps)

| Time | Beat |
|---|---|
| 0–4.7s | Configure one key for **AirPods Pro** with **Stereo + microphone (A2DP + Hands-Free)** |
| 4.2–9.2s | Press the key, connect AirPods, then select and verify the matching Windows playback endpoint |
| 9.2–14.3s | Edit that same key to **Echo Dot** with **Stereo only (A2DP)** |
| 14–21s | Press the same key: disconnect the previous target, connect Echo, select the Windows output, and verify it |
| 21–24.2s | Confirm the verified Echo playback endpoint |
| 24.2–27s | Closing card with the current profile, handoff, and key-feedback benefits |

## Structure

```
src/
  Root.tsx              Promo and Marketplace still compositions
  BluetoothPromo.tsx    Main timeline: continuous device + timed overlays + audio
  theme.ts              Colors, font, fps tokens
  components/
    Background.tsx      Light gradient + drifting glow
    StreamDeck.tsx      Device body + 5×3 key grid (buildDeck helper)
    Key.tsx             Single key (bluetooth state PNG / app glyph / empty)
    Popup.tsx           Centered notification card with blurred backdrop
    PropertyInspector.tsx  Legacy animated picker experiment (not published)
    SoftwareSetup.tsx   Stream Deck software setup view with title + device fields
    StatusTrail.tsx     Three-state connection progress rail
    TapIndicator.tsx    Finger-tap ripple
    Caption.tsx         Animated headlines
    Closing.tsx         End card
    Thumbnail.tsx       Static 1920×960 marketplace thumbnail
    MarketplaceStills.tsx  Hero and current Property Inspector gallery images
public/
  keys/*.png            Real plugin key art (disconnected/connecting/connected/error)
  plugin-icon.png       Plugin icon (closing card)
  audio/*.mp3           Synthesized SFX + ambient pad (original, royalty-free)
```

## Assets

- **Key art** is copied from the plugin's `imgs/` (the actual marketplace key states),
  so the on-device icon is pixel-accurate.
- **Audio** is fully synthesized with ffmpeg (no licensing concerns). The publish
  commands add 12 dB during AAC encoding so the ambient track remains audible while
  retaining safe peak headroom.
- The video and stills are deterministic product illustrations. They are not a
  substitute for a real camera/screen capture if Marketplace review requests proof
  of behavior with physical Bluetooth and Stream Deck hardware.

## Editing tips

- Timeline constants (tap, connect, route, and panel timing) live at the top of
  `BluetoothPromo.tsx`.
- Keep Property Inspector labels and option values aligned with
  `../com.chromusx.bluetooth-connector.sdPlugin/ui/property-inspector.html`.
- Marketplace composition IDs and exact output mapping are recorded in
  `../marketplace/ASSET-MANIFEST.md`.
