# Sonic Lab 20.4

Coordinate convention: listener center, 0° front, negative azimuth left, positive right, positive elevation up.

| Ring | Channels | Coordinates |
|---|---:|---|
| Ear | E1–E8 | 8 positions, elevation 0°, 45° azimuth spacing |
| Ground | G1–G4 | -30° elevation, quadrants |
| High | H1–H6 | +35° elevation, 60° spacing |
| Roof | T1–T2 | +70°, left/right |
| Sub | SUB1–SUB4 | four low-frequency quadrants |

Output order is exactly the order above: 20 full-range channels followed by four sub channels. The four sub feeds intentionally receive the same managed mono LFE programme before independent trim; their physical positions are for calibration and gain management, not decorrelated bass. The UI exports the map as JSON, supports per-ring and per-channel trims, speaker/ring inspection, channel identification, calibration noise, polarity utilities in code, and routing verification. Synthetic routing is intended for installation exploration, not a substitute for composition authored on 24 discrete buses.
