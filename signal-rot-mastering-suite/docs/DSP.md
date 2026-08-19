# Signal Rot mastering DSP

## Scope and audit

The mastering application source was not present in this checkout; it contained only the RadioReach storefront. The DSP package under `src/signal-rot` is therefore a clean implementation rather than a cosmetic edit of an unavailable chain. It is intentionally independent of the storefront UI.

The failure pattern described in the brief is consistent with cumulative, uncompensated gain: low shelves plus head bump plus saturation increase RMS and peak level; normalization then drives a limiter; independent global/per-band/Haas widening and loud early taps damage correlation. The new architecture prevents those combinations by construction.

## Signal flow

1. Explicit input trim
2. DC blocker and sample-rate-clamped subsonic/corrective biquads
3. Stereo-linked, bounded dynamic resonance zones
4. linear-phase complementary FIR three-band split and restrained per-band compression
5. bounded transient-integrity recovery
6. frequency-dependent M/S imaging
7. optional level-normalized atmospheric field
8. **optional and isolated** character/degradation
9. capped loudness normalization with automatic pre-limiter headroom
10. look-ahead, stereo-linked, interpolated-peak limiter
11. output trim and post-chain true-peak verification

Every stage records input peak, output peak, and RMS delta. The report also exposes normalization gain and maximum/average limiter reduction.

## Technical, spatial, and character layers

Technical mastering is always the base path. Character is disabled in all primary presets and cannot be enabled as a side effect of a tone or width macro. Spatial processing is independently bypassable and energy-normalized. `Tape Ghost` and `Broken Media` are explicitly experimental; `Analog Womb` alone opts into an extremely low-mix transformer treatment and reports that fact.

## Dynamics and reconstruction

The offline crossover uses complementary windowed-sinc filters: low = LP(f1), mid = LP(f2) - LP(f1), high = input - LP(f2). The three branches therefore reconstruct the input (apart from floating-point rounding) when dynamics are bypassed. Each band has threshold, ratio, attack, release, knee, makeup, parallel mix, maximum reduction and bypass. Detection is stereo linked. No hidden makeup is used.

Dynamic resonance control uses linked detector zones with mastering-speed ballistics and hard maximum reduction. It responds only above its threshold and targets stereo, mid, or side accumulation.

## Limiter and loudness

Transparent is the default limiter mode. Detection evaluates interpolated between-sample peaks at 2x, 4x, or 8x according to quality. Gain is stereo linked, look-ahead-derived, release-smoothed, and followed by a true-peak ceiling verification. A warning is emitted above each preset's expected reduction. Loudness is an estimate (RMS-derived, not a standards-certified BS.1770 integrated meter); normalization is capped and, with automatic headroom enabled, cannot intentionally erase the configured 3 dB pre-limiter margin.

Default targets are -18 to -14 LUFS-equivalent. Louder results are not imposed by hi-fi presets.

## Stereo and atmospheric safety

Low-frequency side gain is gently reduced rather than abruptly monoed. Core mid information is preserved, while high side energy receives only bounded changes. The atmosphere network uses four quiet, sign-alternating, cross-channel taps, frequency shaping, direct-signal dominance, and output-energy normalization. It does not use a static Haas pair. Diagnostics warn on low correlation and excess low-frequency side energy. Mono, L/R, mid, side, and polarity auditions are available.

`Focus`, `Atmosphere`, `Depth`, `Diffusion`, `Scale`, `Air Field`, and `Center Anchor` are bounded macros. Focus controls cross-channel ambient energy, diffusion adjusts tap spacing and decay distribution, scale sets delay scale, air field shapes the decorrelated edge, and center anchor/low-frequency stability coordinate the M/S stage.

## Loudness-matched A/B

`loudnessMatch` matches processed and reference RMS within a bounded range. `SignalRotEngine.createMatchedBypass` creates a matched original using the same decoded source used for rendering. Preview and export call the same `renderMaster` function, avoiding separate browser/offline signal paths.

## Diagnostics

The renderer reports sample peak, interpolated true peak, RMS and estimated loudness, crest factor, stereo correlation, per-channel DC, clipping count, true-peak overs, low-frequency side/mid ratio, side energy, pre/post level audit, normalization gain, and limiter reduction.

## Quality modes

- **Draft:** 33-tap crossover, 1x nonlinear processing, 2x peak analysis.
- **High:** 65 taps, 2x nonlinear processing, 4x peak analysis; default final render.
- **Audiophile:** 129 taps, 4x nonlinear processing, 8x peak analysis; higher CPU/memory cost.

Oversampling is processing-only. Output sample rate is preserved. The package does not claim that 96/192 kHz export creates detail. A dedicated band-limited sample-rate converter and post-codec peak scan are not yet included.

## Preset philosophy

Presets state use, input expectation, loudness target, likely maximum limiter reduction, tonal/spatial objective, bypassed modules, and risks. Primary presets use few restrained stages. Warmth/body boosts, implicit noise, default saturation, global plus per-band width stacking, and loud early reflections are absent.

## Known limitations

- Loudness is estimated and is not a gated EBU R128/ITU-R BS.1770 implementation.
- Interpolated true peak is conservative but is not a certified reconstruction filter meter.
- Browser codec encoding and post-encoding peak verification are outside this package.
- The FIR implementation is direct convolution; long material should move this work to a Worker/WASM partitioned convolver.
- Dynamic resonance control is broad-zone control, not FFT-bin resonance suppression.
- Minimum-phase EQ is implemented; a user-selectable full linear-phase EQ is not yet included.
- No multichannel renderer or binaural HRTF is included; immersive-bed presets prepare stereo material only.
