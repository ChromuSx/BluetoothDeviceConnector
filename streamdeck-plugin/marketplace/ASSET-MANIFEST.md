# Marketplace Asset Manifest

Deterministic source and export map for the Bluetooth Device Connector listing.
Run the commands from `streamdeck-plugin/video`.

## Regenerate

```bash
npm run marketplace
```

The video publish step requires `ffmpeg`; it keeps the rendered H.264 video and
re-encodes AAC audio with a 12 dB gain and fast-start metadata.

## Published media

| File | Composition/source | Required output |
|---|---|---|
| `gallery-hero.png` | `MarketplaceHero` in `video/src/components/MarketplaceStills.tsx` | PNG, 1920×960 |
| `gallery-property-inspector.png` | `MarketplacePropertyInspector` in `video/src/components/MarketplaceStills.tsx` | PNG, 1920×960 |
| `promo-thumbnail.png` | `BluetoothThumbnail` in `video/src/components/Thumbnail.tsx` | PNG, 1920×960 |
| `promo.mp4` | `BluetoothPromo` in `video/src/BluetoothPromo.tsx` | MP4, 1920×1080, 60 fps, H.264 + AAC |
| `thumbnail-512x512.png` | Existing high-resolution plugin icon | PNG, 512×512; not the 1920×960 listing thumbnail |

## Content provenance

- Product icon: `video/public/plugin-icon-large.png`.
- Key-state art: `video/public/keys/*.png`, copied from the packaged plugin.
- Property Inspector labels, choices, and helpers:
  `com.chromusx.bluetooth-connector.sdPlugin/ui/property-inspector.html`.
- Promo music and effects: locally synthesized files under `video/public/audio`.
- Device names shown in public media are generic/demo names; no personal device
  name is embedded.

The visual promo is a deterministic product illustration. Keep a separate real
hardware recording for Marketplace moderation if Elgato requests operational
proof.

## SHA-256 (2026-08-06 export)

Regenerate hashes after any media change.

```text
gallery-hero.png                 D528FB597A9E2A286A3E5EFBDBF7BD0478C982C8F011B14D43062E006E3947C5
gallery-property-inspector.png   8F47550FDDE30C59B05CFF85DA5A09C5A4E6AD22A5B87EC917094E7B6AD0391C
promo-thumbnail.png              6302FF4E6F2B719740F2BE7E85673D857285AC9D774ADCFEFA9E191A8A8F2866
promo.mp4                        7277DCF6EC67BAB2AD07B2742413879014593AC962CA5F45223717FCD6044F9E
thumbnail-512x512.png            DA014481094E921251136F58546819C8B833B33E407F79DDC45867FE1C34CE87
```
