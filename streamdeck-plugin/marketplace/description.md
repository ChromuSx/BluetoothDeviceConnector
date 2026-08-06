<!--
Elgato Marketplace listing copy for Bluetooth Device Connector.
Constraints (per docs.elgato.com/guidelines/products): description 250–1500 chars,
first 250 chars weighted for search, bullets OK, plain text (no guaranteed markdown),
list requirements, no filler. Paste the OVERVIEW block into the product description.
-->

# Tagline (short summary)

One-press Bluetooth connect & disconnect for your Stream Deck — after pairing, switch headphones, speakers, and mics without reopening Windows settings.

# Overview (paste into the Marketplace description field)

Switch your Bluetooth audio straight from your Stream Deck — no more digging through Windows settings. Press a key to connect your AirPods, headset, speaker, or Bluetooth mic; press again to disconnect. The key shows live status, so you always know what's connected.

Give each device its own key or reuse a key for an exclusive handoff — switch with one press for streaming, calls, and back-to-back meetings.

Features:
• One press to connect, press again to disconnect
• Live key feedback — Disconnected, Connecting, Connected, Error — with safe audio-profile reconciliation after a restart
• Pick any paired device from a dropdown, no typing required
• Choose per key between stereo-only audio (A2DP) and stereo plus microphone (Hands-Free)
• Change a key's device and its next press disconnects the previous target before connecting the new one
• After connecting on Windows, select and verify the matching default playback endpoint and try the Hands-Free microphone when exposed
• Speaker-only support for devices without a headset profile, like Amazon Echo Dot and JBL speakers
• Add as many keys as you need, one per device
• Sound and on-key text feedback for every action

Requirements: Windows 10 or later, Stream Deck 6.9 or later.

# Version notes — v1.1.0.5

After a successful Windows connection, the plugin now selects and verifies the matching default playback endpoint; with Stereo + microphone it also tries the device microphone when Windows exposes one. This fixes cases where audio remained routed to the previously active device after switching Bluetooth targets. Migration from the implicit legacy device now preserves the pending handoff, so the previous target is disconnected before the new one connects.

# Version notes — v1.1.0.4

Added exclusive same-key device handoff. After changing the Bluetooth device assigned to a key, its next press disconnects that key's previous audio target before connecting the new one, preventing sound from remaining on the old headphones. Also includes the per-key Stereo only (A2DP) or Stereo + microphone profile selector and safer handling of rapid settings changes.

# Version notes — v1.0.5.0

Added a device picker so you can choose a paired device from a dropdown instead of typing its name, plus live connection state that re-syncs after a Stream Deck restart. Speaker-only devices like Amazon Echo Dot now connect reliably, and device names with special characters work correctly.
